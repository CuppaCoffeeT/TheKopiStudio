/**
 * SEO — pure-presentation `<head>` metadata primitive.
 *
 * Renders Helmet tags that block crawlers + set page title/description. Stateless;
 * caller decides title + description per page.
 *
 * Promoted 2026-05-15 from legacy `@/components/SEOBlock` per W09 grep 6b
 * (no slot-filler sanction — pure primitive, no data coupling).
 */
import { Helmet } from 'react-helmet-async';

export interface SEOProps {
  title?: string;
  description?: string;
}

export const SEO = ({
  title = 'Internal Portal',
  description = 'Internal use only - Not for public access',
}: SEOProps) => (
  <Helmet>
    <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
    <meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
    <meta name="bingbot" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />

    <title>{title} - Prospect Profiler</title>
    <meta name="description" content={description} />

    <meta property="og:robots" content="noindex, nofollow" />
    <meta property="og:title" content="Private Internal Portal" />
    <meta property="og:description" content="Internal use only - Not for public access" />
    <meta property="og:type" content="website" />

    <meta name="twitter:robots" content="noindex, nofollow" />
    <meta name="twitter:title" content="Private Internal Portal" />
    <meta name="twitter:description" content="Internal use only - Not for public access" />
    <meta name="twitter:card" content="summary" />

    <meta http-equiv="X-Robots-Tag" content="noindex, nofollow, noarchive, nosnippet" />
  </Helmet>
);
