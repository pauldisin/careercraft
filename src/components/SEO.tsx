import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  type?: string;
  schemaMarkup?: Record<string, any>;
  canonicalUrl?: string; // Optional manual override
}

export default function SEO({ title, description, type = 'website', schemaMarkup, canonicalUrl }: SEOProps) {
  // Dynamically resolve canonical URL based on window.location
  let computedCanonical = canonicalUrl;
  if (!computedCanonical && typeof window !== 'undefined') {
    let pathname = window.location.pathname;
    // Canonicalization best-practice: strip trailing slashes (except for root "/")
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    computedCanonical = `${window.location.origin}${pathname}`;
  }

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      
      {computedCanonical && (
        <link rel="canonical" href={computedCanonical} />
      )}
      {computedCanonical && (
        <meta property="og:url" content={computedCanonical} />
      )}
      
      {schemaMarkup && (
        <script type="application/ld+json">
          {JSON.stringify(schemaMarkup)}
        </script>
      )}
    </Helmet>
  );
}
