import React from "react";
import { Helmet } from "react-helmet-async";

const SEO = ({ title, description, path, image, type = "website", noindex, children }) => {
  const defaultTitle = "Traveler — Social Network for Travelers";
  const defaultDescription = "Share travel stories, map trip milestones, collaborate with friends, and discover hidden gems in Pakistan.";
  const defaultImage = "https://traveler-social.netlify.app/Logo.png";
  const baseUrl = "https://traveler-social.netlify.app";

  const metaTitle = title || defaultTitle;
  const metaDescription = description || defaultDescription;
  const metaImage = image || defaultImage;
  const canonicalUrl = `${baseUrl}${path || ""}`;

  return (
    <Helmet>
      {/* Title */}
      <title>{metaTitle}</title>

      {/* Meta tags */}
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Robots meta tag for blocking search engine indexation on request */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* Open Graph (Facebook / LinkedIn) */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:site_name" content="Traveler" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />

      {/* Dynamic Children (e.g. JSON-LD scripts) */}
      {children}
    </Helmet>
  );
};

export default SEO;
