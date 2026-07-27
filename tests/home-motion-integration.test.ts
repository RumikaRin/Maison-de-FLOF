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
  assert.ok(source.includes("const [hasInteracted, setHasInteracted] = useState(false)"));
  assert.ok(source.includes('hasInteracted && "fl-noreplay"'));
  assert.ok(source.includes("setHasInteracted(true)"));
});

test("sage visualizer keeps a static band while mosaics and blueprint animate", async () => {
  const source = await readFile(
    "src/components/features/home/VisualizerPromoSection.tsx",
    "utf8",
  );

  assert.ok(source.includes("fl-rise relative"));
  assert.ok(!source.includes("fl-band-grow"));
  assert.ok(source.includes("fl-orn-blueprint relative"));
  assert.ok(source.includes("data-fl-io"));
  assert.ok(source.includes('className="fl-stagger mt-fl-lg"'));
  assert.ok(source.includes('className="fl-mask-line mt-fl-xs"'));
  assert.ok(source.includes("fl-mosaic mt-fl-sm"));
  assert.ok(source.includes("ROOMS.map((room, index)"));
  assert.ok(source.includes('index % 2 === 0 ? "fl-curtain-u" : "fl-curtain-l"'));
  assert.ok(source.includes('viewBox="0 0 420 128"'));
});

test("expert journal band keeps one image idea and staggers supporting rows", async () => {
  const source = await readFile(
    "src/components/features/home/ExpertBlogsSection.tsx",
    "utf8",
  );

  assert.ok(source.includes("fl-rise relative"));
  assert.ok(!source.includes("fl-band-grow"));
  assert.ok(source.includes("data-fl-io"));
  assert.ok(source.includes('className="fl-mask-line mt-fl-xs"'));
  assert.ok(source.includes("fl-curtain-u"));
  assert.ok(!source.includes("fl-photo-parallax"));
  assert.ok(source.includes('className="fl-stagger flex flex-col"'));
});

test("homepage closing bands use the approved teal and light-mineral contrast", async () => {
  const [home, blogs] = await Promise.all([
    readFile("src/components/features/home/HomeClient.tsx", "utf8"),
    readFile("src/components/features/home/ExpertBlogsSection.tsx", "utf8"),
  ]);

  assert.ok(home.includes('className="bg-atelier-paper-2 text-atelier-accent"'));
  assert.ok(home.includes('className="fl-drench-teal py-fl-2xl md:py-fl-3xl"'));
  assert.ok(blogs.includes('className="fl-drench-mineral fl-rise relative'));
  assert.ok(blogs.includes("border-atelier-rule"));
  assert.ok(!blogs.includes("border-atelier-rule-on-dark"));
});

test("typographic links keep an idle hairline and draw a stronger underline", async () => {
  const [source, css] = await Promise.all([
    readFile("src/components/ui/editorial/TypographicLink.tsx", "utf8"),
    readFile("src/app/globals.css", "utf8"),
  ]);

  assert.ok(source.includes('<span className="fl-underline">{children}</span>'));
  assert.ok(!source.includes("text-atelier-accent underline decoration-1"));
  assert.ok(
    css.includes(
      "box-shadow: inset 0 -1px 0 0 color-mix(in oklab, currentColor 40%, transparent);",
    ),
  );
});

test("dot field stays decorative, CSP-safe, and viewport-gated", async () => {
  const source = await readFile("src/components/ui/dot-field.tsx", "utf8");

  assert.ok(source.includes('aria-hidden="true"'));
  assert.ok(source.includes("new IntersectionObserver"));
  assert.ok(source.includes("prefers-reduced-motion: reduce"));
  assert.ok(source.includes("useId()"));
  assert.ok(!source.includes("style={{"));
  assert.ok(source.includes("glowRadius > 0 ?"));
});

test("dot fields decorate only the journal and store overview planes", async () => {
  const [blogs, store] = await Promise.all([
    readFile("src/components/features/home/ExpertBlogsSection.tsx", "utf8"),
    readFile("src/components/features/home/StoreOverviewSection.tsx", "utf8"),
  ]);

  assert.ok(blogs.includes('import { DotField } from "@/components/ui/dot-field";'));
  assert.ok(blogs.includes("glowRadius={140}"));
  assert.ok(store.includes('import { DotField } from "@/components/ui/dot-field";'));
  assert.ok(store.includes("waveAmplitude={2}"));
  assert.ok(
    store.includes(
      'className="relative grid grid-cols-1 gap-y-fl-lg lg:grid-cols-12 lg:gap-x-fl-lg"',
    ),
  );
});
