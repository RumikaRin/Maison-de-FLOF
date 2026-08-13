# FLOF Sitewide Redesign — Release Evidence

**Date:** 26/07/2026
**Plan:** [`2026-07-26-flof-sitewide-redesign.md`](2026-07-26-flof-sitewide-redesign.md)
**System:** [`design.md`](../../../design.md) (locked, studied-DNA from farrow-ball.com — provenance and attestation recorded in the file)

## Gate results

| Gate | Result |
|---|---|
| `tsc --noEmit` | ✅ clean |
| `eslint .` | ✅ clean |
| `node --test tests/*.test.ts` | ✅ 162/162 (includes `design-tokens.test.ts` drift + a11y gates and `seed-accounts.test.ts`) |
| `check:contrast` (new, in `npm run check`) | ✅ 23/23 pairings ≥ AA, including all four drench bands |
| `next build` | ✅ compiled, 60/60 pages generated |
| `test:bundle` | ✅ budget passed — shared 100.6 KiB; heaviest route `/profile` 157.7 KiB |
| `e2e/atelier-redesign.spec.ts` (new, chromium) | ✅ 31/31 — overflow ×5 widths ×2 locales ×11 routes, single-line controls, 44px targets, diacritic clipping, no italic headings, ≥14px body, visible focus ring, retired treatments absent |
| `e2e/accessibility.spec.ts` (axe, wcag2a→wcag22aa) | ✅ 15/15 — zero serious/critical violations |
| `e2e/auth-lifecycle.spec.ts` · `locale-routing` · `layout-stability` · `visualizer` | ✅ combined run 54/54 |
| Manual screenshots | ✅ 13 routes × 1440/375/320, vi+en spot-checks, fold + full-page + per-band |

## What changed (summary)

