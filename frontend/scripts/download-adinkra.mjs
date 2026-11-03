// [NORTH] Retrieve the three verified public-domain SVGs through the preview browser.
import { mkdir, writeFile } from "node:fs/promises";
const sources = [
  ["gye-nyame", "https://upload.wikimedia.org/wikipedia/commons/e/e3/Gye_Nyame_%28Adinkra_Symbol%29.svg"],
  ["dwennimmen", "https://upload.wikimedia.org/wikipedia/commons/0/09/Dwennimmen.svg"],
  ["sankofa", "https://upload.wikimedia.org/wikipedia/commons/0/0e/Sankofa_bird_symbol.svg"],
];
async function connect(url) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let next = 0;
  const requests = new Map();
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id) return;
    const pending = requests.get(message.id);
    if (!pending) return;
    requests.delete(message.id);
    if (message.error) pending.reject(new Error(message.error.message));
    else pending.resolve(message.result);
  });
  return {
    send(method, params = {}) { return new Promise((resolve, reject) => {
      const id = ++next;
      requests.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    }); },
    close() { socket.close(); },
  };
}
const origin = "http://127.0.0.1:9222";
const version = await (await fetch(origin + "/json/version")).json();
const browser = await connect(version.webSocketDebuggerUrl);
const { browserContextId } = await browser.send("Target.createBrowserContext");
const { targetId } = await browser.send("Target.createTarget", { url: "about:blank", browserContextId });
const targets = await (await fetch(origin + "/json/list")).json();
const page = await connect(targets.find(t => t.id === targetId).webSocketDebuggerUrl);
try {
  await mkdir("src/assets/adinkra", { recursive: true });
  await page.send("Page.enable");
  for (const [name, url] of sources) {
    const response = await page.send("Page.navigate", { url });
    if (response.errorText) throw new Error(response.errorText + ": " + name);
    let svg;
    for (let tries = 0; tries < 100; tries++) {
      const result = await page.send("Runtime.evaluate", {
        expression: "document.documentElement?.localName === 'svg' ? document.documentElement.outerHTML : ''",
        returnByValue: true,
      });
      svg = result.result.value;
      if (svg) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!svg) throw new Error("No SVG document: " + name);
    await writeFile("src/assets/adinkra/" + name + ".svg", svg);
    console.log("Retrieved " + name + ": " + svg.length + " bytes");
  }
} finally {
  page.close();
  await browser.send("Target.closeTarget", { targetId });
  await browser.send("Target.disposeBrowserContext", { browserContextId });
  browser.close();
}
