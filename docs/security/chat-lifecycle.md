# Chat and contact-request lifecycle

FLOF has two intentionally separate message stores.

## Guest contact requests: `ChatMessage`

`ChatMessage` is a standalone contact request submitted by a guest. It records
the supplied name, one contact channel, request text, page URL, workflow status
and a durable `consentAt` timestamp. The API rejects submissions without
explicit consent.

ADMIN and STAFF may read and process these records for support reporting.
Records expire after 180 days. They are not part of an authenticated user's
privacy export because ownership cannot be proved safely.

The system must never connect a guest request to a `User`, `Customer`,
`Conversation` or order by matching email, phone, name, IP address or another
inferred identifier. A later authenticated conversation remains a separate
record unless the person supplies an explicit reference through a reviewed
support workflow.

## Authenticated support: `Conversation` and `Message`

`Conversation` is owned by exactly one authenticated `User`; its `Message`
children inherit that ownership. It is included in that owner's export and is
deleted during account anonymization. Staff access is limited to the support
workflow and administrative actions remain auditable.

Neither model is a marketing-consent store. Contact data and message content
must not be repurposed for campaigns without a separate, explicit consent
record and reviewed policy.
