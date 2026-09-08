import 'dotenv/config';
import { runTryOn } from './utils/hfTryon.js';

// Throwaway smoke test for the Kolors Space integration. Delete when done.
// Mechanics check: confirms connect + submit(fn_index) + result-URL extraction work
// against the LIVE free Space. (Uses one image for both person+garment unless SMOKE_GARMENT set,
// so the visual result isn't meaningful — we only care that a result URL comes back.)
const PERSON = process.env.SMOKE_PERSON
  || 'https://res.cloudinary.com/dpxmdtduf/image/upload/v1748711374/I3GOHIZ7CBBV7NPZC2ROV3AG2Q_rna1bv.jpg';
const GARMENT = process.env.SMOKE_GARMENT || PERSON;

const t0 = Date.now();
const secs = () => ((Date.now() - t0) / 1000).toFixed(1) + 's';
try {
  console.log('[smoke] fetching sample person image...');
  const resp = await fetch(PERSON);
  const buf = Buffer.from(await resp.arrayBuffer());
  console.log('[smoke] person bytes:', buf.length, '- calling Kolors Space (can take 30-120s)...');
  const out = await runTryOn({
    personBuffer: buf,
    personMime: resp.headers.get('content-type') || 'image/jpeg',
    garmentUrl: GARMENT,
  });
  console.log('[smoke] SUCCESS in', secs());
  console.log('[smoke] result URL:', out.imageUrl);
} catch (err) {
  console.log('[smoke] FAILED in', secs());
  console.log('[smoke] error name:', err?.name);
  console.log('[smoke] error msg :', err?.message);
}
process.exit(0);
