import { createHash } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { ApiError } from "@/lib/api-auth";

const DAY_MS = 24 * 60 * 60 * 1_000;
const GUEST_CHAT_RETENTION_DAYS = 180;
const READ_NOTIFICATION_RETENTION_DAYS = 90;
const UNREAD_NOTIFICATION_RETENTION_DAYS = 365;
const REVOKED_SESSION_RETENTION_DAYS = 30;

function anonymizedIdentity(userId: string) {
  const digest = createHash("sha256")
    .update(`flof-privacy-v1:${userId}`)
    .digest("hex")
    .slice(0, 24);
  return {
    label: digest,
    email: `deleted+${digest}@privacy.invalid`,
  };
}

const PII_AUDIT_KEY =
  /(email|phone|name|address|company|tax|message|note|authorization|password|token|secret|credential)/i;

function sanitizeRetainedAudit(value: Prisma.JsonValue): Prisma.InputJsonValue {
  if (value === null) return null as unknown as Prisma.InputJsonValue;
  if (typeof value === "string") {
    if (/@/.test(value) || /\d{7,}/.test(value)) return "[redacted]";
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map(sanitizeRetainedAudit);

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !PII_AUDIT_KEY.test(key))
      .map(([key, entry]) => [
        key,
        sanitizeRetainedAudit(
          entry ?? (null as unknown as Prisma.JsonValue),
        ),
      ]),
  );
}

