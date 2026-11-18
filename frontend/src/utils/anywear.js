const ANYWEAR_BASE = "https://anywear.decart.ai/widget/latest";
const LOAD_ERROR = "Live try-on couldn't load. Please try again in a moment.";

let readyPromise = null;
let readyWidget = null;
let initDone = false;

export function buildAnywearScriptUrl(domain) {
  return `${ANYWEAR_BASE}/anywear.js?domain=${encodeURIComponent(String(domain))}`;
}

export function widgetHtmlUrl(scriptSrc) {
  if (typeof scriptSrc !== "string") return null;
  const match = scriptSrc.match(
    /^(https:\/\/anywear\.decart\.ai\/widget\/latest)\/anywear\.js(?:\?.*)?$/
  );
  return match ? `${match[1]}/widget.html` : null;
}

function loadAnywear({ domain, getGarmentMeta, timeoutMs = 10000, doc, win }) {
  const activeDoc = doc ?? (typeof document === "undefined" ? null : document);
  const activeWin = win ?? (typeof window === "undefined" ? null : window);

  return new Promise((resolve, reject) => {
    if (!activeDoc || !activeWin) {
      reject(new Error(LOAD_ERROR));
      return;
    }

    let script = activeDoc.querySelector?.("script[data-anywear-widget]") || null;
    if (!script) {
      script = activeDoc.createElement("script");
      script.setAttribute("data-anywear-widget", "true");
      script.src = buildAnywearScriptUrl(domain);
      script.async = true;
    }

    let settled = false;
    let pollTimer = null;
    let timeoutTimer = null;

    const cleanup = () => {
      if (pollTimer !== null) clearInterval(pollTimer);
      if (timeoutTimer !== null) clearTimeout(timeoutTimer);
      script.onload = null;
    };

    const check = () => {
      if (settled) return;
      const widget = activeWin.DecartWidget;
      if (!widget || typeof widget.init !== "function" || typeof widget.open !== "function") return;

      settled = true;
      cleanup();

      if (!initDone) {
        const config = {
          widgetUrl: widgetHtmlUrl(script.src) || `${ANYWEAR_BASE}/widget.html`,
          showPill: false,
          isProductPage: () => true,
        };
        if (typeof getGarmentMeta === "function") config.getGarmentMeta = getGarmentMeta;
        widget.init(config);
        initDone = true;
      }

      readyWidget = widget;
      resolve(widget);
    };

    const fail = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(LOAD_ERROR));
    };

    script.onload = check;
    if (!script.parentNode) activeDoc.head.appendChild(script);

    pollTimer = setInterval(check, 20);
    timeoutTimer = setTimeout(fail, timeoutMs);
    check();
  });
}

export function ensureAnywear(options = {}) {
  if (initDone && readyWidget) return Promise.resolve(readyWidget);
  if (readyPromise) return readyPromise;

  readyPromise = loadAnywear(options)
    .then((widget) => {
      readyWidget = widget;
      return widget;
    })
    .catch((error) => {
      readyPromise = null;
      throw error;
    });

  return readyPromise;
}

export async function openAnywear(options = {}) {
  const widget = await ensureAnywear(options);
  return widget.open(options.openOptions);
}
