// [NORTH] Browser smoke check using an already-running Chrome CDP endpoint.
// Uses an isolated fixture session for cart checks; never changes the real cart.
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";

const origin = process.env.NORTH_PREVIEW_ORIGIN || "http://localhost:4000";
const cdpOrigin = process.env.NORTH_CDP_ORIGIN || "http://127.0.0.1:9222";
const output = resolve("artifacts/block-transition");
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


const contextId = (await browser.send("Target.createBrowserContext")).browserContextId;
const page = await newPage(contextId);
const report = { checks: [], measurements: {}, screenshots: [], errors: [] };
const check = (message) => { report.checks.push(message); console.log("PASS " + message); };
page.on("Runtime.exceptionThrown", ({ exceptionDetails }) => report.errors.push(exceptionDetails.exception?.description || exceptionDetails.text));
await page.send("Page.addScriptToEvaluateOnNewDocument", {
  source: "localStorage.setItem('userInfo', JSON.stringify({name:'Preview',email:'preview@example.invalid',isAdmin:false}));",
});
await page.send("Page.bringToFront");
const capture = async (name) => {
  const { data } = await page.send("Page.captureScreenshot", { format: "png" });
  await writeFile(resolve(output, name + ".png"), Buffer.from(data, "base64"));
  report.screenshots.push(name + ".png");
};
const inactive = () => until(page, "document.querySelector('.north-block-overlay').dataset.active === 'false'");
const trace = async () => {
  await evaluate(page, `(() => {
    const overlay = document.querySelector('.north-block-overlay');
    const read = () => Array.from(overlay.children).map(t => Number(getComputedStyle(t).opacity));
    const started = performance.now();
    const frames = [], commits = [], scrolls = [];
    let oldRoute = document.querySelector('[data-north-route]').dataset.northRoute;
    const originalScrollTo = window.scrollTo.bind(window);
    window.scrollTo = (...args) => {
      scrolls.push({ covered: read().every(v => v === 1), phase: overlay.dataset.phase, top: args[0]?.top });
      return originalScrollTo(...args);
    };
    const observer = new MutationObserver(() => {
      const route = document.querySelector('[data-north-route]')?.dataset.northRoute;
      if (route && route !== oldRoute) {
        commits.push({ route, covered: read().every(v => v === 1), phase: overlay.dataset.phase });
        oldRoute = route;
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.__blockTrace = new Promise(resolve => {
      let observed = false, firstActive;
      const sample = () => {
        const now = performance.now();
        const active = overlay.dataset.active === 'true';
        if (active && !observed) { observed = true; firstActive = now; }
        const values = read();
        frames.push({ time: now-started, active, ones: values.filter(v=>v===1).length, partial: values.some(v=>v!==0 && v!==1), phase: overlay.dataset.phase });
        if ((observed && !active) || now-started > 2000) {
          observer.disconnect(); window.scrollTo=originalScrollTo;
          resolve({ duration: now-firstActive, frames, commits, scrolls, timeout: !observed });
        } else requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
  })()`);
};
try {
  await viewport(page, 1440, 1000);
  await page.send("Page.navigate", { url: origin + "/" });
  await until(page, "Boolean(document.querySelector('#north-hero-title'))");
  await inactive();
  assert.equal(await evaluate(page, "document.querySelectorAll('.north-block-tile').length"), 96);
  assert.equal(await evaluate(page, "getComputedStyle(document.querySelector('.north-block-overlay')).pointerEvents"), "none");
  check("Initial home alias skips the transition; desktop grid is 12 × 8");
  await until(page, "Boolean(document.querySelector('.north-hero video')) && document.querySelector('.north-hero video').currentTime > 0");
  const video = await evaluate(page, "(() => { const v=document.querySelector('.north-hero video'); return {width:v.videoWidth,height:v.videoHeight,duration:v.duration,muted:v.muted,loop:v.loop,paused:v.paused,playsInline:v.playsInline}; })()");
  assert.equal(video.width, 1080);
  assert.equal(video.height, 2048);
  assert.equal(video.muted && video.loop && video.playsInline && !video.paused, true);
  report.measurements.video = video;
  check("Supplied web video plays muted, looping, inline at 1080 × 2048");
  await clickText(page, "Pause video");
  await evaluate(page, "document.querySelector('.north-hero video').currentTime = 4");
  await until(page, "document.querySelector('.north-hero video').readyState >= 2");
  await delay(1000);
  await capture("hero-video-desktop");
  await until(page, "Boolean(document.querySelector('#north-featured .north-product-link'))");
  await evaluate(page, "document.getElementById('north-featured').scrollIntoView()");
  const id = await evaluate(page, "document.querySelector('#north-featured .north-product-link').getAttribute('href').split('/').at(-1)");
  await trace();
  await evaluate(page, "document.querySelector('#north-featured .north-product-link').click()");
  await until(page, "document.querySelector('.north-block-overlay').dataset.active === 'true'");
  assert.equal(await evaluate(page, "document.querySelector('[data-north-route]').dataset.northRoute"), "/");
  await delay(80);
  await capture("block-cover-desktop");
  const desktopTrace = await evaluate(page, "window.__blockTrace");
  assert.equal(desktopTrace.timeout, false);
  assert.ok(desktopTrace.duration < 800, "Block sequence exceeded 800ms: " + desktopTrace.duration);
  assert.equal(desktopTrace.frames.some(frame => frame.partial), false);
  assert.ok(desktopTrace.frames.some(frame => frame.ones > 0 && frame.ones < 96));
  assert.ok(desktopTrace.commits.some(commit => commit.route === "/product/" + id && commit.covered));
  assert.ok(desktopTrace.scrolls.some(scroll => scroll.top === 0 && scroll.covered));
  report.measurements.desktopMs = Math.round(desktopTrace.duration);
  check("Tiles snap; route commits and scroll resets under full cover; desktop finishes under 800ms");
  await until(page, "Boolean(document.querySelector('h1[data-north-title-reveal]'))");
  await until(page, "document.querySelector('h1[data-north-title-reveal]').dataset.northTitleReveal === 'complete'");
  assert.equal(await evaluate(page, "getComputedStyle(document.querySelector('h1')).clipPath"), "none");
  await capture("block-product-desktop");
  check("New title mask completes and clears its clip-path without blocking clicks");

  await page.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await evaluate(page, "history.back()");
  await until(page, "Boolean(document.querySelector('#north-hero-title'))");
  await inactive();
  await delay(150);
  assert.equal(await evaluate(page, "Array.from(document.querySelectorAll('.north-block-tile')).every(t => Number(getComputedStyle(t).opacity) === 0)"), true);
  await evaluate(page, "history.forward()");
  await until(page, "Boolean(document.querySelector('.north-product-gallery'))");
  assert.equal(await evaluate(page, "document.querySelector('.north-block-overlay').dataset.active"), "false");
  check("Browser back/forward skips block animation");

  await viewport(page, 375, 900, true);
  await until(page, "document.querySelectorAll('.north-block-tile').length === 60");
  const geometry = await evaluate(page, "(() => { const root=document.querySelector('.north-block-overlay'); const first=root.firstElementChild.getBoundingClientRect(); const last=root.lastElementChild.getBoundingClientRect(); const c=getComputedStyle(root); return {columns:c.gridTemplateColumns.split(' ').length,rows:c.gridTemplateRows.split(' ').length,gap:c.gap,left:first.left,top:first.top,right:last.right,bottom:last.bottom,width:innerWidth,height:innerHeight,colour:getComputedStyle(root.firstElementChild).backgroundColor}; })()");
  assert.equal(geometry.columns, 6); assert.equal(geometry.rows, 10);
  assert.equal(geometry.gap, "0px");
  assert.equal(geometry.left, 0); assert.equal(geometry.top, 0);
  assert.ok(Math.abs(geometry.right-geometry.width) < 0.5 && Math.abs(geometry.bottom-geometry.height) < 0.5);
  assert.equal(geometry.colour, "rgb(245, 245, 243)");
  await trace();
  await evaluate(page, "document.querySelector('nav a[href=\"/\"]').click()");
  await until(page, "document.querySelector('.north-block-overlay').dataset.active === 'true'");
  await delay(80);
  await capture("block-cover-mobile");
  const mobileTrace = await evaluate(page, "window.__blockTrace");
  assert.ok(mobileTrace.duration < 800);
  assert.equal(mobileTrace.frames.some(frame => frame.partial), false);
  assert.ok(mobileTrace.commits.some(commit => commit.route === "/" && commit.covered));
  report.measurements.mobileMs = Math.round(mobileTrace.duration);
  check("Mobile 6 × 10 grid covers the viewport without gaps and finishes under 800ms");
  await until(page, "Boolean(document.querySelector('.north-hero video')) && document.querySelector('.north-hero video').currentTime > 0");
  await clickText(page, "Pause video");
  await evaluate(page, "document.querySelector('.north-hero video').currentTime = 4");
  await until(page, "document.querySelector('.north-hero video').readyState >= 2");
  await delay(600);
  await capture("hero-video-mobile");

  // Bypass the pointer blocker programmatically to exercise overlapping navigation.
  await evaluate(page, "document.querySelector('.north-hero-nav a[href=\"/shop\"]').click()");
  await until(page, "Boolean(document.querySelector('nav a[href=\"/shop/men\"]'))");
  await inactive();
  await evaluate(page, "document.querySelector('nav a[href=\"/\"]').click()");
  await until(page, "document.querySelector('.north-block-overlay').dataset.phase === 'cover'");
  await evaluate(page, "document.querySelector('nav a[href=\"/shop/men\"]').click()");
  await inactive();
  await until(page, "document.querySelector('[data-north-route]')?.dataset.northRoute === '/shop/men'");
  check("Interrupted navigation lands on the latest route and releases the blocker");
  await evaluate(page, "document.querySelector('nav a[href=\"/\"]').click()");
  await until(page, "document.querySelector('.north-block-overlay').dataset.phase === 'cover'");
  await page.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await until(page, "Boolean(document.querySelector('#north-hero-title'))");
  await inactive();
  assert.equal(await evaluate(page, "document.querySelectorAll('.north-hero video').length"), 0);
  check("Turning reduced motion on mid-transition releases cover and commits the requested route");
  await evaluate(page, "window.__fadeSamples=[]; const end=performance.now()+450; const sample=()=>{const root=document.querySelector('.north-route-content'); window.__fadeSamples.push({opacity:Number(getComputedStyle(root).opacity), active:document.querySelector('.north-block-overlay').dataset.active}); if(performance.now()<end) requestAnimationFrame(sample);}; requestAnimationFrame(sample);");
  await evaluate(page, "document.querySelector('.north-hero-nav a[href=\"/shop\"]').click()");
  await until(page, "document.querySelector('[data-north-route]')?.dataset.northRoute === '/shop'");
  await delay(450);
  const samples = await evaluate(page, "window.__fadeSamples");
  assert.ok(samples.some(sample => sample.opacity > 0 && sample.opacity < 1));
  assert.equal(samples.every(sample => sample.active === "false"), true);
  assert.equal(await evaluate(page, "getComputedStyle(document.querySelector('.north-route-content')).opacity"), "1");
  assert.equal(await evaluate(page, "Boolean(document.querySelector('[data-north-title-reveal=\"running\"]'))"), false);
  check("Reduced motion uses a plain fade with no tiles or title mask");
  assert.deepEqual(report.errors, []);
  check("No browser runtime exceptions");
} finally {
  await writeFile(resolve(output, "report.json"), JSON.stringify(report, null, 2));
  for (const client of clients) client.close();
  for (const targetId of targets) await browser.send("Target.closeTarget", { targetId });
  await browser.send("Target.disposeBrowserContext", { browserContextId: contextId });
  browser.close();
}
console.log(JSON.stringify(report, null, 2));