export async function exportUserData(database: PrismaClient, userId: string) {
  const user = await database.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      name: true,
      phone: true,
      image: true,
      privacyConsentAt: true,
      deletionRequestedAt: true,
      createdAt: true,
      updatedAt: true,
      role: { select: { type: true } },
      addresses: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          addressLine1: true,
          addressLine2: true,
          district: true,
          province: true,
          country: true,
          isDefault: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      reviews: {
        select: {
          id: true,
          paintId: true,
          rating: true,
          comment: true,
          adminReply: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      notifications: {
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          isRead: true,
          createdAt: true,
        },
      },
      conversation: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          messages: {
            select: {
              id: true,
              senderId: true,
              isAdmin: true,
              content: true,
              isRead: true,
              createdAt: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
      visualizerDesigns: {
        select: {
          id: true,
          roomId: true,
          name: true,
          palette: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      customer: {
        select: {
          id: true,
          totalSpent: true,
          customerType: true,
          companyName: true,
          taxCode: true,
          createdAt: true,
          updatedAt: true,
          wishlists: {
            select: {
              id: true,
              paintId: true,
              createdAt: true,
            },
          },
          wishlistColors: {
            select: {
              id: true,
              colorId: true,
              createdAt: true,
            },
          },
          quoteRequests: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true,
              companyName: true,
              projectName: true,
              projectType: true,
              area: true,
              paintType: true,
              message: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          orders: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              subtotal: true,
              discount: true,
              shippingFee: true,
              total: true,
              paymentMethod: true,
              shippingName: true,
              shippingPhone: true,
              shippingEmail: true,
              shippingAddress: true,
              shippingDistrict: true,
              shippingProvince: true,
              createdAt: true,
              updatedAt: true,
              items: {
                select: {
                  id: true,
                  paintId: true,
                  colorId: true,
                  productName: true,
                  productSku: true,
                  colorName: true,
                  colorCode: true,
                  quantity: true,
                  price: true,
                  total: true,
                },
              },
              payment: {
                select: {
                  method: true,
                  status: true,
                  amount: true,
                  paidAt: true,
                  refundedAt: true,
                },
              },
              statusHistory: {
                select: {
                  previousStatus: true,
                  newStatus: true,
                  note: true,
                  createdAt: true,
                },
                orderBy: { createdAt: "asc" },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!user) throw new ApiError(404, "Không tìm thấy tài khoản");
  const {
    customer,
    addresses,
    reviews,
    notifications,
    conversation,
    visualizerDesigns,
    role,
    ...profile
  } = user;
  return {
    exportedAt: new Date().toISOString(),
    profile: { ...profile, role: role.type },
    addresses,
    reviews,
    notifications,
    conversation,
    visualizerDesigns,
    customer: customer
      ? {
          id: customer.id,
          totalSpent: customer.totalSpent,
          customerType: customer.customerType,
          companyName: customer.companyName,
          taxCode: customer.taxCode,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
        }
      : null,
    orders: customer?.orders ?? [],
    quoteRequests: customer?.quoteRequests ?? [],
    wishlists: customer?.wishlists ?? [],
    wishlistColors: customer?.wishlistColors ?? [],
  };
}

export async function anonymizeUserData(
  database: PrismaClient,
  userId: string,
  now = new Date(),
) {
  return database.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({
      where: { id: userId },
      include: { customer: { select: { id: true } } },
    });
    if (!user) throw new ApiError(404, "Không tìm thấy tài khoản");
    if (user.deletionRequestedAt) {
      return { userId, alreadyAnonymized: true };
    }

    const identity = anonymizedIdentity(user.id);
    const customerId = user.customer?.id;
    const orders = customerId
      ? await transaction.order.findMany({
          where: { customerId },
          select: { id: true },
        })
      : [];
    const orderIds = orders.map(({ id }) => id);
    const auditRecords = await transaction.auditLog.findMany({
      where: { actorId: user.id },
      select: { id: true, beforeData: true, afterData: true },
    });

    if (customerId) {
      await transaction.order.updateMany({
        where: { customerId },
        data: {
          addressId: null,
          note: null,
          shippingName: null,
          shippingPhone: null,
          shippingEmail: null,
          shippingAddress: null,
          shippingDistrict: null,
          shippingProvince: null,
        },
      });
      await transaction.quoteRequest.updateMany({
        where: { customerId },
        data: {
          fullName: `Deleted customer ${identity.label}`,
          phone: "deleted",
          email: identity.email,
          companyName: null,
          projectName: null,
          paintType: null,
          message: "[deleted]",
          adminNote: null,
        },
      });
      await transaction.wishlist.deleteMany({ where: { customerId } });
      await transaction.wishlistColor.deleteMany({ where: { customerId } });
      await transaction.customer.update({
        where: { id: customerId },
        data: { companyName: null, taxCode: null },
      });
    }

    if (orderIds.length > 0) {
      await transaction.orderStatusHistory.updateMany({
        where: {
          orderId: { in: orderIds },
          changedByEmail: user.email,
        },
        data: { changedByEmail: identity.email, note: null },
      });
      await transaction.payment.updateMany({
        where: { orderId: { in: orderIds }, confirmedBy: user.email },
        data: { confirmedBy: null },
      });
      await transaction.payment.updateMany({
        where: { orderId: { in: orderIds }, refundedBy: user.email },
        data: { refundedBy: null },
      });
    }

    for (const record of auditRecords) {
      await transaction.auditLog.update({
        where: { id: record.id },
        data: {
          actorEmail: identity.email,
          beforeData:
            record.beforeData === null
              ? Prisma.JsonNull
              : sanitizeRetainedAudit(record.beforeData),
          afterData:
            record.afterData === null
              ? Prisma.JsonNull
              : sanitizeRetainedAudit(record.afterData),
        },
      });
    }

    await transaction.verificationToken.deleteMany({
      where: { identifier: { contains: user.email.toLowerCase() } },
    });
    await transaction.account.deleteMany({ where: { userId } });
    await transaction.session.deleteMany({ where: { userId } });
    await transaction.authSession.deleteMany({ where: { userId } });
    await transaction.mfaCredential.deleteMany({ where: { userId } });
    await transaction.notification.deleteMany({ where: { userId } });
    await transaction.visualizerDesign.deleteMany({ where: { userId } });
    await transaction.conversation.deleteMany({ where: { userId } });
    await transaction.address.deleteMany({ where: { userId } });

    await transaction.user.update({
      where: { id: userId },
      data: {
        email: identity.email,
        emailVerified: null,
        password: null,
        name: null,
        phone: null,
        image: null,
        privacyConsentAt: null,
        deletionRequestedAt: now,
        sessionVersion: { increment: 1 },
      },
    });
    await transaction.auditLog.create({
      data: {
        actorId: userId,
        actorEmail: identity.email,
        action: "ACCOUNT_ANONYMIZED",
        entityType: "User",
        entityId: userId,
        afterData: { deletionRequestedAt: now.toISOString() },
      },
    });

    return { userId, anonymizedEmail: identity.email, alreadyAnonymized: false };
  });
}

export async function applyPrivacyRetention(
  database: PrismaClient,
  now = new Date(),
) {
  const guestChatCutoff = new Date(
    now.getTime() - GUEST_CHAT_RETENTION_DAYS * DAY_MS,
  );
  const readNotificationCutoff = new Date(
    now.getTime() - READ_NOTIFICATION_RETENTION_DAYS * DAY_MS,
  );
  const unreadNotificationCutoff = new Date(
    now.getTime() - UNREAD_NOTIFICATION_RETENTION_DAYS * DAY_MS,
  );
  const revokedSessionCutoff = new Date(
    now.getTime() - REVOKED_SESSION_RETENTION_DAYS * DAY_MS,
  );

  const [verificationTokens, sessions, authSessions, guestChats, notifications] =
    await database.$transaction([
      database.verificationToken.deleteMany({ where: { expires: { lt: now } } }),
      database.session.deleteMany({ where: { expires: { lt: now } } }),
      database.authSession.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: now } },
            { revokedAt: { lt: revokedSessionCutoff } },
          ],
        },
      }),
      database.chatMessage.deleteMany({
        where: { createdAt: { lt: guestChatCutoff } },
      }),
      database.notification.deleteMany({
        where: {
          OR: [
            { isRead: true, createdAt: { lt: readNotificationCutoff } },
            { isRead: false, createdAt: { lt: unreadNotificationCutoff } },
          ],
        },
      }),
    ]);

  return {
    verificationTokens: verificationTokens.count,
    sessions: sessions.count,
    authSessions: authSessions.count,
    guestChats: guestChats.count,
    notifications: notifications.count,
  };
}
