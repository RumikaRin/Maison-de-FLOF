# Colour Images and Paint Atelier Header Redesign

## Approved direction

The user approved the three-part visual mockup:

1. Paint Atelier Editorial header.
2. Distinct restrained motion cues for Products, Colors, Visualizer, Dealers,
   and Trends.
3. Nine family-specific room images with wall color baked into the pixels.

## Colour explorer

- Preserve the existing room composition, camera angle, furnishings, material
  texture, and warm daylight across all variants.
- Create one image per family: white, grey, beige, peach, red, purple, blue,
  green, and yellow.
- Remove the `ColorSwatch` overlay, opacity, blend mode, and any CSS filter from
  the room stage.
- Switching family crossfades between real image files. Shade selection still
  updates swatch metadata and recommendations, but does not tint the photograph.

## Header

- Give the FLOF wordmark a dedicated masthead cell separated by a hairline.
- Keep the existing five navigation destinations and all route localization.
- Preserve Product and Color mega-menu logic while improving their composition.
- Give every navigation item a distinct but related motion cue:
  - Products: underline draw and panel rise.
  - Colors: staggered swatch reveal.
  - Visualizer: split-plane reveal.
  - Dealers: coordinate/route draw.
  - Trends: editorial curtain and masked text.
- Use transform and opacity only, 160–360ms, existing easing tokens, no bounce,
  no continuous pulse, and a reduced-motion fallback.
- Preserve keyboard navigation, focus visibility, Escape handling, outside
  click, mobile sheet, auth state, locale switch, and cart count.

## Visual system

Continue the locked Atelier Editorial system: warm mineral paper, espresso ink,
teal accent, hairline rules, serif/sans hierarchy, low radius, and no gradients,
glassmorphism, oversized pills, or generic floating cards.

## Verification

- Contract tests prove all nine image paths exist and no tint overlay remains.
- Header tests prove all five links/routes remain and motion hooks are present.
- Lint, typecheck, full tests, production build, bundle gate, and targeted E2E
  pass.
- Browser QA at 320, 768, and 1440px confirms no overflow, keyboard access,
  reduced motion, and no new console/page errors.
