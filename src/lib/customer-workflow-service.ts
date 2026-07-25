import type { PrismaClient, QuoteStatus } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";
import { ApiError } from "@/lib/api-auth";

export type WorkflowActor = {
  id: string;
  email: string;
};

export type CustomerIdentity = WorkflowActor & {
  name?: string | null;
};

export type ReviewInput = {
  paintId: string;
  rating: number;
  comment: string;
};

export function submitVerifiedReview(
  database: PrismaClient,
  userId: string,
  input: ReviewInput,
) {
  return database.$transaction(async (tx) => {
    const purchased = await tx.order.findFirst({
      where: {
        customer: { userId },
        status: "COMPLETED",
        items: { some: { paintId: input.paintId } },
      },
      select: { id: true },
    });
    if (!purchased) {
      throw new ApiError(
        403,
        "Bạn chỉ có thể đánh giá sản phẩm đã mua và hoàn tất",
      );
    }

    const review = await tx.review.upsert({
      where: {
        paintId_userId: {
          paintId: input.paintId,
          userId,
        },
      },
      update: {
        rating: input.rating,
        comment: input.comment,
      },
      create: {
        paintId: input.paintId,
        userId,
        rating: input.rating,
        comment: input.comment,
      },
      include: { user: { select: { name: true, image: true } } },
    });
    const staff = await tx.user.findMany({
      where: { role: { type: { in: ["ADMIN", "STAFF"] } } },
      select: { id: true },
    });
    if (staff.length > 0) {
      await tx.notification.createMany({
        data: staff.map(({ id }) => ({
          userId: id,
          type: "REVIEW" as const,
          title: "Đánh giá sản phẩm mới",
          message: `${review.user.name || "Khách hàng"} đã đánh giá ${input.rating} sao.`,
        })),
      });
    }
    return review;
  });
}

export function replyToReview(
  database: PrismaClient,
  actor: WorkflowActor,
  input: { id: string; adminReply: string },
) {
  return database.$transaction(async (tx) => {
    const review = await tx.review.update({
      where: { id: input.id },
      data: { adminReply: input.adminReply || null },
      include: {
        user: { select: { name: true, email: true } },
        paint: { select: { name: true, sku: true } },
      },
    });
    await createAuditLog(tx, {
      actor,
      action: "REVIEW_REPLIED",
      entityType: "Review",
      entityId: review.id,
      afterData: { hasAdminReply: Boolean(review.adminReply) },
    });
    return review;
  });
}

export function deleteReview(
  database: PrismaClient,
  actor: WorkflowActor,
  id: string,
) {
  return database.$transaction(async (tx) => {
    await tx.review.delete({ where: { id } });
    await createAuditLog(tx, {
      actor,
      action: "REVIEW_DELETED",
      entityType: "Review",
      entityId: id,
    });
  });
}

export type QuoteRequestInput = {
  fullName: string;
  phone: string;
  email: string;
  companyName: string | null;
  projectName: string | null;
  projectType: string;
  area?: number | null;
  paintType: string | null;
  message: string;
};

export function createQuoteRequest(
  database: PrismaClient,
  customerId: string | null,
  input: QuoteRequestInput,
) {
  return database.$transaction(async (tx) => {
    const created = await tx.quoteRequest.create({
      data: {
        customerId,
        ...input,
        area: input.area || null,
      },
    });
    const staff = await tx.user.findMany({
      where: { role: { type: { in: ["ADMIN", "STAFF"] } } },
      select: { id: true },
    });
    if (staff.length > 0) {
      await tx.notification.createMany({
        data: staff.map(({ id }) => ({
          userId: id,
          type: "QUOTE" as const,
          title: "Yêu cầu báo giá mới",
          message: `Khách hàng ${input.fullName} yêu cầu báo giá cho dự án ${input.projectType}.`,
        })),
      });
    }
    return created;
  });
}

