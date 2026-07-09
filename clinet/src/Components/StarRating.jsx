import React from "react";

/**
 * Lightweight star rating component — zero external dependencies.
 * Props:
 *   count    {number}  — total stars (default 5)
 *   value    {number}  — current rating (supports half-stars for display)
 *   edit     {boolean} — if true, stars are clickable
 *   size     {number}  — SVG size in px (default 20)
 *   activeColor {string} — filled star color (default #41789f)
 *   onChange {fn}     — called with new rating when edit=true
 */
const StarRating = ({
  count = 5,
  value = 0,
  edit = false,
  size = 20,
  activeColor = "#41789f",
  onChange,
}) => {
  const stars = Array.from({ length: count }, (_, i) => i + 1);

  const handleClick = (star) => {
    if (edit && onChange) onChange(star);
  };

  return (
    <div className="flex items-center gap-0.5" style={{ lineHeight: 1 }}>
      {stars.map((star) => {
        const filled = star <= Math.round(value);
        return (
          <svg
            key={star}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={filled ? activeColor : "none"}
            stroke={filled ? activeColor : "#d1c9be"}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            onClick={() => handleClick(star)}
            style={{
              cursor: edit ? "pointer" : "default",
              flexShrink: 0,
              transition: "fill 0.15s, stroke 0.15s",
            }}
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
      })}
    </div>
  );
};

export default StarRating;
