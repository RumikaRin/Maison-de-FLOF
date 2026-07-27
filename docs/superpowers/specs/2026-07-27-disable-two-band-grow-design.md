# Disable Two Homepage Band-Grow Effects

## Goal

Remove the scroll-linked background expansion from the homepage visualizer and
expert-journal sections shown by the user.

## Approved behavior

- Remove `fl-band-grow` from `VisualizerPromoSection`.
- Remove `fl-band-grow` from `ExpertBlogsSection`.
- Keep `fl-rise`, image curtains, masked headings, staggered rows, DotField,
  slice drift, and all existing reduced-motion behavior.
- Keep the global `fl-band-grow` utility because other sections may still use
  it.

## Verification

- Update the motion integration test so both sections reject `fl-band-grow`
  while retaining their inner-motion contracts.
- Run the focused test, lint, typecheck, build, and browser QA.
- Confirm both section backgrounds remain full-width and static while scrolling.

## Out of scope

No changes to colors, layout, content, routes, data, or global motion utilities.
