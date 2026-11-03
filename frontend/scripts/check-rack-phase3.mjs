// [RACK] Browser smoke check using an already-running Chrome CDP endpoint.
// Uses an isolated fixture session for cart checks; never changes the real cart.
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";

const origin = process.env.RACK_PREVIEW_ORIGIN || "http://localhost:4000";
const cdpOrigin = process.env.RACK_CDP_ORIGIN || "http://127.0.0.1:9222";
const output = resolve("artifacts/rack-phase3");
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
  const point = await evaluate(page, "(() => { const r=document.querySelectorAll('[aria-label][aria-label*=\"$\"]')[" + index + "].getBoundingClientRect(); return {x:Math.max(1,Math.min(innerWidth-1,r.x+r.width/2)),y:r.y+140}; })()");
  await page.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
  await page.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}
const report = { checks: [], screenshots: [], live: {}, errors: [] };
const check = (name) => { report.checks.push(name); console.log("PASS " + name); };

try {
  const live = await newPage();
  await viewport(live, 1440, 1000);
  await live.send("Page.navigate", { url: origin + "/rack" });
  await until(live, "document.readyState === 'complete' && (document.querySelector('#rack-title') || location.pathname === '/log-in')");
  report.live.authenticated = await evaluate(live, "location.pathname !== '/log-in'");
  if (report.live.authenticated) {
    await until(live, "document.querySelector('[aria-label][aria-label*=\"$\"]') || document.body.textContent.includes('couldn’t load') || document.body.textContent.includes('no garments')");
    report.live.garments = await evaluate(live, "document.querySelectorAll('[aria-label][aria-label*=\"$\"]').length");
    await screenshot(live, "live-rack-desktop");
    report.screenshots.push("live-rack-desktop.png");
    if (report.live.garments) {
      await evaluate(live, "document.querySelector('[aria-label][aria-label*=\"$\"]').click()");
      await until(live, "Boolean(document.querySelector('h2'))");
      await screenshot(live, "live-panel-desktop");
      report.screenshots.push("live-panel-desktop.png");
      await viewport(live, 375, 900, true);
      await screenshot(live, "live-panel-mobile", true);
      report.screenshots.push("live-panel-mobile.png");
    }
  } else {
    check("Unauthenticated /rack redirects to /log-in");
  }

  fixtureContext = (await browser.send("Target.createBrowserContext")).browserContextId;
  // [RACK] A local preview session renders publicly readable live products, without cart writes.
  const preview = await newPage(fixtureContext);
  await viewport(preview, 1440, 1000);
  await preview.send("Page.addScriptToEvaluateOnNewDocument", { source: "localStorage.setItem('userInfo', JSON.stringify({name:'Rack Preview',email:'preview@example.invalid',isAdmin:false}));" });
  await preview.send("Page.navigate", { url: origin + "/rack" });
  await until(preview, "document.querySelector('[aria-label][aria-label*=\"$\"]') || document.body.textContent.includes('We couldn’t load') || document.body.textContent.includes('no garments')");
  report.live.garments = await evaluate(preview, "document.querySelectorAll('[aria-label][aria-label*=\"$\"]').length");
  if (report.live.garments) {
    await screenshot(preview, "live-rack-desktop");
    await evaluate(preview, "document.querySelector('[aria-label][aria-label*=\"$\"]').click()");
    await until(preview, "document.body.textContent.includes('Back to rack')");
    await screenshot(preview, "live-panel-desktop");
    await viewport(preview, 375, 900, true);
    await screenshot(preview, "live-panel-mobile", true);
    report.screenshots.push("live-rack-desktop.png", "live-panel-desktop.png", "live-panel-mobile.png");
  }
  const page = await newPage(fixtureContext);
  await viewport(page, 1440, 1000);
  await page.send("Page.addScriptToEvaluateOnNewDocument", { source: "localStorage.setItem('userInfo', JSON.stringify({name:'Rack Preview',email:'preview@example.invalid',isAdmin:false}));" });
  page.on("Runtime.exceptionThrown", ({ exceptionDetails }) => report.errors.push(exceptionDetails.exception?.description || exceptionDetails.text));
  const slugs = ["black-bomber","navy-bomber","denim-jacket","varsity-jacket","blue-hoodie","navy-hoodie","yellow-hoodie","green-shirt","blue-polo","cream-polo","grey-polo","blue-tee","white-tee"];
  const products = slugs.map((slug, index) => ({
    _id: "a".repeat(22) + String(index + 1).padStart(2, "0"),
    name: slug.split("-").map(word => word[0].toUpperCase() + word.slice(1)).join(" "),
    price: index < 4 ? 120 : 55,
    images: ["/rack-garments/" + slug + "-front.png"],
    rackFrontImage: "/rack-garments/" + slug + "-front.png",
    rackSideImage: "/rack-garments/" + slug + "-side.png",
    sizes: ["XS","S","M","L","XL"], colors: ["black","navy"], stock: 10,
  }));
  const cartPosts = [];
  // [RACK] Exercise unavailable options and missing/broken rack artwork too.
  products[10].rackFrontImage = "/missing-rack-preview.png";
  products[11].rackSideImage = "";
  products[12].stock = 0;
  products[12].sizes = [];
  const cart = [];
  let failNextCart = false;
  let productMode = "products";
  await page.send("Fetch.enable", { patterns: [{ urlPattern: "*", requestStage: "Request" }] });
  page.on("Fetch.requestPaused", async ({ requestId, request }) => {
    const url = new URL(request.url);
    const isProducts = /\/(?:api\/)?products$/.test(url.pathname);
    const isCart = /\/(?:api\/)?cart$/.test(url.pathname);
    if (!isProducts && !isCart) {
      await page.send("Fetch.continueRequest", { requestId });
      return;
    }
    let body = isProducts ? { data: productMode === "empty" ? [] : products } : { items: cart };
    let responseCode = isProducts && productMode === "error" ? 500 : 200;
    if (responseCode === 500) body = { error: "Fixture products failed" };
    if (isCart && request.method === "POST") {
      cartPosts.push(JSON.parse(request.postData));
      await delay(350);
      if (failNextCart) {
        responseCode = 500;
        body = { error: "Fixture cart failure" };
        failNextCart = false;
      } else {
        const product = products.find(p => p._id === cartPosts.at(-1).productId);
        const existing = cart.find(item => item.product._id === product._id);
        if (existing) existing.quantity++;
        else cart.push({ product, quantity: 1 });
        body = { items: cart };
      }
    }
    await page.send("Fetch.fulfillRequest", {
      requestId, responseCode,
      responseHeaders: [
        { name: "Content-Type", value: "application/json" },
        { name: "Access-Control-Allow-Origin", value: origin },
        { name: "Access-Control-Allow-Credentials", value: "true" },
        { name: "Access-Control-Allow-Headers", value: "content-type,authorization" },
        { name: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
      ],
      body: Buffer.from(JSON.stringify(body)).toString("base64"),
    });
  });
  await page.send("Page.navigate", { url: origin + "/rack" });
  await until(page, "document.querySelectorAll('[aria-label][aria-label*=\"$\"]').length === 13");
  await screenshot(page, "fixture-rack-desktop");
  await evaluate(page, "document.querySelector('[aria-label][aria-label*=\"$\"]').click()");
  await until(page, "document.body.textContent.includes('Back to rack')");
  assert.equal(await evaluate(page, "document.activeElement.textContent.includes('Back to rack')"), true);
  check("Panel opens with keyboard focus on Back");
  await clickText(page, "Back");
  assert.equal(await evaluate(page, "document.querySelector('img[alt*=\", back view\"]').getAttribute('src')"), products[0].rackSideImage);
  await clickText(page, "Front");
  await clickText(page, "Add to cart");
  await delay(150);
  assert.equal(cartPosts.length, 0);
  check("Size is required; no cart request before selection");
  await clickText(page, "M");
  await clickText(page, "Add to cart");
  await until(page, "document.body.textContent.includes('Adding…')");
  await clickText(page, "Adding…");
  await until(page, "Array.from(document.querySelectorAll('button')).some(b => b.textContent.trim() === 'Added')");
  assert.equal(cartPosts.length, 1);
  assert.deepEqual(cartPosts[0], { productId: products[0]._id, quantity: 1 });
  check("Loading, duplicate-click guard, Added, and exact cart payload");
  await screenshot(page, "fixture-panel-desktop");
  assert.equal(await evaluate(page, "document.querySelector('a[href=\"/product/" + products[0]._id + "\"]').textContent.trim()"), "View product page");
  check("Product link uses the real product ID");
  await page.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await delay(550);
  assert.equal(await evaluate(page, "document.activeElement.getAttribute('aria-label')?.includes('Black Bomber')"), true);
  assert.equal(await evaluate(page, "Math.round(document.activeElement.getBoundingClientRect().width)"), 260);
  check("Escape returns focus and retains the turned garment");
  await viewport(page, 375, 900, true);
  await evaluate(page, "document.querySelector('[aria-label][aria-label*=\"$\"]').blur(); document.querySelector('.overflow-x-auto').scrollLeft=0;");
  await delay(600);
  await tapGarment(page, 0);
  await delay(450);
  assert.equal(await evaluate(page, "document.querySelectorAll('img[alt*=\", front view\"]').length"), 0);
  await tapGarment(page, 0);
  await until(page, "document.body.textContent.includes('Back to rack')");
  check("Touch: first tap turns; second tap opens");
  await clickText(page, "M");
  failNextCart = true;
  await clickText(page, "Add to cart");
  await until(page, "document.body.textContent.includes('Couldn’t add this garment')");
  assert.equal(await evaluate(page, "Array.from(document.querySelectorAll('[data-sonner-toast][data-type=\"error\"]')).filter(t => t.textContent.includes('Fixture cart failure')).length"), 1);
  check("Rejected cart request stays retryable with one error toast");
  await screenshot(page, "fixture-panel-mobile", true);
  assert.equal(await evaluate(page, "document.documentElement.scrollWidth <= innerWidth"), true);
  check("375px panel has no horizontal overflow");
  await clickText(page, "← Back to rack");
  await delay(550);
  await evaluate(page, "document.querySelector('.overflow-x-auto').scrollLeft=550");
  const scrollBefore = await evaluate(page, "document.querySelector('.overflow-x-auto').scrollLeft");
  await evaluate(page, "document.querySelectorAll('[aria-label][aria-label*=\"$\"]')[5].click()");
  await until(page, "document.body.textContent.includes('Back to rack')");
  await clickText(page, "← Back to rack");
  await delay(550);
  assert.equal(await evaluate(page, "document.querySelector('.overflow-x-auto').scrollLeft"), scrollBefore);
  check("Horizontal scroll position survives opening and closing");
  await viewport(page, 768, 1024);
  await evaluate(page, "document.querySelectorAll('[aria-label][aria-label*=\"$\"]')[5].click()");
  await until(page, "document.body.textContent.includes('Back to rack')");
  await screenshot(page, "fixture-panel-tablet", true);
  assert.equal(await evaluate(page, "document.documentElement.scrollWidth <= innerWidth"), true);
  check("768px panel has no horizontal overflow");
  await page.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  // [RACK] Re-load so reduced motion is also tested on the first component mount.
  await page.send("Page.reload");
  await until(page, "document.querySelectorAll('[aria-label][aria-label*=\"$\"]').length === 13");
  await evaluate(page, "document.querySelectorAll('[aria-label][aria-label*=\"$\"]')[0].click()");
  await until(page, "document.body.textContent.includes('Back to rack')");
  await delay(250);
  assert.equal(await evaluate(page, "getComputedStyle(document.querySelector('.col-start-1[aria-hidden=\"true\"]')).transform"), "matrix(1, 0, 0, 1, 0, 0)");
  check("Reduced motion removes the horizontal slide");
  await clickText(page, "← Back to rack");
  await delay(250);
  await evaluate(page, "document.querySelectorAll('[aria-label][aria-label*=\"$\"]')[10].click()");
  await until(page, "Boolean(document.querySelector('img[alt*=\", front view\"]'))");
  await until(page, "document.querySelector('img[alt*=\", front view\"]').getAttribute('src') === '/rack-garments/grey-polo-front.png'");
  check("Broken front artwork falls back to the product image");
  await clickText(page, "← Back to rack");
  await delay(250);
  await evaluate(page, "document.querySelectorAll('[aria-label][aria-label*=\"$\"]')[11].click()");
  await until(page, "document.body.textContent.includes('Back to rack')");
  await clickText(page, "Back");
  assert.equal(await evaluate(page, "document.querySelector('img[alt*=\", back view\"]').getAttribute('src')"), products[11].images[0]);
  check("Missing side artwork falls back to images[0]");
  await clickText(page, "← Back to rack");
  await delay(250);
  await evaluate(page, "document.querySelectorAll('[aria-label][aria-label*=\"$\"]')[12].click()");
  await until(page, "document.body.textContent.includes('No sizes available.')");
  assert.equal(await evaluate(page, "Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Out of stock').disabled"), true);
  check("Missing sizes and out-of-stock products cannot be added");
  productMode = "empty";
  await page.send("Page.reload");
  await until(page, "document.body.textContent.includes('There are no garments')");
  check("Empty inventory has an explicit state");
  productMode = "error";
  await page.send("Page.reload");
  await until(page, "document.body.textContent.includes('We couldn’t load the rail')");
  productMode = "products";
  await clickText(page, "Try again");
  await until(page, "document.querySelectorAll('[aria-label][aria-label*=\"$\"]').length === 13");
  check("Products error state retries successfully");
  assert.deepEqual(report.errors, []);
  check("No browser runtime exceptions");
  report.screenshots.push("fixture-rack-desktop.png", "fixture-panel-desktop.png", "fixture-panel-mobile.png", "fixture-panel-tablet.png");
} finally {
  await writeFile(resolve(output, "report.json"), JSON.stringify(report, null, 2));
  for (const client of clients) client.close();
  for (const targetId of targets) await browser.send("Target.closeTarget", { targetId });
  if (fixtureContext) await browser.send("Target.disposeBrowserContext", { browserContextId: fixtureContext });
  browser.close();
}
console.log(JSON.stringify(report, null, 2));