export function updateQuoteRequest(
  database: PrismaClient,
  actor: WorkflowActor,
  input: {
    id: string;
    status: QuoteStatus;
    adminNote?: string | null;
  },
) {
  return database.$transaction(async (tx) => {
    const quote = await tx.quoteRequest.update({
      where: { id: input.id },
      data: {
        status: input.status,
        adminNote: input.adminNote || null,
      },
    });
    await createAuditLog(tx, {
      actor,
      action: "QUOTE_STATUS_CHANGED",
      entityType: "QuoteRequest",
      entityId: quote.id,
      afterData: {
        status: quote.status,
        hasAdminNote: Boolean(quote.adminNote),
      },
    });
    return quote;
  });
}

export function getConversationForUser(
  database: PrismaClient,
  userId: string,
) {
  return database.conversation.findUnique({
    where: { userId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}

export function appendCustomerMessage(
  database: PrismaClient,
  customer: CustomerIdentity,
  input: { content: string },
) {
  return database.$transaction(async (tx) => {
    let conversation = await tx.conversation.findUnique({
      where: { userId: customer.id },
    });
    if (!conversation) {
      conversation = await tx.conversation.create({
        data: { userId: customer.id, status: "IN_PROGRESS" },
      });
    } else {
      conversation = await tx.conversation.update({
        where: { id: conversation.id },
        data: { status: "IN_PROGRESS", updatedAt: new Date() },
      });
    }
    const message = await tx.message.create({
      data: {
        conversationId: conversation.id,
        senderId: customer.id,
        isAdmin: false,
        content: input.content,
      },
    });
    const staff = await tx.user.findMany({
      where: { role: { type: { in: ["ADMIN", "STAFF"] } } },
      select: { id: true },
    });
    if (staff.length > 0) {
      await tx.notification.createMany({
        data: staff.map(({ id }) => ({
          userId: id,
          type: "SYSTEM" as const,
          title: "Tin nhắn Live Chat mới",
          message: `${customer.name || "Khách hàng"}: ${message.content.slice(0, 50)}...`,
        })),
      });
    }
    return { conversation, message };
  });
}

export function listStaffConversations(database: PrismaClient) {
  return database.conversation.findMany({
    include: {
      user: {
        select: { name: true, email: true, phone: true, image: true },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export function appendStaffMessage(
  database: PrismaClient,
  actor: WorkflowActor,
  conversationId: string,
  content: string,
) {
  return database.$transaction(async (tx) => {
    const conversation = await tx.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true },
    });
    if (!conversation) {
      throw new ApiError(404, "Không tìm thấy đoạn hội thoại");
    }
    const message = await tx.message.create({
      data: {
        conversationId,
        senderId: actor.id,
        isAdmin: true,
        content,
      },
    });
    await tx.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date(), status: "IN_PROGRESS" },
    });
    await createAuditLog(tx, {
      actor,
      action: "CHAT_REPLY_SENT",
      entityType: "Conversation",
      entityId: conversationId,
      afterData: { messageId: message.id, status: "IN_PROGRESS" },
    });
    return message;
  });
}

export function readConversationAsStaff(
  database: PrismaClient,
  actor: WorkflowActor,
  conversationId: string,
) {
  return database.$transaction(async (tx) => {
    const exists = await tx.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true },
    });
    if (!exists) throw new ApiError(404, "Không tìm thấy đoạn hội thoại");
    await tx.message.updateMany({
      where: {
        conversationId,
        isAdmin: false,
        isRead: false,
      },
      data: { isRead: true },
    });
    await createAuditLog(tx, {
      actor,
      action: "CHAT_CONVERSATION_READ",
      entityType: "Conversation",
      entityId: conversationId,
    });
    return tx.conversation.findUniqueOrThrow({
      where: { id: conversationId },
      include: {
        user: {
          select: { name: true, email: true, phone: true, image: true },
        },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
  });
}
