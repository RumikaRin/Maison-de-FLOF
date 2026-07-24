# Maison de FLOF ERD

Last synchronized with `prisma/schema.prisma`: 24/07/2026

`public/erd_diagram.png` is a historical image and is not an authoritative
schema reference. It omits current models, duplicates `Paint`, and uses key
types that do not match Prisma. This Mermaid source and
`codex_project_audit_pack/DATA_DICTIONARY.md` are the maintained references.

## Identity and customer

```mermaid
erDiagram
  Role ||--o{ User : assigns
  User ||--o| Customer : owns
  User ||--o{ Account : authenticates
  User ||--o{ Session : has
  User ||--o{ Address : saves
  User ||--o{ Notification : receives
  User ||--o| Conversation : opens
  VerificationToken {
    string identifier PK
    string token PK
    datetime expires
  }
  Role {
    string id PK
    string type UK
    string name
  }
  User {
    string id PK
    string email UK
    string roleId FK
    string password
    string name
  }
  Customer {
    string id PK
    string userId FK,UK
    decimal totalSpent
    string customerType
  }
  Account {
    string id PK
    string userId FK
    string provider
    string providerAccountId
  }
  Session {
    string id PK
    string userId FK
    string sessionToken UK
  }
  Address {
    string id PK
    string userId FK
    string addressLine1
    boolean isDefault
  }
  Notification {
    string id PK
    string userId FK
    string type
    boolean isRead
  }
```

## Catalog

```mermaid
erDiagram
  Category ||--o{ Category : contains
  Category ||--o{ Paint : classifies
  Supplier ||--o{ Paint : supplies
  Supplier ||--o{ Dealer : authorizes
  ColorCollection ||--o{ PaintColor : groups
  Paint ||--o{ PaintColorLink : supports
  PaintColor ||--o{ PaintColorLink : links
  Category {
    string id PK
    string parentId FK
    string slug UK
    boolean isActive
  }
  Supplier {
    string id PK
    string slug UK
    boolean isActive
  }
  Paint {
    string id PK
    string categoryId FK
    string supplierId FK
    string sku UK
    string slug UK
    decimal price
    int stock
  }
  PaintColor {
    string id PK
    string collectionId FK
    string code UK
    string hex
  }
  ColorCollection {
    string id PK
    string slug UK
    int year
  }
  PaintColorLink {
    string id PK
    string paintId FK
    string colorId FK
  }
  Dealer {
    string id PK
    string supplierId FK
    string province
    string district
  }
```

## Commerce

```mermaid
erDiagram
  Customer ||--o{ Order : places
  Address ||--o{ Order : selectedBy
  Coupon ||--o{ Order : discounts
  Order ||--|{ OrderItem : contains
  Paint ||--o{ OrderItem : snapshots
  Order ||--o{ OrderStatusHistory : records
  Order ||--o| Payment : pays
  Order ||--o| CheckoutIdempotency : deduplicates
  Paint ||--o{ InventoryTransaction : changes
  Order {
    string id PK
    string orderNumber UK
    string customerId FK
    string addressId FK
    string couponId FK
    string status
    decimal total
  }
  OrderItem {
    string id PK
    string orderId FK
    string paintId FK
    int quantity
    decimal price
  }
  Payment {
    string id PK
    string orderId FK,UK
    string status
    decimal amount
    string transactionCode UK
  }
  CheckoutIdempotency {
    string id PK
    string key UK
    string orderId FK,UK
    string userId
  }
  OrderStatusHistory {
    string id PK
    string orderId FK
    string newStatus
    string changedByEmail
  }
  Coupon {
    string id PK
    string code UK
    string type
    decimal value
    int usageCount
  }
  InventoryTransaction {
    string id PK
    string paintId FK
    string type
    int quantity
    string referenceId
  }
```

## Engagement and operations

```mermaid
erDiagram
  Customer ||--o{ Wishlist : saves
  Paint ||--o{ Wishlist : savedAs
  Customer ||--o{ WishlistColor : saves
  PaintColor ||--o{ WishlistColor : savedAs
  Customer ||--o{ QuoteRequest : requests
  User ||--o{ Review : writes
  Paint ||--o{ Review : receives
  User ||--o{ Blog : authors
  Conversation ||--o{ Message : contains
  User ||--o| Conversation : owns
  Wishlist {
    string id PK
    string customerId FK
    string paintId FK
  }
  WishlistColor {
    string id PK
    string customerId FK
    string colorId FK
  }
  QuoteRequest {
    string id PK
    string customerId FK
    string status
  }
  Review {
    string id PK
    string userId FK
    string paintId FK
    int rating
  }
  Blog {
    string id PK
    string authorId FK
    string slug UK
  }
  ChatMessage {
    string id PK
    string status
    string message
  }
  Conversation {
    string id PK
    string userId FK,UK
    string status
  }
  Message {
    string id PK
    string conversationId FK
    string senderId
    boolean isAdmin
  }
  AuditLog {
    string id PK
    string actorId
    string action
    string entityType
    json beforeData
    json afterData
  }
  EmailOutbox {
    string id PK
    string type
    json payload
    string status
    int retryCount
  }
```

## Intentional weak references

- `AuditLog.actorId` is not a foreign key so audit history survives user
  deletion.
- `InventoryTransaction.referenceId` is a polymorphic operational reference,
  not a database foreign key.
- `Message.senderId` is retained as an identifier but has no Prisma relation.
- `ChatMessage` is the guest/legacy support flow; `Conversation` and `Message`
  are the authenticated flow.
