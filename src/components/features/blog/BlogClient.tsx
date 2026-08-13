/* Hallmark · genre: editorial · macrostructure: 02 Long Document · design-system: design.md · designed-as-app */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CspImage as Image } from "@/components/ui/csp-image";
import { useLanguageStore } from "@/store/language-store";
import { EditorialHeading, Rule, TypographicLink } from "@/components/ui/editorial";
import type { PublicBlog } from "@/services/blog.service";

interface BlogClientProps {
  initialBlog: PublicBlog | null;
  initialRelatedBlogs: PublicBlog[];
}

/**
 * A journal article as a long document: serif display headline, metadata as
 * technical labels on hairline rules, 68ch measure, and no boxes anywhere.
 * The contextual CTAs become typographic asides rather than gradient panels.
 */
export function BlogClient({ initialBlog, initialRelatedBlogs }: BlogClientProps) {
  const { language } = useLanguageStore();

  const [mounted, setMounted] = useState(false);
  const [blog] = useState(initialBlog);
  const [relatedBlogs] = useState(initialRelatedBlogs);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!blog) {
    return (
      <div className="mx-auto w-full max-w-[100rem] px-[clamp(1rem,4vw,1.5rem)] py-fl-2xl">
        <h2 className="fl-display text-fl-2xl text-atelier-ink">
          {language === "vi" ? "Bài viết không tồn tại" : "Article Not Found"}
        </h2>
        <Link
          href="/blog"
          className="mt-fl-sm inline-flex min-h-11 items-center gap-2 whitespace-nowrap text-fl-sm font-medium text-atelier-accent underline decoration-1 underline-offset-4 transition-[text-decoration-thickness] duration-fl-fast ease-fl-out hover:decoration-2 md:min-h-6"
        >
          <span aria-hidden="true">←</span>
          {language === "vi" ? "Quay lại danh sách bài viết" : "Back to blogs"}
        </Link>
      </div>
    );
  }

  // Split contents by paragraph breaks
  const paragraphs = (language === "vi" ? blog.content : blog.contentEn)?.split("\n\n") || [];

  return (
    <div className="mx-auto w-full max-w-4xl px-[clamp(1rem,4vw,1.5rem)] pb-fl-2xl pt-fl-md text-atelier-ink">
      {/* Back to blogs list */}
      <Link
        href="/blog"
        className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap text-fl-sm text-atelier-ink-2 transition-colors duration-fl-fast ease-fl-out hover:text-atelier-ink md:min-h-6"
      >
        <span aria-hidden="true">←</span>
        {language === "vi" ? "Quay lại danh sách bài viết" : "Back to blogs"}
      </Link>

      <article className="mt-fl-lg">
        {/* Category label stacked above the length-bracketed serif headline */}
        <EditorialHeading as="h1" label={language === "vi" ? blog.category : blog.categoryEn}>
          {language === "vi" ? blog.title : blog.titleEn}
        </EditorialHeading>

        {/* Metadata — technical labels between hairline rules */}
        <div className="mt-fl-md flex flex-wrap items-baseline gap-x-fl-md gap-y-fl-2xs border-y border-atelier-rule py-fl-xs">
          <span className="fl-label">{blog.author}</span>
          <span className="fl-label">{blog.createdAt}</span>
          <span className="fl-label">{blog.readTime}</span>
        </div>

        {/* Cover image */}
        <div className="relative mt-fl-lg aspect-[16/9] w-full overflow-hidden rounded-surface bg-atelier-paper-2">
          <Image src={blog.image} alt={blog.title} fill priority sizes="(min-width: 1024px) 56rem, 100vw" className="object-cover" />
        </div>

        {/* Body — continuous prose at the 68ch measure */}
        <div className="fl-measure mt-fl-xl flex flex-col gap-fl-md text-fl-md text-atelier-ink">
          {paragraphs.map((p: string, idx: number) => (
            <p key={idx}>{p}</p>
          ))}
        </div>

        {/* Contextual asides — a rule, a line of Playfair, one typographic action */}
        {blog.id === "blog-1" && (
          <aside className="fl-measure mt-fl-xl border-t border-atelier-rule pt-fl-md">
            <h2 className="fl-display text-fl-xl text-atelier-ink">
              {language === "vi"
                ? "Bạn muốn thử nghiệm phối các màu sắc này?"
                : "Want to try these colors?"}
            </h2>
            <p className="mt-fl-xs text-fl-sm text-atelier-ink-2">
              {language === "vi"
                ? "Duyệt qua hàng ngàn mã màu chuẩn của chúng tôi và chọn ra tông màu hoàn hảo."
                : "Browse through our full catalog and find matching coordinated schemes easily."}
            </p>
            <TypographicLink href="/colors" className="mt-fl-sm">
              {language === "vi" ? "Khám phá bảng màu" : "Explore Color Catalog"}
            </TypographicLink>
          </aside>
        )}

        {blog.id === "blog-2" && (
          <aside className="fl-measure mt-fl-xl border-t border-atelier-rule pt-fl-md">
            <h2 className="fl-display text-fl-xl text-atelier-ink">
              {language === "vi"
                ? "Thử nghiệm phối màu 3D trực quan"
                : "Try Our 3D Color Visualizer"}
            </h2>
            <p className="mt-fl-xs text-fl-sm text-atelier-ink-2">
              {language === "vi"
                ? "Trực quan hóa màu sơn mong ước trên các không gian phòng mẫu 3D thực tế trước khi quyết định mua hàng."
                : "Visualize your dream paint colors on interactive 3D model rooms before making a purchase."}
            </p>
            <TypographicLink href="/color-visualizer" className="mt-fl-sm">
              {language === "vi" ? "Trải nghiệm ngay" : "Try It Now"}
            </TypographicLink>
          </aside>
        )}
      </article>

      {/* Related articles — hairline list rows, no boxed cards */}
      {relatedBlogs.length > 0 && (
        <section className="mt-fl-2xl">
          <Rule weight="strong" />
          <h2 className="fl-display mt-fl-lg text-fl-2xl text-atelier-ink">
            {language === "vi" ? "Bài viết liên quan" : "Related Articles"}
          </h2>
          <ul className="mt-fl-md flex flex-col border-t border-atelier-rule">
            {relatedBlogs.map((item) => {
              const title = language === "vi" ? item.title : item.titleEn;
              return (
                <li key={item.id} className="border-b border-atelier-rule">
                  <Link
                    href={`/blog/${item.slug}`}
                    className="group grid grid-cols-5 gap-fl-sm py-fl-md"
                  >
                    <span className="relative col-span-2 block aspect-[4/3] overflow-hidden rounded-surface bg-atelier-paper-2 sm:col-span-1">
                      <Image src={item.image} alt={title} fill sizes="200px" className="object-cover" />
                    </span>
                    <span className="col-span-3 flex min-w-0 flex-col justify-center sm:col-span-4">
                      <span className="fl-label">
                        {language === "vi" ? item.category : item.categoryEn}
                      </span>
                      <span className="mt-fl-2xs font-serif text-fl-lg leading-snug text-atelier-ink transition-opacity duration-fl-fast ease-fl-out group-hover:opacity-85 line-clamp-2">
                        {title}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
