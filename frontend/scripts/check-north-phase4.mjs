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

const report = { checks: [], screenshots: [], errors: [] };
const check = (name) => { report.checks.push(name); console.log("PASS " + name); };
const contextId = (await browser.send("Target.createBrowserContext")).browserContextId;
const page = await newPage(contextId);
const runtimeErrors = [];
page.on("Runtime.exceptionThrown", ({ exceptionDetails }) => runtimeErrors.push(exceptionDetails.exception?.description || exceptionDetails.text));
await page.send("Page.addScriptToEvaluateOnNewDocument", { source: "localStorage.setItem('userInfo', JSON.stringify({name:'Preview',email:'preview@example.invalid',isAdmin:false}));" });
const openHome = async () => {
  await page.send("Page.navigate", { url: origin + "/Landing" });
  await until(page, "Boolean(document.querySelector('#north-hero-title'))");
  await until(page, "getComputedStyle(document.querySelector('.north-hero-nav')).visibility !== 'hidden'");
};
const revealSection = async (id) => {
  await evaluate(page, "document.getElementById(" + JSON.stringify(id) + ").scrollIntoView({block:'start'})");
  await until(page, "Array.from(document.querySelectorAll('#" + id + " [data-north-reveal]')).every(i => i.complete && i.naturalWidth > 0)");
  await until(page, "Array.from(document.querySelectorAll('#" + id + " [data-north-reveal]')).every(i => Number(getComputedStyle(i).opacity) > .99)");
  await until(page, "Array.from(document.querySelectorAll('#" + id + " [data-north-reveal]')).every(i => getComputedStyle(i).filter === 'blur(0px)')");
};
try {
  await viewport(page, 1440, 1000);
  await openHome();
  assert.equal(await evaluate(page, "document.querySelector('.north-block-overlay').dataset.active"), "false");
  check("First load skips the block dissolve");
  await until(page, "getComputedStyle(document.querySelector('.north-hero-nav')).opacity === '1'");
  await evaluate(page, "document.fonts.ready");
  assert.equal(await evaluate(page, "getComputedStyle(document.querySelector('#north-hero-title')).fontFamily.includes('Fonarto')"), true);
  assert.equal(await evaluate(page, "document.fonts.check('400 24px Fonarto')"), true);
  check("Fonarto loads locally and is used for campaign headings");
  await delay(1000);
  assert.equal(await evaluate(page, "sessionStorage.getItem('north:intro:seen')"), "1");
  check("Intro finishes and records the session");
  await screenshot(page, "landing-hero-desktop");
  report.screenshots.push("landing-hero-desktop.png");
  // [NORTH] The embedded rail shares artwork and interactions with /rack.
  assert.equal(await evaluate(page, "Boolean(document.querySelector('#north-rack + #north-featured'))"), true);
  assert.equal(await evaluate(page, "document.querySelectorAll('#north-rack button[data-rack-garment]').length"), 13);
  assert.equal(await evaluate(page, "Array.from(document.querySelectorAll('#north-rack img')).every(i => i.getAttribute('src').startsWith('/rack-garments/'))"), true);
  await evaluate(page, "document.getElementById('north-rack').scrollIntoView({block:'start'})");
  await screenshot(page, "landing-rack-desktop");
  report.screenshots.push("landing-rack-desktop.png");
  check("Landing rack appears directly before Most Loved with the original 13 cutouts");
  await evaluate(page, "document.querySelector('#north-rack button[data-rack-garment]').click()");
  await until(page, "Boolean(document.querySelector('#north-rack img[alt*=\", front view\"]'))");
  assert.equal(await evaluate(page, "document.activeElement.textContent.includes('Back to rack')"), true);
  assert.equal(await evaluate(page, "document.querySelector('#north-rack img[alt*=\", front view\"]').getAttribute('src')"), "/rack-garments/black-bomber-front.png");
  await clickText(page, "Back");
  assert.equal(await evaluate(page, "document.querySelector('#north-rack img[alt*=\", back view\"]').getAttribute('src')"), "/rack-garments/black-bomber-back.png");
  await clickText(page, "Front");
  await screenshot(page, "landing-rack-panel-desktop");
  report.screenshots.push("landing-rack-panel-desktop.png");
  await clickText(page, "← Back to rack");
  await delay(550);
  assert.equal(await evaluate(page, "Math.round(document.activeElement.getBoundingClientRect().width)"), 260);
  check("Embedded rack opens its Front/Back panel and restores focus to the turned garment");
  assert.equal(await evaluate(page, "getComputedStyle(document.querySelector('.north-page')).backgroundImage.includes('adinkra-subtle.svg')"), true);
  assert.equal(await evaluate(page, "getComputedStyle(document.querySelector('#north-rack')).backgroundImage.includes('adinkra-subtle.svg')"), true);
  assert.equal(await evaluate(page, "getComputedStyle(document.querySelector('#north-featured .north-image-media')).backgroundImage"), "none");
  assert.equal(await evaluate(page, "getComputedStyle(document.querySelector('.north-offer')).backgroundImage.includes('adinkra.svg')"), true);
  assert.equal(await evaluate(page, "getComputedStyle(document.querySelector('.north-promotions')).backgroundImage.includes('adinkra-banner.svg')"), true);
  assert.equal(await evaluate(page, "getComputedStyle(document.querySelector('.north-discount-banner')).backgroundImage"), "none");
  assert.equal(await evaluate(page, "getComputedStyle(document.querySelector('footer')).backgroundImage.includes('adinkra-footer.svg')"), true);
  assert.equal(await evaluate(page, "getComputedStyle(document.querySelector('.north-hero'),'::after').backgroundImage.includes('adinkra-light.svg')"), true);
  assert.equal(await evaluate(page, "getComputedStyle(document.querySelector('.north-hero'),'::after').pointerEvents"), "none");
  assert.equal(await evaluate(page, "getComputedStyle(document.querySelector('.north-block-tile')).backgroundImage"), "none");
  check("Adinkra accents stay strong in campaign areas and nearly blend into shop surfaces; product images stay plain");
  await until(page, "document.querySelectorAll('#north-featured .north-product-card').length > 0");
  await revealSection("north-featured");
  assert.equal(await evaluate(page, "Array.from(document.querySelectorAll('#north-featured [data-north-reveal]')).every(i => getComputedStyle(i).filter === 'blur(0px)')"), true);
  check("Loaded cards sharpen when scrolled into view");
  await screenshot(page, "landing-grid-desktop");
  report.screenshots.push("landing-grid-desktop.png");
  const id = await evaluate(page, "document.querySelector('#north-featured .north-product-link').getAttribute('href').split('/').at(-1)");
  await evaluate(page, "document.querySelector('#north-featured .north-product-link').click()");
  await until(page, "document.querySelector('.north-block-overlay').dataset.active === 'true'");
  await screenshot(page, "product-transition");
  await until(page, "Boolean(document.querySelector('.north-product-gallery'))");
  await until(page, "document.querySelector('.north-block-overlay').dataset.active === 'false'");
  assert.equal(await evaluate(page, "getComputedStyle(document.querySelector('.north-product-details')).position"), "sticky");
  assert.equal(await evaluate(page, "getComputedStyle(document.querySelector('.north-product-gallery')).gridTemplateColumns.split(' ').length"), 2);
  check("Product navigation shows a block dissolve and the sticky two-column gallery");
  assert.equal(await evaluate(page, "document.querySelector('.north-product-price').textContent.includes('GH₵')"), true);
  const colours = await evaluate(page, "Array.from(document.querySelectorAll('.north-colour-option')).map(b=>b.getAttribute('aria-label'))");
  assert.ok(colours.length > 1);
  await evaluate(page, "document.querySelectorAll('.north-colour-option')[1].click()");
  assert.equal(await evaluate(page, "document.querySelectorAll('.north-colour-option')[1].getAttribute('aria-pressed')"), "true");
  assert.equal(await evaluate(page, "document.querySelectorAll('.north-colour-option')[0].getAttribute('aria-pressed')"), "false");
  assert.equal(await evaluate(page, "document.querySelector('.north-product-options legend').textContent.includes('Grey')"), true);
  await evaluate(page, "document.querySelectorAll('.north-product-thumbnails button')[1].click()");
  assert.equal(await evaluate(page, "document.querySelectorAll('.north-product-thumbnails button')[1].getAttribute('aria-pressed')"), "true");
  assert.equal(await evaluate(page, "document.querySelector('.north-product-main img').getAttribute('src') === document.querySelectorAll('.north-product-thumbnails button img')[1].getAttribute('src')"), true);
  check("Product details show cedis, retain a clearly selected colour and switch the main image via thumbnails");
  await screenshot(page, "product-desktop");
  report.screenshots.push("product-desktop.png");
  assert.equal(await evaluate(page, "Boolean(document.querySelector('.north-product-tryon button'))"), true);
  await clickText(page, "M");
  assert.equal(await evaluate(page, "Array.from(document.querySelectorAll('.north-option-list button')).find(b => b.textContent.trim() === 'M').getAttribute('aria-pressed')"), "true");
  check("Product size options and virtual try-on remain available");
  await viewport(page, 768, 1024);
  await screenshot(page, "product-tablet");
  assert.equal(await evaluate(page, "document.documentElement.scrollWidth <= innerWidth"), true);
  await viewport(page, 375, 900, true);
  await screenshot(page, "product-mobile");
  assert.equal(await evaluate(page, "document.documentElement.scrollWidth <= innerWidth"), true);
  assert.equal(await evaluate(page, "getComputedStyle(document.querySelector('.north-product-details')).position"), "static");
  check("Product layout fits 768px and 375px, with non-sticky mobile details");
  report.screenshots.push("product-tablet.png", "product-mobile.png");
  await openHome();
  await delay(600);
  assert.equal(await evaluate(page, "getComputedStyle(document.querySelector('.north-hero-nav')).opacity"), "1");
  assert.equal(await evaluate(page, "Array.from(document.querySelectorAll('.north-headline-line')).every(i => !i.style.visibility || i.style.visibility !== 'hidden')"), true);
  check("Returning to the homepage skips the intro");
  await screenshot(page, "landing-hero-mobile");
  await evaluate(page, "document.getElementById('north-rack').scrollIntoView({block:'start'}); document.querySelector('#north-rack button[data-rack-garment]').blur(); document.querySelector('#north-rack .overflow-x-auto').scrollLeft=0;");
  await screenshot(page, "landing-rack-mobile");
  report.screenshots.push("landing-rack-mobile.png");
  await tapGarment(page, 0);
  await delay(450);
  assert.equal(await evaluate(page, "document.querySelectorAll('#north-rack img[alt*=\", front view\"]').length"), 0);
  await tapGarment(page, 0);
  await until(page, "Boolean(document.querySelector('#north-rack img[alt*=\", front view\"]'))");
  await screenshot(page, "landing-rack-panel-mobile");
  report.screenshots.push("landing-rack-panel-mobile.png");
  assert.equal(await evaluate(page, "document.documentElement.scrollWidth <= innerWidth"), true);
  await clickText(page, "← Back to rack");
  await delay(550);
  check("Embedded rack keeps two-tap touch behaviour and fits its panel at 375px");
  await revealSection("north-featured");
  await screenshot(page, "landing-grid-mobile");
  assert.equal(await evaluate(page, "document.documentElement.scrollWidth <= innerWidth"), true);
  check("Homepage fits 375px");
  report.screenshots.push("landing-hero-mobile.png", "landing-grid-mobile.png");
  await viewport(page, 768, 1024);
  await openHome();
  await delay(600);
  await screenshot(page, "landing-hero-tablet");
  assert.equal(await evaluate(page, "document.documentElement.scrollWidth <= innerWidth"), true);
  check("Homepage fits 768px");
  report.screenshots.push("landing-hero-tablet.png");
  await page.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await delay(300);
  assert.equal(await evaluate(page, "document.querySelectorAll('.north-hero video').length"), 0);
  assert.equal(await evaluate(page, "getComputedStyle(document.querySelector('.north-hero-copy')).transform"), "none");
  check("Changing reduced motion stops video and removes hero parallax");
  await page.send("Page.navigate", { url: origin + "/product/" + id });
  await until(page, "Boolean(document.querySelector('.north-product-gallery'))");
  await delay(300);
  await evaluate(page, "document.querySelector('nav a[href=\"/\"]').click()");
  assert.equal(await evaluate(page, "document.querySelector('.north-block-overlay').dataset.active"), "false");
  check("Reduced-motion navigation uses an opacity fade");
  await until(page, "Boolean(document.querySelector('#north-hero-title'))");
  await until(page, "document.querySelector('.north-block-overlay').dataset.active === 'false'");
  await revealSection("north-featured");
  check("Reduced-motion product grid reveals remain readable");

  // [NORTH] Card choices are tested before the network-delay fixture is enabled.
  await openHome();
  await until(page, "Boolean(document.querySelector('#north-featured .north-card-swatch[title=\"Grey\"]'))");
  await evaluate(page, "document.querySelector('#north-featured .north-card-swatch[title=\"Grey\"]').click()");
  await until(page, "Boolean(document.querySelector('.north-colour-option[title=\"Grey\"][aria-pressed=\"true\"]'))");
  await viewport(page, 375, 900, true);
  await evaluate(page, "document.querySelector('.north-product-options').scrollIntoView({block:'center'})");
  const swatchPoint = await evaluate(page, "(() => {const r=document.querySelector('.north-colour-option[title=\"White\"]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()");
  await page.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [swatchPoint] });
  await page.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await until(page, "Boolean(document.querySelector('.north-colour-option[title=\"White\"][aria-pressed=\"true\"]'))");
  await screenshot(page, "product-options-mobile");
  report.screenshots.push("product-options-mobile.png");
  check("Card colour links retain the chosen colour on the product page; touch can select another swatch");

  // [NORTH] A read-only fixture validates cart displays without real cart mutations.
  await page.send("Fetch.enable", { patterns: [{ urlPattern: "*cart*", requestStage: "Request" }] });
  page.on("Fetch.requestPaused", async ({ requestId, request }) => {
    if (/\/(?:api\/)?cart$/.test(new URL(request.url).pathname)) {
      await page.send("Fetch.fulfillRequest", { requestId, responseCode: 200,
        responseHeaders: [{ name: "Content-Type", value: "application/json" },
          { name: "Access-Control-Allow-Origin", value: origin }, { name: "Access-Control-Allow-Credentials", value: "true" },
          { name: "Access-Control-Allow-Headers", value: "content-type,authorization" },
          { name: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" }],
        body: Buffer.from(JSON.stringify({ items: [{ quantity: 2, product: {
          _id: id, name: "Cedi cart preview", price: 5000, discount: 20, images: [origin + "/rack-garments/black-bomber-front.png"],
        } }] })).toString("base64") });
    } else await page.send("Fetch.continueRequest", { requestId });
  });
  await viewport(page, 1440, 1000);
  await page.send("Page.navigate", { url: origin + "/Cart" });
  await until(page, "document.body.textContent.includes('GH₵8,000.00')");
  assert.equal(await evaluate(page, "document.body.textContent.includes('GH₵10,000.00') && document.body.textContent.includes('GH₵2,000.00')"), true);
  assert.equal(await evaluate(page, "document.body.textContent.includes('$')"), false);
  await screenshot(page, "cart-cedis-desktop");
  report.screenshots.push("cart-cedis-desktop.png");
  await page.send("Fetch.disable");
  check("Cart prices, discounts and totals display cedis without changing stored amounts");

  // An isolated delayed image proves that scrolling alone cannot reveal unloaded images.
  const fixture = await newPage(contextId);
  await viewport(fixture, 1440, 1000);
  let imageRequest;
  let fixtureError = false;
  const sample = {
    _id: "aaaaaaaaaaaaaaaaaaaaaaaa", name: "Load timing preview", price: 80,
    images: [origin + "/north-delayed.png"], colors: ["black"], sizes: ["S","M","L"],
    stock: 10, isFeatured: true,
  };
  const imageResponse = await fetch(origin + "/rack-garments/black-bomber-front.png");
  const imageBody = Buffer.from(await imageResponse.arrayBuffer()).toString("base64");
  await fixture.send("Fetch.enable", { patterns: [{ urlPattern: "*", requestStage: "Request" }] });
  fixture.on("Fetch.requestPaused", async ({ requestId, request }) => {
    const path = new URL(request.url).pathname;
    if (path === "/north-delayed.png") { imageRequest = requestId; return; }
    if (/\/(?:api\/)?products$/.test(path)) {
      await fixture.send("Fetch.fulfillRequest", { requestId, responseCode: fixtureError ? 500 : 200,
        responseHeaders: [{ name: "Content-Type", value: "application/json" }, { name: "Access-Control-Allow-Origin", value: origin },
          { name: "Access-Control-Allow-Credentials", value: "true" }],
        body: Buffer.from(JSON.stringify(fixtureError ? { error: "Fixture error" } : { data: [sample] })).toString("base64") });
      return;
    }
    await fixture.send("Fetch.continueRequest", { requestId });
  });
  await fixture.send("Page.navigate", { url: origin + "/Landing" });
  await until(fixture, "Boolean(document.querySelector('#north-featured [data-north-reveal]'))");
  await evaluate(fixture, "document.getElementById('north-featured').scrollIntoView()");
  for (let tries = 0; tries < 100 && !imageRequest; tries++) await delay(50);
  assert.ok(imageRequest);
  await delay(300);
  assert.equal(await evaluate(fixture, "Number(getComputedStyle(document.querySelector('#north-featured [data-north-reveal]')).opacity) < .2"), true);
  const before = await evaluate(fixture, "document.querySelector('#north-featured .north-image-media').getBoundingClientRect().height");
  await fixture.send("Fetch.fulfillRequest", { requestId: imageRequest, responseCode: 200,
    responseHeaders: [{ name: "Content-Type", value: "image/png" }], body: imageBody });
  await until(fixture, "Number(getComputedStyle(document.querySelector('#north-featured [data-north-reveal]')).opacity) > .99");
  assert.equal(await evaluate(fixture, "document.querySelector('#north-featured .north-image-media').getBoundingClientRect().height"), before);
  check("Unloaded images remain placeholders; loading reveals them without layout shift");
  fixtureError = true;
  await fixture.send("Page.reload");
  await until(fixture, "document.body.textContent.includes('We couldn’t load these products')");
  fixtureError = false;
  await clickText(fixture, "Try again");
  await until(fixture, "Boolean(document.querySelector('#north-featured .north-product-card'))");
  check("Product-grid errors can be retried");
  await page.send("Page.navigate", { url: origin + "/rack" });
  await until(page, "document.querySelectorAll('[data-rack-garment]').length === 13");
  assert.equal(await evaluate(page, "document.querySelectorAll('.north-hero, nav, footer').length"), 0);
  check("The restored rack keeps its artwork and standalone layout");
  assert.deepEqual(runtimeErrors, []);
  check("No browser runtime exceptions");
} finally {
  report.errors = runtimeErrors;
  await writeFile(resolve(output, "report.json"), JSON.stringify(report, null, 2));
  for (const client of clients) client.close();
  for (const targetId of targets) await browser.send("Target.closeTarget", { targetId });
  await browser.send("Target.disposeBrowserContext", { browserContextId: contextId });
  browser.close();
}
console.log(JSON.stringify(report, null, 2));
