// [RACK] Browser smoke check using an already-running Chrome CDP endpoint.
// Uses an isolated fixture session for cart checks; never changes the real cart.
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";

const origin = process.env.RACK_PREVIEW_ORIGIN || "http://localhost:4000";
const cdpOrigin = process.env.RACK_CDP_ORIGIN || "http://127.0.0.1:9222";
const output = resolve("artifacts/rack-restored");
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
  await until(page, "Array.from(document.images).filter(i => i.getBoundingClientRect().height > 0).every(i => i.complete)");
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
const page = await newPage();
try {
  await viewport(page, 1440, 900);
  await page.send('Page.navigate', { url: origin + '/rack' });
  await until(page, "document.querySelectorAll('[data-rack-garment]').length === 13");
  assert.equal(await evaluate(page, "document.querySelectorAll('nav').length"), 0);
  assert.equal(await evaluate(page, "document.querySelectorAll('footer').length"), 0);
  assert.equal(await evaluate(page, "Array.from(document.querySelectorAll('img')).every(i => i.getAttribute('src').startsWith('/rack-garments/'))"), true);
  await screenshot(page, 'rack-restored-desktop');
  await evaluate(page, "document.querySelector('[data-rack-garment]').click()");
  await until(page, "Boolean(document.querySelector('img[alt*=\", front view\"]'))");
  assert.equal(await evaluate(page, "document.querySelector('img[alt*=\", front view\"]').getAttribute('src')"), '/rack-garments/black-bomber-front.png');
  await clickText(page, 'Back');
  assert.equal(await evaluate(page, "document.querySelector('img[alt*=\", back view\"]').getAttribute('src')"), '/rack-garments/black-bomber-back.png');
  await clickText(page, 'Front');
  await screenshot(page, 'panel-restored-desktop');
  await clickText(page, '← Back to rack');
  await delay(600);
  assert.equal(await evaluate(page, "Math.round(document.activeElement.getBoundingClientRect().width)"), 260);
  await screenshot(page, 'rack-restored-active');
  await viewport(page, 375, 812, true);
  await screenshot(page, 'rack-restored-mobile');
  assert.equal(await evaluate(page, "document.documentElement.scrollWidth <= innerWidth"), true);
  console.log('PASS: original 13 cutouts, standalone layout, front/back panel, return position, and mobile width.');
} finally {
  for (const client of clients) client.close();
  for (const targetId of targets) await browser.send('Target.closeTarget', { targetId });
  browser.close();
}
