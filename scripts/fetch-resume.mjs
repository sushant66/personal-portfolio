// Fetch the latest resume PDF from GitHub Releases into public/ so it can be
// served same-origin (inline-renderable; the GitHub asset is content-disposition:
// attachment with no CORS, so it can't be embedded cross-origin).
//
// Runs automatically before `npm run build` / `npm run dev` (see package.json).
// Tolerant by design: if the fetch fails, an existing committed copy is kept and
// the build continues — the /resume page also links the live GitHub URL as a
// fallback, so it degrades gracefully.

import { writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SOURCE =
  'https://github.com/sushant66/resume/releases/latest/download/Sushant_Kadam.pdf';
const OUT = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'Sushant_Kadam.pdf'
);

async function main() {
  try {
    const res = await fetch(SOURCE, { redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1000 || buf.subarray(0, 5).toString() !== '%PDF-') {
      throw new Error('response is not a valid PDF');
    }
    await writeFile(OUT, buf);
    console.log(`[fetch-resume] saved ${buf.length} bytes → public/Sushant_Kadam.pdf`);
  } catch (err) {
    console.warn(`[fetch-resume] could not fetch latest resume: ${err.message}`);
    try {
      await access(OUT);
      console.warn('[fetch-resume] keeping existing committed copy.');
    } catch {
      console.warn('[fetch-resume] no local copy present; /resume will fall back to the GitHub link.');
    }
  }
}

main();
