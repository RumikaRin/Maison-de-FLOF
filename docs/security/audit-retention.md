# Audit log governance and retention

## Demo policy

FLOF retains `AuditLog` records for seven years from `createdAt`. This is a
demonstration policy, not legal advice. Before production launch, counsel and
the data owner must confirm the retention period for each operating country,
tax regime, dispute process and contract.

## Controls

- Audit history is append-only at application level. Product code may create
  records but must not update or delete individual records.
- Only an authenticated `ADMIN` may query `/api/admin/audit-logs` or open
  `/admin/audit`. Staff and customers are denied.
- Reads are paginated and may be filtered by actor, action, entity, entity ID
  and UTC date range.
- `beforeData` and `afterData` pass through the recursive audit sanitizer both
  when written and returned. Passwords, tokens, secrets, credentials,
  authorization values and API keys are excluded.
- Operational logs are separate from business audit records. They use
  structured JSON with an event, severity, correlation ID and allowlisted safe
  metadata; raw errors, request payloads and PII are not recorded.

## Operations

Database administrators must deny application roles permission to update or
delete `AuditLog`. Any exceptional retention deletion must use a separately
approved maintenance identity, be recorded outside the affected store and
have a reviewed legal basis. Backups must apply the same expiry and access
rules.
