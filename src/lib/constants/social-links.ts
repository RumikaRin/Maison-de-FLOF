/**
 * Brand social destinations. Read from NEXT_PUBLIC_* at build time so the URLs
 * are configurable without a code change; a link with no configured URL is
 * simply not rendered, so the footer never ships a dead "#" social link again.
 *
 * Defaults point at the FLOF brand handles; override in the environment to
 * change them per deployment.
 */
export type SocialLink = { name: string; href: string };

const RAW_LINKS: Array<{ name: string; url: string | undefined; fallback: string }> = [
  { name: "Facebook", url: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK, fallback: "https://www.facebook.com/flof.vn" },
  { name: "Instagram", url: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM, fallback: "https://www.instagram.com/flof.vn" },
  { name: "YouTube", url: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE, fallback: "https://www.youtube.com/@flof.vn" },
  { name: "Zalo", url: process.env.NEXT_PUBLIC_SOCIAL_ZALO, fallback: "https://zalo.me/flof" },
];

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export const SOCIAL_LINKS: SocialLink[] = RAW_LINKS.map(({ name, url, fallback }) => ({
  name,
  href: url && isValidHttpUrl(url) ? url : fallback,
})).filter((link) => isValidHttpUrl(link.href));
