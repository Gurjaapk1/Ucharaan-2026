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

test('six terrains cover all pauris with one reachable, separated map stop per lesson', async () => {
  const { regions } = await import('../src/KidsMode/content.js');
  assert.equal(regions.length, 6);
  assert.equal(new Set(regions.map(r => r.image)).size, 6);
  const lessons = [];
  for (const region of regions) {
    assert.ok(existsSync(new URL(`../public/assets/${region.image}`, import.meta.url)), region.image);
    assert.equal(region.nodes.length, region.end - region.start + 1);
    for (let i = 0; i < region.nodes.length; i++) {
      lessons.push(region.start + i);
      const [x, y] = region.nodes[i];
      assert.ok(x >= 10 && x <= 90 && y >= 8 && y <= 90, 'Buttons stay inside the map');
      for (const [px, py] of region.nodes.slice(0, i)) {
        // At the narrowest 320px viewport, the 60px button columns must not overlap.
        assert.ok(Math.abs(x - px) * 3.2 >= 60 || Math.abs(y - py) * (320 / region.aspectRatio) / 100 >= 68, 'Stops remain independently tappable');
      }
    }
  }
  assert.deepEqual(lessons, Array.from({ length: 38 }, (_, i) => i + 1));
});


test('unified trail reaches every pauri in scroll order with distinct touch targets', () => {
  const map = JSON.parse(readFileSync(new URL('../src/KidsMode/journey-map.json', import.meta.url)));
  assert.ok(existsSync(new URL(`../public/assets/${map.image}`, import.meta.url)));
  assert.deepEqual(map.nodes.map(n => n.pauri), Array.from({ length: 38 }, (_, i) => i + 1));
  const scale = 320 / map.width;
  for (const [i, node] of map.nodes.entries()) {
    assert.ok(node.x * scale >= 30 && (map.width - node.x) * scale >= 30);
    assert.ok(node.y * scale >= 24 && (map.height - node.y) * scale >= 50);
    if (i) assert.ok((node.y - map.nodes[i - 1].y) * scale >= 72, 'Touch targets stay separate on narrow phones');
  }
});
