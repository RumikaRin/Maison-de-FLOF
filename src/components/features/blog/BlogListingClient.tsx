/* Hallmark · genre: editorial · macrostructure: 11 Catalogue · design-system: design.md · designed-as-app */
"use client";

import { useState } from "react";
import Link from "next/link";
import { CspImage as Image } from "@/components/ui/csp-image";
import { useLanguageStore } from "@/store/language-store";
import { useTrans } from "@/lib/dictionary";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { safeMotion, useReducedMotion } from "@/components/ui/motion-safe";
import {
  EditorialHeading,
  EditorialSection,
  Rule,
} from "@/components/ui/editorial";
import type { PublicBlog } from "@/services/blog.service";

interface BlogListingClientProps {
  initialBlogs: PublicBlog[];
}

/**
 * The journal index — a catalogue of articles. One featured article carried by
 * its crop, the rest as hairline list rows on paper ground, imitating the
 * home-page journal band without the drench.
 */
export function BlogListingClient({ initialBlogs }: BlogListingClientProps) {
  const { language } = useLanguageStore();
  const t = useTrans(language);
  const reduceMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredBlogs = initialBlogs.filter((blog) => {
    const matchesSearch =
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.summaryEn.toLowerCase().includes(searchQuery.toLowerCase());
    const blogCat = language === "vi" ? blog.category : blog.categoryEn;
    const matchesCategory = selectedCategory === "all" || blogCat === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(initialBlogs.map((blog) => language === "vi" ? blog.category : blog.categoryEn))).filter(Boolean);

  const featured = filteredBlogs[0];
  const rest = filteredBlogs.slice(1);

  /* C1 outlined rectangular chip — filters only. */
  const chipClass = (active: boolean) =>
    cn(
      "min-h-11 whitespace-nowrap rounded-control border px-fl-sm text-fl-sm transition-colors duration-fl-fast ease-fl-out md:min-h-10",
      active
        ? "border-atelier-ink bg-atelier-ink text-atelier-paper"
        : "border-atelier-rule-strong text-atelier-ink-2 hover:border-atelier-ink hover:text-atelier-ink",
    );

  return (
    <div className="bg-atelier-paper text-atelier-ink">
      <EditorialSection rhythm="tight">
        {/* Inventory header — label, headline, count */}
        <EditorialHeading as="h1" scale="3xl" label={t.catalogueJournalEyebrow}>
          {t.catalogueJournalTitle}
        </EditorialHeading>
        <p className="fl-measure mt-fl-sm text-fl-sm text-atelier-ink-2">
          {initialBlogs.length} {t.catalogueArticlesLabel} ·{" "}
          {language === "vi"
            ? "Xu hướng phối màu thời thượng và cẩm nang thi công sơn nước chuyên nghiệp."
            : "Trending color palettes and professional paint application guides."}
        </p>

        <Rule className="mt-fl-lg" weight="strong" />

        {/* Filter rail — search + category chips */}
        <div className="mt-fl-md flex flex-col gap-fl-sm lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full max-w-sm">
            <label htmlFor="journal-search" className="fl-label">
              {language === "vi" ? "Tìm kiếm" : "Search"}
            </label>
            <Input
              id="journal-search"
              type="text"
              placeholder={language === "vi" ? "Tìm kiếm bài viết…" : "Search articles…"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mt-fl-2xs"
            />
          </div>
          <div
            role="group"
            aria-label={language === "vi" ? "Lọc theo chủ đề" : "Filter by category"}
            className="flex flex-wrap gap-fl-2xs"
          >
            <button
              type="button"
              aria-pressed={selectedCategory === "all"}
              onClick={() => setSelectedCategory("all")}
              className={chipClass(selectedCategory === "all")}
            >
              {language === "vi" ? "Tất cả" : "All"}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                aria-pressed={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
                className={chipClass(selectedCategory === cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredBlogs.length > 0 ? (
          <safeMotion.div
            key={searchQuery + selectedCategory}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.24 }}
            className="mt-fl-lg"
          >
            {/* Featured article — the crop carries it */}
            {featured ? (
              <article className="grid grid-cols-1 gap-y-fl-md border-t border-atelier-rule pt-fl-lg lg:grid-cols-12 lg:gap-x-fl-lg">
                <Link
                  href={`/blog/${featured.slug}`}
                  className="group relative block aspect-[16/10] w-full overflow-hidden rounded-surface bg-atelier-paper-2 lg:col-span-7"
                >
                  <Image
                    src={featured.image}
                    alt={language === "vi" ? featured.title : featured.titleEn}
                    fill
                    priority
                    sizes="(min-width: 1024px) 55vw, 100vw"
                    className="object-cover"
                  />
                </Link>
                <div className="flex flex-col justify-center lg:col-span-5">
                  <p className="fl-label">{t.catalogueFeaturedLabel}</p>
                  <p className="mt-fl-2xs flex flex-wrap items-baseline gap-x-fl-sm gap-y-fl-3xs">
                    <span className="fl-label">
                      {language === "vi" ? featured.category : featured.categoryEn}
                    </span>
                    <span className="fl-label">{featured.createdAt}</span>
                    <span className="fl-label">{featured.readTime}</span>
                  </p>
                  <Link href={`/blog/${featured.slug}`} className="group mt-fl-xs block">
                    <h2 className="fl-display max-w-xl text-fl-2xl text-atelier-ink transition-opacity duration-fl-fast ease-fl-out group-hover:opacity-85">
                      {language === "vi" ? featured.title : featured.titleEn}
                    </h2>
                  </Link>
                  <p className="fl-measure-tight mt-fl-sm text-fl-sm text-atelier-ink-2 line-clamp-3">
                    {language === "vi" ? featured.summary : featured.summaryEn}
                  </p>
                  <p className="mt-fl-sm text-fl-sm text-atelier-ink-2">{featured.author}</p>
                </div>
              </article>
            ) : null}

            {/* The rest — hairline list rows */}
            {rest.length > 0 ? (
              <ul className="mt-fl-lg flex flex-col border-t border-atelier-rule">
                {rest.map((blog) => {
                  const title = language === "vi" ? blog.title : blog.titleEn;
                  const summary = language === "vi" ? blog.summary : blog.summaryEn;
                  return (
                    <li key={blog.id} className="border-b border-atelier-rule">
                      <Link
                        href={`/blog/${blog.slug}`}
                        className="group grid grid-cols-1 gap-fl-sm py-fl-md sm:grid-cols-12 sm:gap-x-fl-lg"
                      >
                        <span className="relative block aspect-[4/3] w-full overflow-hidden rounded-surface bg-atelier-paper-2 sm:col-span-3">
                          <Image
                            src={blog.image}
                            alt={title}
                            fill
                            sizes="(min-width: 640px) 25vw, 100vw"
                            className="object-cover"
                          />
                        </span>
                        <span className="flex min-w-0 flex-col justify-center sm:col-span-9">
                          <span className="flex flex-wrap items-baseline gap-x-fl-sm gap-y-fl-3xs">
                            <span className="fl-label">
                              {language === "vi" ? blog.category : blog.categoryEn}
                            </span>
                            <span className="fl-label">{blog.createdAt}</span>
                            <span className="fl-label">{blog.readTime}</span>
                          </span>
                          <span className="mt-fl-2xs font-serif text-fl-xl leading-snug text-atelier-ink transition-opacity duration-fl-fast ease-fl-out group-hover:opacity-85 line-clamp-2">
                            {title}
                          </span>
                          <span className="fl-measure mt-fl-2xs text-fl-sm text-atelier-ink-2 line-clamp-2">
                            {summary}
                          </span>
                          <span className="mt-fl-xs whitespace-nowrap text-fl-sm font-medium text-atelier-accent underline decoration-1 underline-offset-4 transition-[text-decoration-thickness] duration-fl-fast ease-fl-out group-hover:decoration-2">
                            {t.readMore} <span aria-hidden="true">→</span>
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </safeMotion.div>
        ) : (
          /* Editorial empty state: a rule, a line of Playfair. */
          <div className="mt-fl-lg border-t border-atelier-rule pt-fl-lg">
            <p className="fl-display max-w-xl text-fl-xl text-atelier-ink">
              {language === "vi"
                ? "Không tìm thấy bài viết nào phù hợp."
                : "No articles match your search."}
            </p>
          </div>
        )}
      </EditorialSection>
    </div>
  );
}
