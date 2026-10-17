/**
 * Precompute the ustaad's MFCC features, one entry per line of the bani.
 *
 * The device cannot do this itself: the reference recording is a ~15MB AAC
 * file and JavaScript has no AAC decoder, so the features are extracted here
 * and bundled. The app then only has to analyse the child's own (uncompressed)
 * recording, which is a few seconds long.
 *
 *   node scripts/extract-reference-features.mjs
 *
 * Requires macOS `afconvert` for decoding. Output: src/scoring/reference-japji.json
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const TRACK =
  'https://gurbani-audios-c4abhzghhnccd5gj.z01.azurefd.net/audios/BhaiJarnailSingh/JapjiSahib.m4a';
const RECITER = 'BhaiJarnailSingh';
const OUT = 'src/scoring/reference-japji.json';

/** Features are ~[-3,3] after normalisation; int8 at this scale loses nothing that matters. */
const SCALE = 40;

const root = process.cwd();
const work = mkdtempSync(join(tmpdir(), 'uchaaran-'));

// The DSP lives in TypeScript modules with extensionless imports, which Metro
// resolves and Node does not. Concatenating them is the least-bad way to reuse
// the exact same code here rather than keeping a second copy in sync.
function loadDsp() {
  const files = [
    'src/scoring/dsp/fft.ts',
    'src/scoring/dsp/mfcc.ts',
    'src/scoring/dsp/wav.ts',
    'src/scoring/localScorer.ts',
  ];
  const source = files
    .map(f => readFileSync(join(root, f), 'utf8'))
    .join('\n')
    .split('\n')
    .filter(line => !/^import .* from '\.\//.test(line) && !/^}\s*from '\.\//.test(line))
    .join('\n')
    // Drop the multi-line relative imports left behind by the line filter.
    .replace(/import\s*\{[^}]*\}\s*from\s*'\.\/[^']*';/g, '');
  const file = join(work, 'dsp.ts');
  writeFileSync(file, source);
  return import(file);
}

const { decodeWav, featuresFromSlice } = await loadDsp();

const m4a = join(work, 'ref.m4a');
const wav = join(work, 'ref.wav');

if (!existsSync(m4a)) {
  console.log(`Downloading ${TRACK}`);
  const response = await fetch(TRACK);
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  writeFileSync(m4a, Buffer.from(await response.arrayBuffer()));
}

console.log('Decoding to 16 kHz mono…');
execFileSync('afconvert', ['-f', 'WAVE', '-d', 'LEI16@16000', '-c', '1', m4a, wav]);

const raw = readFileSync(wav);
const pcm = decodeWav(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
console.log(`Decoded ${(pcm.samples.length / pcm.sampleRate).toFixed(1)}s`);

const pauris = JSON.parse(readFileSync(join(root, 'src/bani.json'), 'utf8'));

const lines = [];
let frameTotal = 0;
for (const pauri of pauris) {
  pauri.lines.forEach((line, index) => {
    const frames = featuresFromSlice(pcm, line.start, line.end);
    if (frames.length === 0) {
      console.warn(`  pauri ${pauri.number} line ${index}: no frames (${line.start}-${line.end}s)`);
      return;
    }
    const width = frames[0].length;
    const packed = new Int8Array(frames.length * width);
    frames.forEach((frame, f) => {
      for (let i = 0; i < width; i++) {
        packed[f * width + i] = Math.max(-128, Math.min(127, Math.round(frame[i] * SCALE)));
      }
    });
    frameTotal += frames.length;
    lines.push({
      pauri: pauri.number,
      line: index,
      frames: frames.length,
      width,
      data: Buffer.from(packed.buffer).toString('base64'),
    });
  });
}

const output = {
  bani: 'japji',
  reciter: RECITER,
  track: TRACK,
  sampleRate: pcm.sampleRate,
  scale: SCALE,
  lines,
};
writeFileSync(join(root, OUT), JSON.stringify(output));

const bytes = readFileSync(join(root, OUT)).length;
console.log(`\nWrote ${OUT}`);
console.log(`  lines: ${lines.length}  frames: ${frameTotal}  size: ${(bytes / 1024 / 1024).toFixed(2)} MB`);