- **Phase 1** — `--fl-*` OKLCH token block in `globals.css` (append-only), `atelier` Tailwind namespace, retuned `button`/`input` with eight states, 7 editorial primitives under `src/components/ui/editorial/`, contrast gate script, token drift tests.
- **Phase 2** — Header → N11 Mega-menu (colour-family panel with real swatches, `/colors?family=` deep link added to `ColorsClient`); Footer → Ft7 Newsletter-first; global scroll-reveal removed; loaders retokenised.
- **Phase 3** — Homepage rebuilt as 08 Photographic: H6 fold, 7/5 product editorial with crossing swatch rail + SpecLedger, continuous colour-field explorer, three drench bands (sage = real Moss Green #8002 · ochre advice strip · espresso journal). `/colors`, `/color-visualizer`, `/find-dealer`, `/quote-request` restyled to the same family (clay and slate bands used once each).
- **Phase 4** — `/products` + `/blog` as 11 Catalogue (F6 grid on hairline rules, C1 filter chips); `/products/[slug]` + `/blog/[slug]` as 02 Long Document with conditional SpecLedger (invented fallback values removed).
- **Phase 5** — cart, checkout (native-radio payment rows), checkout success, profile (flat index sidebar, real table for order history) and 5 auth pages as 05 Workbench. All handlers, schemas, and API calls untouched.
- **Bug fixed en route** — `useLocaleNavigation` returned the store language during SSR, rendering Vietnamese chrome into `/en` HTML (hydration mismatch). It now returns the URL locale.

## Post-review pass (user feedback)

Four issues the user raised after the first pass, plus three real defects found
while fixing them:

1. **Text on photographs was hard to read.** Added `--fl-scrim-1..3` tokens and
   a shared `.fl-photo-fold` / `.fl-photo-scrim` pair; overlaid labels and body
   copy now render at full ink strength instead of hand-tuned `on-dark/60..80`.
2. **Images looked soft.** Root cause is asset resolution, not code: every hero
   source is 1024×1024 or 1280×720 (`public/*.png` are actually JPEGs), so a
   full-bleed fold upscales them. Mitigated with `quality={92}` on the two hero
   images. **Replacing these with ≥2400px assets is the only real fix** and is
   an asset task, not a code one.
3. **Colour samples needed framing.** Added `.fl-swatch` / `.fl-swatch-selected`
   and applied them at every swatch site, so a white or ivory chip still reads
   as a sample. Also fixed `ColorSwatch` to paint with
   `preserveAspectRatio="none"` — the square rect had been letterboxed inside
   non-square swatches, so samples only filled part of their own frame. Cells
   now sit on a small gap and share one label baseline.
4. **Email verification is no longer required.** `canSignInWithCredentials()`
   gates on role: customers sign in unverified, ADMIN/STAFF still cannot.
   Registration signs the customer straight in and lands on `/profile`; the
   verification email is still sent and its link still works. Profile settings
   gained an on-demand "send verification link" row backed by the existing
   `/api/auth/resend-verification`. `e2e/auth-lifecycle.spec.ts` was updated to
   the new contract.

Defects found and fixed during that pass:

- **The contrast gate had a blind spot.** It compares token pairs, but the DOM
  layered `opacity-70..90` on text inside drench bands, so real contrast was
  3.51–4.47:1 against a 4.5:1 floor (13 nodes). All such opacity is removed and
  `tests/design-tokens.test.ts` now fails if it returns.
- **`md:min-h-0` collapsed controls to 18.8px** on desktop, below the WCAG 2.2
  24px target-size minimum. Raised to `md:min-h-6` across 16 files, with a test.
- **The header cart link had no accessible name below 640px** — its label was
  hidden and both icon and count were `aria-hidden`. Added `aria-label`.
- **The dealer page short-circuited its own hero** on loading/error/empty, so a
  seeded-empty database showed a bare box. The fold is now hoisted and always
  renders. (Pre-existing, made obvious by the redesign.)
- **The footer newsletter field was labelled "Email"**, making `getByLabel("Email")`
  ambiguous on every page and breaking two auth e2e tests. Relabelled to
  "Hộp thư của bạn" / "Your inbox".
- **Mega-menu panels rendered their full contents while hidden**, wasting
  hydration on the critical path and widening a click-before-hydrate race that
  made `locale-routing` flaky in combined runs. Panels now mount on first open.

## Seeded-account login fix

The user reported that the admin credentials in the README did not work.
Reproduced and fixed; two independent causes, both pre-existing:

1. **`prisma/seed.ts` never set `emailVerified`.** ADMIN and STAFF are gated on
   a verified address, so `admin@sonvn.com` / `staff@sonvn.com` could never sign
   in — and before the verification policy change, neither could the customer.
   The seed now stamps `emailVerified` on all three documented accounts, in the
   `update` payload as well as `create`, so re-running `npm run db:seed` repairs
   an existing database. Verified end to end against the test database: admin →
   `/vi/admin`, staff → `/vi/admin`, customer → `/vi/profile`.
2. **Production builds without Upstash return 503 on every login.** The rate
   limiter is deliberately fail-closed outside development, so with no
   `UPSTASH_REDIS_REST_URL` / `TOKEN` the credentials callback answers
   `503 SERVICE_UNAVAILABLE` before the password is ever checked. This is
   correct security behaviour, not a defect — it is now documented in the README
   alongside the account table, with `npm run dev` as the local path.

`tests/seed-accounts.test.ts` pins both halves of the contract: the seed must
stamp verification on the documented accounts, and the role policy must keep
ADMIN/STAFF gated while letting customers through.

## React #418 — fixed (and an earlier misattribution corrected)

This went through two wrong calls before landing:

1. First it was blamed on `csp-app-router-announcer`, with no proof.
2. Then a user screenshot showed a Chrome extension ("Give Freely") injecting
   `id="give-freely-root-<extension-id>"` into the same subtree, and it was
   dismissed as *entirely* the extension's doing. That was also wrong.

Re-checking in a **clean headless Chromium with no extensions** still reproduced
the error, which proved a second, genuine cause in application code:
`next.config.ts` aliases the route announcer through `config.resolve.alias`, and
when the server bundle resolved Next's original module while the client bundle
resolved the replacement, the two disagreed on the first render.

Next's own announcer returns `null` on the server and only creates its live
region client-side. The replacement rendered its `<div>` unconditionally. It now
returns `null` until mounted, so the first client render matches the server
output regardless of which module either bundle picked up.

Verified: `hydration errors on /vi: NONE` in a clean browser. The extension
remains an independent trigger on that user's machine and cannot be fixed from
this repo.

## Login diagnostics added

Because the sign-in UI shows one generic message by design (so it cannot be used
to enumerate accounts), an operator had no way to tell "wrong password" from
"privileged account with an unverified address" — which is what made the seeded
README credentials look simply broken.

- `authorize()` now writes a distinct `auth.credentials.rejected` operational log
  per reason: `USER_NOT_FOUND`, `NO_PASSWORD_CREDENTIAL`,
  `PRIVILEGED_EMAIL_NOT_VERIFIED`, `PASSWORD_MISMATCH`,
  `MFA_REQUIRED_OR_INVALID`. Server-side only; the UI message is unchanged.
- `npm run check:account -- <email> [password]` (`scripts/diagnose-login.ts`)
  reports role, password presence, verification state, MFA enrolment, and every
  blocker, against whatever `DATABASE_URL` points at. Validated both ways: it
  reports "nothing blocks this sign-in" on a healthy row, and pinpoints
  `ADMIN requires a verified email address` after deliberately clearing the
  stamp. Re-running `npm run db:seed` then repaired the row.
- The login page's two-factor field is now labelled "chỉ khi tài khoản đã bật" /
  "only if your account has it enabled". It still auto-reveals after a failed
  attempt — `e2e/admin-mfa.spec.ts` pins that, and an MFA-enrolled administrator
  has no other route to the field. An earlier attempt to make it opt-in only was
  reverted for exactly that reason.

## Second review pass (user feedback)

1. **Ochre band was off-palette.** The homepage advice strip was the only band
   needing dark ink, which made its button read as a heavy slab and put a
   mustard note against the warm mineral paper. Switched to **clay**, which
   shares the paper's warm family and now runs continuously into the espresso
   journal band below it. Drench order is sage → clay → espresso; contrast
   re-verified at 7.89:1.
2. **Mega-menu opened on hover.** Removed every `onMouseEnter` / `onMouseLeave`
   opener; the panel is click-only now. Verified: hover leaves
   `aria-expanded="false"`, click sets it `true`.
3. **`/products` filter rail buried the grid.** Five stacked chip groups pushed
   the first product far below the fold. Only the primary facet (category) stays
   as chips; search, supplier, finish and sort collapse into one toolbar row of
   `CustomSelect`s. The first product row now starts at y≈569 instead of past
   the viewport.
4. **`/color-visualizer` fold still had washed-out text and a soft image.** It
   was the one photographic fold that never adopted `.fl-photo-fold` /
   `.fl-photo-scrim`; applied, plus `quality={92}`.

## Known remaining issues (pre-existing, out of scope)
- Lighthouse gate not re-run in this session (requires its own warm-up harness); bundle gate used as the perf proxy. Run `npm run test:lighthouse` before release.

## Dead code removed (user-approved)

Deleted after verifying zero importers:

- `src/components/ui/aurora-background.tsx` (2-line `return null` stub)
- `src/components/ui/animated-hero-section-1.tsx` (2-line stub)
- `src/components/ui/about-us-section.tsx` (478 lines, never imported)
- `src/components/ui/footer-section.tsx` (orphaned by the Ft7 footer)
- `src/components/ui/demo.tsx` (2-line stub)

Kept: `loader-2.tsx` (still used by the admin layout), all `warm.*` / `jotun.*`
tokens (admin and un-migrated surfaces depend on them).

## Verification instructions

```bash
npm run check            # lint + typecheck + contrast + unit tests + build
npm run test:e2e         # full Playwright suite (needs test DB up)
npx playwright test e2e/atelier-redesign.spec.ts --project=chromium
npm run test:lighthouse  # before release
```
