# Privacy export, deletion and retention

## Customer controls

- `GET /api/profile/data-export` returns a no-store JSON attachment scoped to
  the authenticated owner. The export uses explicit field selection and never
  includes password hashes, session tokens, OAuth tokens, MFA secrets or
  recovery hashes.
- `DELETE /api/profile/delete-account` requires the literal confirmation
  `DELETE`; credential accounts must also provide the current password.
  Administrative and staff identities cannot use customer self-deletion.
- Deletion is immediate anonymization, not physical removal of legal commerce
  facts. All sessions and providers are revoked/deleted in the same database
  transaction.

## Anonymization boundary

The user email becomes a deterministic SHA-256-derived
`deleted+<label>@privacy.invalid` value. Name, phone, image, password, consent
timestamp, addresses, wishlists, notifications and authenticated support chat
are removed. Customer company/tax fields and quote contact content are
anonymized.

Orders, item/price totals, payments and audit event identity remain for
accounting, fraud and dispute purposes. Their shipping/contact snapshots and
user-authored notes are cleared. Historical audit JSON is recursively
redacted; the action, entity, time and anonymous actor label remain.

## Automated retention

`GET /api/cron/apply-retention` runs daily through Vercel Cron and fails closed
unless `CRON_SECRET` is valid. The operation is idempotent.

| Data | Window |
| --- | --- |
| Expired verification/reset tokens | Delete after expiry |
| Expired database sessions | Delete after expiry |
| Expired auth registry sessions | Delete after expiry |
| Revoked auth registry sessions | Delete after 30 days |
| Guest contact/chat requests | Delete after 180 days |
| Read notifications | Delete after 90 days |
| Unread notifications | Delete after 365 days |
| Audit records | Seven years under the separate demo audit policy |

Production owners must obtain legal review for these windows and configure
backup expiry consistently. Non-production databases must use synthetic
fixtures. If a production-derived dataset is exceptionally approved for
testing, direct identifiers and free-text contact fields must be irreversibly
masked before leaving production.
