import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAnywearScriptUrl,
  widgetHtmlUrl,
  ensureAnywear,
  openAnywear,
} from "./anywear.js";

const LOAD_ERROR = "Live try-on couldn't load. Please try again in a moment.";

function createFakeDom() {
  const scripts = [];
  const doc = {
    createElement(tag) {
      assert.equal(tag, "script");
      return {
        tagName: "SCRIPT",
        src: "",
        async: false,
        attrs: {},
        setAttribute(name, value) {
          this.attrs[name] = value;
        },
      };
    },
    querySelector(selector) {
      if (selector === "script[data-anywear-widget]") {
        return scripts.find((script) => script.attrs["data-anywear-widget"] === "true") || null;
      }
      return null;
    },
    head: {
      appendChild(script) {
        scripts.push(script);
        return script;
      },
    },
  };
  return { doc, scripts, win: {} };
}

let sharedFake;

test("buildAnywearScriptUrl encodes the domain as a query parameter", () => {
  assert.equal(
    buildAnywearScriptUrl("MyStore.com?x=1"),
    "https://anywear.decart.ai/widget/latest/anywear.js?domain=MyStore.com%3Fx%3D1"
  );
});

test("widgetHtmlUrl derives the widget page from the official script src", () => {
  assert.equal(
    widgetHtmlUrl("https://anywear.decart.ai/widget/latest/anywear.js?domain=x"),
    "https://anywear.decart.ai/widget/latest/widget.html"
  );
  assert.equal(widgetHtmlUrl("https://example.com/other.js"), null);
});

test("ensureAnywear rejects with a friendly message when the widget never loads", async () => {
  const { doc, win } = createFakeDom();
  await assert.rejects(
    () => ensureAnywear({ domain: "store.test", timeoutMs: 30, doc, win }),
    { message: LOAD_ERROR }
  );
});

test("ensureAnywear injects the official script once and initializes DecartWidget", async () => {
  const fake = createFakeDom();
  sharedFake = fake;
  const getGarmentMeta = () => ({ category: "jacket", gender: "unisex", categoryRaw: "outerwear" });
  const pending = ensureAnywear({
    domain: "MyStore.com?x=1",
    timeoutMs: 200,
    doc: fake.doc,
    win: fake.win,
    getGarmentMeta,
  });

  assert.equal(fake.scripts.length, 1);
  assert.equal(
    fake.scripts[0].src,
    "https://anywear.decart.ai/widget/latest/anywear.js?domain=MyStore.com%3Fx%3D1"
  );

  fake.win.initCalls = 0;
  fake.win.DecartWidget = {
    init(config) {
      fake.win.initCalls += 1;
      fake.win.config = config;
    },
    open() {},
  };
  fake.scripts[0].onload?.();

  const widget = await pending;
  assert.equal(widget, fake.win.DecartWidget);
  assert.equal(fake.win.initCalls, 1);
  assert.equal(fake.win.config.showPill, false);
  assert.equal(fake.win.config.isProductPage(), true);
  assert.match(fake.win.config.widgetUrl, /\/widget\.html$/);
  assert.deepEqual(fake.win.config.getGarmentMeta(), getGarmentMeta());
});

test("ensureAnywear reuses the initialized widget on a second call", async () => {
  const { doc, scripts, win } = sharedFake;
  const widget = await ensureAnywear({ domain: "store.test", timeoutMs: 30, doc, win });
  assert.equal(widget, win.DecartWidget);
  assert.equal(scripts.length, 1);
  assert.equal(win.initCalls, 1);
});

test("openAnywear passes openOptions to the initialized widget", async () => {
  const { doc, win } = sharedFake;
  win.DecartWidget.open = (options) => {
    win.openOptions = options;
  };

  const openOptions = { mobileCamera: "user" };
  await openAnywear({ domain: "store.test", timeoutMs: 30, doc, win, openOptions });
  assert.deepEqual(win.openOptions, openOptions);
});

test("getGarmentMeta follows the most recently opened product", async () => {
  const { doc, win } = sharedFake;
  const nextMeta = { category: "dress", gender: "Female", categoryRaw: "Dresses" };
  await ensureAnywear({ domain: "store.test", timeoutMs: 30, doc, win, getGarmentMeta: () => nextMeta });
  assert.deepEqual(win.config.getGarmentMeta(), nextMeta);
});
