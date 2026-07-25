import { db } from "@/lib/db";
import { BlogClient } from "@/components/features/blog/BlogClient";
import { Metadata } from "next";
import { findPublishedBlogWithRelated } from "@/services/blog.service";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const blog = await db.blog.findUnique({
    where: { slug },
    select: { title: true, titleEn: true, summary: true, summaryEn: true, image: true }
  });

  if (!blog) {
    return {
      title: "Article Not Found - Maison de FLOF",
      description: "This article does not exist.",
    };
  }

  return {
    title: `${blog.title} - Maison de FLOF`,
    description: blog.summary || `Read ${blog.title} at Maison de FLOF.`,
    openGraph: {
      images: blog.image ? [blog.image] : [],
    }
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const result = await findPublishedBlogWithRelated(db, slug);

  if (!result) {
    return <BlogClient initialBlog={null} initialRelatedBlogs={[]} />;
  }

  const mappedBlog = result.blog;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": mappedBlog.title,
    "image": mappedBlog.image ? [mappedBlog.image] : [],
    "datePublished": result.publishedAt.toISOString(),
    "description": mappedBlog.summary || "",
    "author": [{
      "@type": "Person",
      "name": mappedBlog.author
    }]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogClient
        initialBlog={mappedBlog}
        initialRelatedBlogs={result.relatedBlogs}
      />
    </>
  );
}
