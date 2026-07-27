import type { Blog, Prisma, PrismaClient } from "@prisma/client";

export const DEFAULT_BLOG_IMAGE = "/room_inspiration.webp";

type RelatedPostCandidate = Pick<
  Blog,
  "id" | "slug" | "category" | "isActive" | "createdAt"
>;

type BlogWithAuthor = Prisma.BlogGetPayload<{
  include: { author: { select: { name: true } } };
}>;

export const PUBLIC_BLOG_CARD_SELECT = {
  id: true,
  title: true,
  titleEn: true,
  slug: true,
  summary: true,
  summaryEn: true,
  image: true,
  category: true,
  categoryEn: true,
  createdAt: true,
  author: { select: { name: true } },
} satisfies Prisma.BlogSelect;

type BlogCardRow = Prisma.BlogGetPayload<{
  select: typeof PUBLIC_BLOG_CARD_SELECT;
}>;

export type PublicBlog = ReturnType<typeof serializePublicBlog>;
export type PublicBlogCard = ReturnType<typeof serializePublicBlogCard>;

export function rankRelatedPosts<T extends RelatedPostCandidate>(
  posts: readonly T[],
  current: { currentSlug: string; category: string },
  limit = 3,
) {
  return posts
    .filter(({ isActive, slug }) => isActive && slug !== current.currentSlug)
    .sort((left, right) => {
      const leftCategory = left.category === current.category ? 1 : 0;
      const rightCategory = right.category === current.category ? 1 : 0;
      return (
        rightCategory - leftCategory ||
        right.createdAt.getTime() - left.createdAt.getTime()
      );
    })
    .slice(0, limit);
}

export function serializePublicBlog(blog: BlogWithAuthor) {
  return {
    id: blog.id,
    title: blog.title,
    titleEn: blog.titleEn || blog.title,
    slug: blog.slug,
    summary: blog.summary,
    summaryEn: blog.summaryEn || blog.summary,
    content: blog.content,
    contentEn: blog.contentEn || blog.content,
    image: blog.image || DEFAULT_BLOG_IMAGE,
    category: blog.category,
    categoryEn: blog.categoryEn,
    author: blog.author.name || "Maison de FLOF",
    readTime: "5 phút đọc / 5 min read",
    createdAt: blog.createdAt.toISOString().split("T")[0],
  };
}

export function serializePublicBlogCard(blog: BlogCardRow) {
  return {
    id: blog.id,
    title: blog.title,
    titleEn: blog.titleEn || blog.title,
    slug: blog.slug,
    summary: blog.summary,
    summaryEn: blog.summaryEn || blog.summary,
    image: blog.image || DEFAULT_BLOG_IMAGE,
    category: blog.category,
    categoryEn: blog.categoryEn,
    author: blog.author.name || "Maison de FLOF",
    readTime: "5 phút đọc / 5 min read",
    createdAt: blog.createdAt.toISOString().split("T")[0],
  };
}

export async function findRelatedBlogs(
  database: PrismaClient,
  current: Pick<Blog, "slug" | "category">,
  limit = 3,
) {
  const include = { author: { select: { name: true } } } as const;
  const preferred = await database.blog.findMany({
    where: {
      isActive: true,
      slug: { not: current.slug },
      category: current.category,
    },
    include,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const remaining = limit - preferred.length;
  const fallback =
    remaining > 0
      ? await database.blog.findMany({
          where: {
            isActive: true,
            slug: { not: current.slug },
            category: { not: current.category },
          },
          include,
          orderBy: { createdAt: "desc" },
          take: remaining,
        })
      : [];

  return [...preferred, ...fallback].map(serializePublicBlog);
}

export async function findPublishedBlogWithRelated(
  database: PrismaClient,
  slug: string,
) {
  const blog = await database.blog.findFirst({
    where: { slug, isActive: true },
    include: { author: { select: { name: true } } },
  });
  if (!blog) return null;

  return {
    blog: serializePublicBlog(blog),
    relatedBlogs: await findRelatedBlogs(database, blog),
    publishedAt: blog.createdAt,
  };
}
