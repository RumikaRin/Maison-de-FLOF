# FLOF screen-reader verification

## Automated accessibility-tree gate

Run:

```powershell
npx playwright test e2e/accessibility-tree.spec.ts --project=chromium
```

This checks the browser accessibility tree for named landmarks, headings,
links, buttons, and login controls. The axe suite remains the automated
semantic-rule gate. Neither check is evidence that NVDA itself was exercised.

## Manual NVDA checklist

Use current NVDA on Windows with Chrome at 100% zoom and Vietnamese speech.
Record the NVDA version, Chrome version, date, tester, and result.

1. Open `/`, press `D` through landmarks, and confirm banner, navigation,
   main, and content information are announced once in a logical order.
2. Press `H` through headings. Confirm the page has one level-one heading and
   no skipped level that changes the document meaning.
3. Open `/products`, press `F` through filters, change one filter using only
   the keyboard, and confirm its label, state, and updated result count.
4. Open one product, reach quantity and the buy button with `Tab`, add it, and
   confirm the cart change is announced without moving focus unexpectedly.
5. Complete login with invalid data. Confirm each error is announced and focus
   reaches the first invalid field.
6. Log in as a test customer, open `/profile`, navigate tabs, addresses, saved
   colors, and saved products without a mouse.
7. Complete checkout through the review step and confirm shipping labels,
   payment choice, total, errors, and success heading are announced.
8. Log in as test admin, open `/admin`, traverse navigation, dashboard
   statistics, an orders table row, and its status control.

## Evidence status

Automated CDP accessibility-tree and axe results may be recorded by CI.
Manual NVDA remains **NOT VERIFIED** until a human completes all eight steps;
do not convert automated results into a manual-pass claim.
