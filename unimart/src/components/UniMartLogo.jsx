import React from 'react';
import Svg, { Rect, Path, Line } from 'react-native-svg';

/**
 * UniMart brand logo — blue rounded square with white cap/bag icon.
 * Use anywhere a logo is needed (login, register, splash).
 */
export default function UniMartLogo({ size = 72, bg = '#2563EB', fg = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      {/* Rounded square background */}
      <Rect width="72" height="72" rx="18" fill={bg} />

      {/* Graduation cap (top) */}
      <Path
        d="M22 30 L36 23 L50 30 L36 37 Z"
        fill={fg}
      />

      {/* Bag body (bottom) */}
      <Path
        d="M25 36 C25 35 26 34 27 34 L45 34 C46 34 47 35 47 36 L49 52 C49 54 47 56 45 56 L27 56 C25 56 23 54 23 52 Z"
        fill={fg}
      />

      {/* Tassel string */}
      <Line
        x1="50"
        y1="30"
        x2="50"
        y2="40"
        stroke={fg}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Tassel ball */}
      <Path
        d="M50 40 C49 41 49 42 50 43 C51 42 51 41 50 40 Z"
        fill={fg}
      />
    </Svg>
  );
}