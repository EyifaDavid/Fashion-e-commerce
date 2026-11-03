// [NORTH] Browser smoke check using an already-running Chrome CDP endpoint.
// Uses an isolated fixture session for cart checks; never changes the real cart.
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";

const origin = process.env.NORTH_PREVIEW_ORIGIN || "http://localhost:4000";
const cdpOrigin = process.env.NORTH_CDP_ORIGIN || "http://127.0.0.1:9222";
const output = resolve("artifacts/north-phase4");
await mkdir(output, { recursive: true });
const delay = (ms) => new Promise((done) => setTimeout(done, ms));

async function connect(url) {
  const socket = new WebSocket(url);
  await new Promise((done, fail) => {
    socket.addEventListener("open", done, { once: true });
    socket.addEventListener("error", fail, { once: true });
  });
  let nextId = 0;
  const pending = new Map();
  const listeners = new Map();
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const request = pending.get(message.id);
      if (!request) return;
      pending.delete(message.id);
      clearTimeout(request.timeout);
      if (message.error) request.fail(new Error(message.error.message));
      else request.done(message.result);
    } else {
      for (const listener of listeners.get(message.method) || []) listener(message.params);
    }
  });
  return {
    send(method, params = {}) {
      return new Promise((done, fail) => {
        const id = ++nextId;
        const timeout = setTimeout(() => { pending.delete(id); fail(new Error("CDP timeout: " + method)); }, 15000);
        pending.set(id, { done, fail, timeout });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    on(method, handler) { listeners.set(method, [...(listeners.get(method) || []), handler]); },
    close() { socket.close(); },
  };
}

const version = await (await fetch(cdpOrigin + "/json/version")).json();
const browser = await connect(version.webSocketDebuggerUrl);
const targets = [];
const clients = [];
let fixtureContext;
async function newPage(browserContextId) {
  const { targetId } = await browser.send("Target.createTarget", { url: "about:blank", ...(browserContextId ? { browserContextId } : {}) });
  targets.push(targetId);
  const list = await (await fetch(cdpOrigin + "/json/list")).json();
  const page = await connect(list.find((target) => target.id === targetId).webSocketDebuggerUrl);
  clients.push(page);
  await page.send("Page.enable");
  await page.send("Runtime.enable");
  return page;
}
async function evaluate(page, expression) {
  const result = await page.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
async function until(page, expression) {
  for (let tries = 0; tries < 150; tries++) {
    if (await evaluate(page, "Boolean(document.body && (" + expression + "))")) return;
    await delay(100);
  }
  throw new Error("Page condition timed out: " + expression);
}
async function viewport(page, width, height, mobile = false) {
  await page.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
  await page.send("Emulation.setTouchEmulationEnabled", { enabled: mobile, maxTouchPoints: 1 });
}
async function screenshot(page, name, full = false) {
  await delay(550);
  await until(page, "Array.from(document.images).filter(i => { const r=i.getBoundingClientRect(); return r.height>0 && r.bottom>0 && r.top<innerHeight; }).every(i => i.complete)");
  const options = { format: "png", captureBeyondViewport: full };
  if (full) {
    const { cssContentSize } = await page.send("Page.getLayoutMetrics");
    options.clip = { x: 0, y: 0, width: cssContentSize.width, height: cssContentSize.height, scale: 1 };
  }
  const { data } = await page.send("Page.captureScreenshot", options);
  await writeFile(resolve(output, name + ".png"), Buffer.from(data, "base64"));
}
async function clickText(page, text) {
  await evaluate(page, "Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim().toLowerCase() === " + JSON.stringify(text.toLowerCase()) + ").click()");
}
async function tapGarment(page, index) {
  const point = await evaluate(page, "(() => { const r=document.querySelectorAll('[data-rack-garment]')[" + index + "].getBoundingClientRect(); return {x:Math.max(1,Math.min(innerWidth-1,r.x+r.width/2)),y:r.y+140}; })()");
  await page.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
  await page.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}


const contextId=(await browser.send('Target.createBrowserContext')).browserContextId;
const page=await newPage(contextId);
try {
 await viewport(page,1440,1000);
 await page.send('Page.addScriptToEvaluateOnNewDocument',{source:"localStorage.setItem('userInfo',JSON.stringify({name:'Preview',email:'preview@example.invalid',isAdmin:true}));"});
 await page.send('Page.navigate',{url:origin+'/Landing'});
 await until(page,"Boolean(document.querySelector('.north-offer'))");
 await evaluate(page,'document.fonts.ready');
 for(const [selector,name] of [['.north-offer','landing-offer-adinkra'],['.north-promotions','landing-discount-adinkra'],['footer','landing-footer-adinkra']]) {
  await evaluate(page,'document.querySelector('+JSON.stringify(selector)+').scrollIntoView({block:"start"})');
  await screenshot(page,name);
 }
 // [NORTH] Capture full campaign surfaces at desktop, tablet and mobile review widths.
 for (const [width, height, suffix] of [[1440,1000,'desktop'],[768,1024,'tablet'],[375,900,'mobile']]) {
  await viewport(page,width,height,width<768);
  for (const [selector,name] of [['.north-promotions','discount-banner'],['footer','footer']]) {
   await evaluate(page,'document.querySelector('+JSON.stringify(selector)+').scrollIntoView({block:"start"})');
   await delay(550);
   const details=await evaluate(page,"(() => {const banner=document.querySelector("+JSON.stringify(selector)+");const r=banner.getBoundingClientRect();const css=getComputedStyle(banner);return {clip:{x:r.left+scrollX,y:r.top+scrollY,width:r.width,height:r.height,scale:1},background:css.backgroundImage,repeat:css.backgroundRepeat,position:css.backgroundPosition,columns:css.gridTemplateColumns,overflow:document.documentElement.scrollWidth>innerWidth};})()");
   const {data}=await page.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:details.clip});
   await writeFile(resolve(output,name+'-'+suffix+'.png'),Buffer.from(data,'base64'));
   console.log(JSON.stringify({width,selector,...details}));
  }
 }

 // [NORTH] A new document gives scroll reveals a fresh entry state.
 await viewport(page,1440,1000);
 await page.send('Page.navigate',{url:origin+'/Landing'});
 await until(page,"Boolean(document.querySelector('.north-hero-nav'))");
 await until(page,"getComputedStyle(document.querySelector('.north-hero-nav')).opacity==='1'");
 await evaluate(page,'document.fonts.ready');
 assert.equal(await evaluate(page,"getComputedStyle(document.querySelector('.north-offer-copy')).opacity"),'0');
 await evaluate(page,"document.querySelector('.north-offer-copy').scrollIntoView({block:'center'})");
 await until(page,"document.querySelector('.north-offer-copy').dataset.northScrollRevealed==='true'");
 await until(page,"getComputedStyle(document.querySelector('.north-offer-copy')).opacity==='1'");
 console.log('Campaign sections reveal when entering the viewport.');

 for(const [width,height,suffix] of [[1440,1000,'desktop'],[1024,900,'laptop'],[768,1024,'tablet'],[375,900,'mobile']]) {
  await viewport(page,width,height,width<768);
  await evaluate(page,'scrollTo(0,0)');
  const controls=await evaluate(page,"Array.from(document.querySelectorAll('.north-hero-nav [data-north-header-action]')).map(e=>{const r=e.getBoundingClientRect();return {label:e.getAttribute('aria-label'),width:r.width,height:r.height,center:r.y+r.height/2,svg:!!e.querySelector('svg')}})");
  assert.equal(controls.length,3);
  assert.ok(controls.every(control=>control.svg&&control.width===44&&control.height===44));
  assert.ok(Math.max(...controls.map(c=>c.center))-Math.min(...controls.map(c=>c.center))<1);
  assert.equal(await evaluate(page,'document.documentElement.scrollWidth>innerWidth'),false);
  const clip=await evaluate(page,"(() => {const r=document.querySelector('.north-hero-nav').getBoundingClientRect();return {x:0,y:0,width:innerWidth,height:r.height,scale:1};})()");
  const {data}=await page.send('Page.captureScreenshot',{format:'png',clip});
  await writeFile(resolve(output,'header-hero-'+suffix+'.png'),Buffer.from(data,'base64'));
  console.log(JSON.stringify({headerWidth:width,controls}));
 }

 await viewport(page,1440,1000);
 await evaluate(page,"document.querySelector('#north-featured').scrollIntoView({block:'start'})");
 await until(page,"Boolean(document.querySelector('#north-featured .north-product-card'))");
 await until(page,"getComputedStyle(document.querySelector('#north-featured [data-north-reveal]')).filter==='blur(0px)'");
 await delay(750);
 const hover=await evaluate(page,"(() => {const r=document.querySelector('#north-featured .north-card-photo').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()");
 await page.send('Input.dispatchMouseEvent',{type:'mouseMoved',...hover});
 await delay(300);
 assert.ok(await evaluate(page,"new DOMMatrix(getComputedStyle(document.querySelector('#north-featured .north-image-media')).transform).a>1.03"));
 await screenshot(page,'products-hover-desktop');
 await page.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 assert.equal(await evaluate(page,"getComputedStyle(document.querySelector('#north-featured .north-image-media')).transform"),'none');
 await page.send('Emulation.setEmulatedMedia',{features:[]});
 await page.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});
 console.log('Product hover zoom works and is disabled under reduced motion.');

 await page.send('Page.navigate',{url:origin+'/shop'});
 await until(page,"Boolean(document.querySelector('.north-filter-options'))");
 await until(page,"Boolean(document.querySelector('.north-catalogue-card'))");
 for(const [width,height,suffix] of [[1440,1000,'desktop'],[1024,900,'laptop'],[768,1024,'tablet'],[375,900,'mobile']]) {
  await viewport(page,width,height,width<768);
  await evaluate(page,'scrollTo(0,0)');
  assert.equal(await evaluate(page,'document.documentElement.scrollWidth>innerWidth'),false);
  assert.equal(await evaluate(page,"getComputedStyle(document.querySelector('.north-shop-menu-toggle')).display==='none'"),width>=1024);
  const controls=await evaluate(page,"Array.from(document.querySelectorAll('.north-shop-nav [data-north-header-action]')).map(e=>{const r=e.getBoundingClientRect();return {width:r.width,height:r.height,center:r.y+r.height/2,svg:!!e.querySelector('svg')}})");
  assert.ok(controls.every(control=>control.width===44&&control.height===44&&control.svg));
  assert.ok(Math.max(...controls.map(c=>c.center))-Math.min(...controls.map(c=>c.center))<1);
  await screenshot(page,'collection-filters-'+suffix);
 }
 await evaluate(page,"Array.from(document.querySelectorAll('.north-filter-options button')).find(b=>b.textContent.toLowerCase().startsWith('clothing')).click()");
 assert.equal(await evaluate(page,"document.querySelector('.north-filter-options button[aria-pressed=\"true\"]').textContent.toLowerCase().startsWith('clothing')"),true);
 assert.equal(await evaluate(page,"getComputedStyle(document.querySelector('.north-filter-options button[aria-pressed=\"true\"]')).borderBottomColor"),'rgb(0, 0, 0)');
 await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
 await page.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
 const profile=await evaluate(page,"(() => {const r=document.querySelector('[data-north-header-action=\"profile\"]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()");
 await page.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...profile});
 await page.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...profile});
 await until(page,"Boolean(document.querySelector('[role=\"menu\"]'))");
 await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 await page.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 await until(page,"!document.querySelector('[role=\"menu\"]')");
 console.log('Header icons align; filter tabs select; profile menu closes with Escape.');

 // [NORTH] Read-only delayed responses verify that page loaders keep the footer below view.
 const sample={_id:'bbbbbbbbbbbbbbbbbbbbbbbb',name:'Loader preview',price:80,stock:10,sizes:['M'],colors:['black'],images:[origin+'/rack-garments/black-bomber-front.png'],modelPreviewFemale:origin+'/rack-garments/black-bomber-front.png'};
 const paused=[];
 const runtimeErrors=[];
 page.on('Runtime.exceptionThrown',({exceptionDetails})=>runtimeErrors.push(exceptionDetails.text));
 await page.send('Fetch.enable',{patterns:[{urlPattern:'*products*',requestStage:'Request'}]});
 page.on('Fetch.requestPaused',async ({requestId,request})=>{
  if(request.method==='GET'&&/\/products(?:\/[a-f0-9]{24})?$/.test(new URL(request.url).pathname)) paused.push({requestId,path:new URL(request.url).pathname});
  else await page.send('Fetch.continueRequest',{requestId});
 });
 for(const [path,label] of [['/product/'+sample._id,'product'],['/shop','collection'],['/wardrobe','wardrobe']]) {
  await page.send('Page.navigate',{url:origin+path});
  await until(page,"Boolean(document.querySelector('.north-page-loader'))");
  for(const [width,height,suffix] of [[1440,1000,'desktop'],[768,1024,'tablet'],[375,900,'mobile']]) {
   await viewport(page,width,height,width<768);
   await evaluate(page,'scrollTo(0,0)');
   const layout=await evaluate(page,"({footerTop:document.querySelector('footer').getBoundingClientRect().top,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,label:document.querySelector('.north-page-loader').textContent,role:document.querySelector('.north-page-loader').getAttribute('role')})");
   assert.ok(layout.footerTop>=layout.height-1,'Footer appeared during '+label+' loading at '+width);
   assert.equal(layout.overflow,false);
   assert.equal(layout.role,'status');
   if(label==='product') await screenshot(page,'loader-'+suffix);
   console.log(JSON.stringify({page:label,width,...layout}));
  }
  await page.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  assert.equal(await evaluate(page,"getComputedStyle(document.querySelector('.north-page-loader [aria-hidden]')).animationName"),'none');
  await page.send('Emulation.setEmulatedMedia',{features:[]});
  await until(page,"Boolean(document.querySelector('.north-page-loader'))");
  for(const request of paused.splice(0)) await page.send('Fetch.fulfillRequest',{requestId:request.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:origin},{name:'Access-Control-Allow-Credentials',value:'true'}],body:Buffer.from(JSON.stringify({status:true,data:request.path.endsWith(sample._id)?sample:[sample]})).toString('base64')});
  await until(page,"!document.querySelector('.north-page-loader')");
 }
 await page.send('Fetch.disable');
 assert.deepEqual(runtimeErrors,[]);
 console.log('Loading layouts and reduced motion passed without runtime exceptions.');

 // [NORTH] All cart requests are fulfilled locally, including mutations and a failed update.
 const cartPage=await newPage(contextId);
 const cartErrors=[];
 cartPage.on('Runtime.exceptionThrown',({exceptionDetails})=>cartErrors.push(exceptionDetails.text));
 let cartItems=[{quantity:2,product:{...sample,name:'Heavyweight bomber',price:5000,discount:20,stock:3,category:'clothing'}},
   {quantity:1,product:{...sample,_id:'cccccccccccccccccccccccc',name:'Everyday hoodie',price:120,discount:0,stock:5,category:'clothing',images:[origin+'/rack-garments/blue-hoodie-front.png']}}];
 let failUpdate=false;
 await cartPage.send('Fetch.enable',{patterns:[{urlPattern:'*cart*',requestStage:'Request'}]});
 cartPage.on('Fetch.requestPaused',async ({requestId,request})=>{
  const path=new URL(request.url).pathname;
  if(!/\/cart(?:\/[a-f0-9]{24})?$/.test(path)) return cartPage.send('Fetch.continueRequest',{requestId});
  let responseCode=200;
  if(request.method==='POST') {
   if(failUpdate){responseCode=500;failUpdate=false;}
   else {const change=JSON.parse(request.postData);cartItems=cartItems.map(item=>item.product._id===change.productId?{...item,quantity:item.quantity+change.quantity}:item);}
  }
  if(request.method==='DELETE') cartItems=cartItems.filter(item=>!path.endsWith(item.product._id));
  await cartPage.send('Fetch.fulfillRequest',{requestId,responseCode,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:origin},{name:'Access-Control-Allow-Credentials',value:'true'},{name:'Access-Control-Allow-Headers',value:'content-type,authorization'},{name:'Access-Control-Allow-Methods',value:'GET,POST,DELETE,OPTIONS'}],body:Buffer.from(JSON.stringify(responseCode===500?{error:'Fixture failure'}:{items:cartItems})).toString('base64')});
 });
 await cartPage.send('Page.navigate',{url:origin+'/Cart'});
 await until(cartPage,"document.querySelectorAll('[data-cart-row]').length===2");
 for(const [width,height,suffix] of [[1440,1000,'desktop'],[768,1024,'tablet'],[375,900,'mobile']]) {
  await viewport(cartPage,width,height,width<768);
  await evaluate(cartPage,'scrollTo(0,0)');
  assert.equal(await evaluate(cartPage,'document.documentElement.scrollWidth>innerWidth'),false);
  assert.equal(await evaluate(cartPage,"document.querySelector('.north-cart-total dd').textContent"),'GH₵8,120.00');
  await screenshot(cartPage,'cart-refined-'+suffix);
 }
 await evaluate(cartPage,"document.querySelector('[aria-label=\"Increase quantity of Heavyweight bomber\"]').click()");
 await until(cartPage,"document.querySelector('.north-cart-quantity > span').textContent==='3'");
 await until(cartPage,"document.querySelector('[aria-label=\"Decrease quantity of Heavyweight bomber\"]').disabled===false");
 assert.equal(await evaluate(cartPage,"document.querySelector('[aria-label=\"Increase quantity of Heavyweight bomber\"]').disabled"),true);
 await evaluate(cartPage,"document.querySelector('[aria-label=\"Decrease quantity of Heavyweight bomber\"]').click()");
 await until(cartPage,"document.querySelector('.north-cart-quantity > span').textContent==='2'");
 await until(cartPage,"document.querySelector('[aria-label=\"Increase quantity of Heavyweight bomber\"]').disabled===false");
 failUpdate=true;
 await evaluate(cartPage,"document.querySelector('[aria-label=\"Increase quantity of Heavyweight bomber\"]').click()");
 await until(cartPage,"document.querySelector('[aria-label=\"Increase quantity of Heavyweight bomber\"]').disabled===false");
 assert.equal(await evaluate(cartPage,"document.querySelector('.north-cart-quantity > span').textContent"),'2');
 await evaluate(cartPage,"document.querySelector('.north-cart-review').click()");
 assert.equal(await evaluate(cartPage,"document.querySelector('.north-cart-checkout').open"),true);
 await evaluate(cartPage,"document.querySelector('.north-payment-options input[value=\"mobile\"]').click()");
 assert.equal(await evaluate(cartPage,"Boolean(document.querySelector('.north-delivery-fields select'))"),true);
 await evaluate(cartPage,"document.querySelector('[aria-label=\"Remove Everyday hoodie from bag\"]').click()");
 await until(cartPage,"document.querySelectorAll('[data-cart-row]').length===1");
 await evaluate(cartPage,"document.querySelector('[aria-label=\"Remove Heavyweight bomber from bag\"]').click()");
 await until(cartPage,"Boolean(document.querySelector('.north-cart-empty'))");
 await evaluate(cartPage,'scrollTo(0,0)');
 await screenshot(cartPage,'cart-empty-mobile');
 assert.equal(await evaluate(cartPage,"document.querySelector('.north-cart-empty a').getAttribute('href')"),'/shop');
 assert.deepEqual(cartErrors,[]);
 console.log('Cart totals, stock limits, quantity updates, rollback, remove, payment choices and empty state passed using local fixtures.');
} finally {
 for(const client of clients)client.close();
 for(const targetId of targets)await browser.send('Target.closeTarget',{targetId});
 await browser.send('Target.disposeBrowserContext',{browserContextId:contextId});
 browser.close();
}
