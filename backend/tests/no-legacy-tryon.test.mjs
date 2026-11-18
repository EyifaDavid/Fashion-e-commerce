import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(here, "..");
const repoRoot = resolve(backendRoot, "..");

const deletedPaths = [
  resolve(backendRoot, "routes/tryonRoutes.js"),
  resolve(backendRoot, "controllers/tryonController.js"),
  resolve(backendRoot, "middleware/tryonRateLimit.js"),
  resolve(backendRoot, "_tryon_smoke.mjs"),
  resolve(repoRoot, "frontend/src/redux/slices/api/tryonApiSlice.js"),
  resolve(repoRoot, "frontend/src/redux/slices/tryonSlice.js"),
];

test("legacy per-customer try-on files are gone", () => {
  for (const path of deletedPaths) {
    assert.equal(existsSync(path), false, `expected missing: ${path}`);
  }
});

test("backend routes no longer mount a tryon route", () => {
  const text = readFileSync(resolve(backendRoot, "routes/index.js"), "utf8");
  assert.equal(text.includes("tryonRoutes"), false);
  assert.equal(text.includes("/tryon"), false);
});

test("redux store no longer registers the tryon slice", () => {
  const text = readFileSync(resolve(repoRoot, "frontend/src/redux/store.js"), "utf8");
  assert.equal(text.includes("tryonReducer"), false);
  assert.equal(text.includes("tryon:"), false);
});
