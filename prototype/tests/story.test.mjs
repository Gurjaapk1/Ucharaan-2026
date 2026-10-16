import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { storyForPauri, storyStopForLine } from '../src/KidsMode/story.js';
const pauris = JSON.parse(readFileSync(new URL('../src/bani.json', import.meta.url)));

test('every source line belongs to exactly one ordered memory landmark', () => {
  assert.equal(pauris.length, 38);
  for (const pauri of pauris) {
    const story = storyForPauri(pauri.number);
    assert.ok(story, `Pauri ${pauri.number}`);
    const coverage = [];
    let previousX = -1;
    for (const stop of story.stops) {
      assert.ok(stop.x >= previousX && stop.x >= 0 && stop.x <= 1);
      previousX = stop.x;
      for (let line = stop.start; line <= stop.end; line++) {
        coverage.push(line);
        assert.equal(storyStopForLine(story, line), stop);
      }
    }
    assert.deepEqual(coverage, pauri.lines.map((_, i) => i), `Pauri ${pauri.number}`);
  }
});

test('every pauri uses a distinct existing bundled panorama', () => {
  const images = pauris.map(p => storyForPauri(p.number).image);
  assert.equal(new Set(images).size, 38);
  for (const image of images) {
    const file = new URL(`../public/assets/${image}`, import.meta.url);
    assert.ok(existsSync(file), image);
    assert.ok(readFileSync(file).length > 1000, image);
  }
});
