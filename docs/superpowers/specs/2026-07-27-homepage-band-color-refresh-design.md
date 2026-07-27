# Homepage Band Color Refresh

## Goal

Improve readability and visual separation between the consultation strip and
the expert-journal section at the end of the homepage, without changing their
layout, content, data flow, links, or motion behavior.

## Approved direction

The selected direction is **B — Teal + light mineral**.

### Consultation strip

- Replace the clay field with the existing FLOF teal family.
- Use light text on the teal field.
- Keep the consultation button light, with dark teal/espresso text.
- Preserve the painted `BandEdge`, spacing, copy, and `/quote-request` link.

### Expert journal

- Replace the dark espresso field with a light warm mineral field.
- Use espresso/ink text and muted dark metadata.
- Convert hairlines and the dot ornament to restrained warm neutral tones.
- Preserve the editorial grid, images, staggered entrances, links, and content.

## Accessibility

- Body text and interactive labels must meet WCAG AA contrast.
- Hover and focus states must remain visible on both fields.
- Reduced-motion behavior remains unchanged.

## Verification

- Add or update a focused integration test for the selected color contracts.
- Run the focused test, lint, typecheck, and production build.
- Inspect the two sections at desktop and mobile widths in a browser.
- Confirm there is no horizontal overflow or console error.

## Out of scope

- No copy, layout, animation timing, backend, database, navigation, or content
  changes.
