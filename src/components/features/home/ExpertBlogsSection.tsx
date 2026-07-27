/* Hallmark · genre: editorial · section: expert journal · knobs: drench=espresso, featured=7/5 crop-led, supporting=hairline list rows · design-system: design.md · designed-as-app */ "use client";

import { CspImage as Image } from "@/components/ui/csp-image";
import Link from "next/link";
import { useLanguageStore } from "@/store/language-store";
import { DrenchBand, TypographicLink } from "@/components/ui/editorial";

interface ExpertBlogsSectionProps {
  blogs: any[];
}

/**
 * Expert journal — advice with editorial authority. One featured article and a
 * compact supporting list; hierarchy comes from crop, title scale and spacing,
 * not from boxed cards. The section sits on the espresso field.
 */
export function ExpertBlogsSection({ blogs }: ExpertBlogsSectionProps) {
  const { language } = useLanguageStore();
  const list = blogs.slice(0, 3);
  const featured = list[0];
  const rest = list.slice(1);

  if (!list.length) return null;

  return (
    <DrenchBand
      color="espresso"
      id="blogs-section"
      className="fl-rise fl-band-grow relative py-fl-3xl md:py-fl-4xl"
    >
      <div
        className="relative mx-auto w-full max-w-[100rem] px-[clamp(1rem,4vw,1.5rem)]"
        data-fl-io
      >
        <div className="flex flex-col gap-fl-sm sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="fl-label">
              {language === "vi" ? "Sổ tay chuyên gia" : "The journal"}
            </p>
            <div className="fl-mask-line mt-fl-xs">
              <h2 className="fl-display text-fl-3xl">
                {language === "vi"
                  ? "Xu hướng từ chuyên gia"
                  : "Trends from the experts"}
              </h2>
            </div>
          </div>
          <TypographicLink href="/blog" className="shrink-0">
            {language === "vi" ? "Tất cả bài viết" : "All articles"}
          </TypographicLink>
        </div>

        <div className="mt-fl-lg grid grid-cols-1 gap-y-fl-lg lg:grid-cols-12 lg:gap-x-fl-lg">
          {/* Featured — the crop carries it */}
          {featured ? (
            <article className="lg:col-span-7">
              <Link href={`/blog/${featured.slug}`} className="group block">
                <span className="fl-photo-plate fl-curtain-u relative block aspect-[16/10] w-full overflow-hidden rounded-surface">
                  <Image
                    src={featured.image}
                    alt={
                      language === "vi"
                        ? featured.title
                        : featured.titleEn || featured.title
                    }
                    fill
                    sizes="(min-width: 1024px) 55vw, 100vw"
                    className="object-cover transition-transform duration-fl-slow ease-fl-out group-hover:scale-[1.03] motion-reduce:transform-none"
                  />
                </span>
                <span className="mt-fl-sm flex items-baseline gap-fl-sm border-t border-atelier-rule-on-dark pt-fl-xs">
                  <span className="fl-label">
                    {language === "vi"
                      ? featured.category
                      : featured.categoryEn || featured.category}
                  </span>
                  {featured.createdAt ? (
                    <span className="fl-label">{featured.createdAt}</span>
                  ) : null}
                </span>
                <h3 className="fl-display mt-fl-xs max-w-xl text-fl-2xl transition-opacity duration-fl-fast ease-fl-out group-hover:opacity-85">
                  {language === "vi" ? featured.title : featured.titleEn || featured.title}
                </h3>
                <p className="fl-measure-tight mt-fl-xs text-fl-sm line-clamp-2">
                  {language === "vi"
                    ? featured.summary
                    : featured.summaryEn || featured.summary}
                </p>
              </Link>
            </article>
          ) : null}

          {/* Supporting list — hairline rows, no boxes */}
          <div className="lg:col-span-5 lg:border-l lg:border-atelier-rule-on-dark lg:pl-fl-lg">
            <ul className="fl-stagger flex flex-col">
              {rest.map((blog) => {
                const title = language === "vi" ? blog.title : blog.titleEn || blog.title;
                const summary =
                  language === "vi" ? blog.summary : blog.summaryEn || blog.summary;

                return (
                  <li key={blog.id} className="border-b border-atelier-rule-on-dark">
                    <Link
                      href={`/blog/${blog.slug}`}
                      className="group grid grid-cols-5 gap-fl-sm py-fl-md"
                    >
                      <span className="relative col-span-2 block aspect-[4/3] overflow-hidden rounded-surface">
                        <Image
                          src={blog.image}
                          alt={title}
                          fill
                          sizes="200px"
                          className="object-cover transition-transform duration-fl-slow ease-fl-out group-hover:scale-[1.03] motion-reduce:transform-none"
                        />
                      </span>
                      <span className="col-span-3 flex flex-col justify-center">
                        {blog.createdAt ? (
                          <span className="fl-label">{blog.createdAt}</span>
                        ) : null}
                        <span className="mt-fl-2xs font-serif text-fl-lg leading-snug transition-opacity duration-fl-fast ease-fl-out group-hover:opacity-85 line-clamp-2">
                          {title}
                        </span>
                        <span className="mt-fl-2xs text-fl-sm line-clamp-2">
                          {summary}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </DrenchBand>
  );
}
