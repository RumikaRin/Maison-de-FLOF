# Colour Images and Paint Atelier Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the colour overlay with nine real room-image variants and ship the approved Paint Atelier header with motion cues for all five navigation destinations.

**Architecture:** Keep all application and navigation contracts intact. Assets are selected through a typed family-to-path mapping; header motion is progressive enhancement through semantic classes and existing safe-motion utilities.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, ImageGen, Node test runner, Playwright.

---

### Task 1: Generate the nine room assets

**Files:**
- Create: `public/color-rooms/living-white.webp`
- Create: `public/color-rooms/living-grey.webp`
- Create: `public/color-rooms/living-beige.webp`
- Create: `public/color-rooms/living-peach.webp`
- Create: `public/color-rooms/living-red.webp`
- Create: `public/color-rooms/living-purple.webp`
- Create: `public/color-rooms/living-blue.webp`
- Create: `public/color-rooms/living-green.webp`
- Create: `public/color-rooms/living-yellow.webp`

- [x] Generate each image from `public/living_beige.webp`, changing only the
  painted wall surfaces and preserving the exact composition and daylight.
- [x] Inspect every output for geometry drift, unintended furniture changes,
  text, watermark, or color spill.
- [x] Save approved outputs as optimized WebP project assets.

### Task 2: Remove the filter overlay with TDD

**Files:**
- Modify: `tests/home-motion-integration.test.ts`
- Modify: `src/components/features/home/ColorExplorerSection.tsx`

- [x] Write a failing test requiring all nine `/color-rooms/` paths and
  forbidding `mix-blend-multiply`, tint `opacity`, and the full-stage
  `ColorSwatch`.
- [x] Run the focused test and confirm RED.
- [x] Replace `roomImageForFamily` with the exact nine-path mapping and remove
  the tint overlay.
- [x] Run the focused test and confirm GREEN.

### Task 3: Redesign the header with TDD

**Files:**
- Modify: `tests/home-motion-integration.test.ts`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/app/globals.css`

- [x] Write failing structural assertions for the masthead cell, paint rail,
  five motion identifiers, and preserved five routes.
- [x] Run the focused test and confirm RED.
- [x] Implement the approved header structure and motion classes without
  changing navigation/auth/cart/mobile behavior.
- [x] Add reduced-motion-safe CSS using transform and opacity only.
- [x] Run the focused test and confirm GREEN.

### Task 4: Verify and commit

- [x] Run `npm run lint`.
- [x] Run `npm run build`.
- [x] Run `npm run typecheck`.
- [x] Run `npm test`.
- [x] Run `npm run test:bundle`.
- [x] Run targeted Atelier/accessibility E2E.
- [x] Browser-QA 320, 768, and 1440px plus reduced motion and keyboard.
- [x] Stage only scoped files and commit in one scoped feature unit.
