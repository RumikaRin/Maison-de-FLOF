import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("colour explorer wires reveal motion without replacing its state crossfade", async () => {
  const source = await readFile(
    "src/components/features/home/ColorExplorerSection.tsx",
    "utf8",
  );

  assert.match(source, /<EditorialSection[^>]*data-fl-io/);
  assert.ok(source.includes('className="fl-mask-line mt-fl-xs"'));
  assert.ok(
    source.includes(
      'className="fl-stagger mt-fl-lg flex items-end gap-fl-3xs overflow-x-auto no-scrollbar"',
    ),
  );
  assert.ok(
    source.includes(
      'className="fl-stagger mt-fl-sm grid grid-cols-2 gap-x-fl-sm sm:grid-cols-3"',
    ),
  );
  assert.ok(source.includes("<AnimatePresence mode=\"wait\">"));
});

test("featured products stagger lead and supporting cards", async () => {
  const source = await readFile(
    "src/components/features/home/FeaturedProductsSection.tsx",
    "utf8",
  );

  assert.match(source, /<EditorialSection[^>]*data-fl-io/);
  assert.ok(
    source.includes(
      'className="fl-stagger grid grid-cols-1 gap-y-fl-md py-fl-lg md:grid-cols-12 md:gap-x-fl-lg"',
    ),
  );
  assert.ok(
    source.includes(
      'className="fl-blurup group relative block aspect-[4/3] overflow-hidden rounded-surface bg-atelier-paper md:col-span-7"',
    ),
  );
  assert.ok(
    source.includes(
      'className="fl-stagger grid grid-cols-2 gap-x-fl-md md:grid-cols-5"',
    ),
  );
  assert.ok(
    source.includes(
      'className="fl-blurup flex flex-col border-b border-atelier-rule pb-fl-sm pt-fl-sm"',
    ),
  );
});

test("sage visualizer band grows, mosaics room curtains, and draws its blueprint", async () => {
  const source = await readFile(
    "src/components/features/home/VisualizerPromoSection.tsx",
    "utf8",
  );

  assert.ok(source.includes("fl-rise fl-band-grow relative"));
  assert.ok(source.includes("fl-orn-blueprint relative"));
  assert.ok(source.includes("data-fl-io"));
  assert.ok(source.includes('className="fl-stagger mt-fl-lg"'));
  assert.ok(source.includes('className="fl-mask-line mt-fl-xs"'));
  assert.ok(source.includes("fl-mosaic mt-fl-sm"));
  assert.ok(source.includes("ROOMS.map((room, index)"));
  assert.ok(source.includes('index % 2 === 0 ? "fl-curtain-u" : "fl-curtain-l"'));
  assert.ok(source.includes('viewBox="0 0 420 128"'));
});

test("espresso journal band keeps one image idea and staggers supporting rows", async () => {
  const source = await readFile(
    "src/components/features/home/ExpertBlogsSection.tsx",
    "utf8",
  );

  assert.ok(source.includes("fl-rise fl-band-grow relative"));
  assert.ok(source.includes("data-fl-io"));
  assert.ok(source.includes('className="fl-mask-line mt-fl-xs"'));
  assert.ok(source.includes("fl-curtain-u"));
  assert.ok(!source.includes("fl-photo-parallax"));
  assert.ok(source.includes('className="fl-stagger flex flex-col"'));
});
