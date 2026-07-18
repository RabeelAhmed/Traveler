import React from "react";
import { Link } from "react-router-dom";

const Breadcrumbs = ({ items }) => {
  if (!items || items.length === 0) return null;

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => {
      const element = {
        "@type": "ListItem",
        "position": index + 1,
        "name": item.label,
      };
      if (item.url) {
        element.item = `https://traveler-social.netlify.app${item.url}`;
      }
      return element;
    }),
  };

  return (
    <nav
      className="flex items-center gap-1.5 text-xs font-sans text-sand-500 mb-6 w-full select-none justify-start"
      aria-label="Breadcrumb"
    >
      <script type="application/ld+json">{JSON.stringify(schemaData)}</script>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            {index > 0 && <span className="text-sand-300">/</span>}
            {isLast ? (
              <span className="font-semibold text-ocean-700 truncate max-w-[200px]">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.url}
                className="hover:text-ocean-600 hover:underline transition-colors duration-200"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
