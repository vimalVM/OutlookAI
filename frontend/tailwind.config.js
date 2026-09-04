/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      "colors": {
        "surface": "#121318",
        "surface-dim": "#121318",
        "surface-bright": "#38393e",
        "surface-container-lowest": "#0d0e13",
        "surface-container-low": "#1a1b20",
        "surface-container": "#1e1f25",
        "surface-container-high": "#292a2f",
        "surface-container-highest": "#34343a",
        "on-surface": "#e3e1e9",
        "on-surface-variant": "#d6c4b0",
        "inverse-surface": "#e3e1e9",
        "inverse-on-surface": "#2f3036",
        "outline": "#9e8e7c",
        "outline-variant": "#514536",
        "surface-tint": "#ffb956",
        "primary": "#ffc16c",
        "on-primary": "#462b00",
        "primary-container": "#e8a33d",
        "on-primary-container": "#5f3c00",
        "inverse-primary": "#835400",
        "secondary": "#86d7ad",
        "on-secondary": "#003824",
        "secondary-container": "#026443",
        "on-secondary-container": "#8ddeb4",
        "tertiary": "#cfcbc5",
        "on-tertiary": "#31302c",
        "tertiary-container": "#b3b0aa",
        "on-tertiary-container": "#44433e",
        "error": "#ffb4ab",
        "on-error": "#690005",
        "error-container": "#93000a",
        "on-error-container": "#ffdad6",
        "background": "#121318",
        "on-background": "#e3e1e9",
        "surface-variant": "#34343a"
      },
      "borderRadius": {
        "DEFAULT": "0.5rem",
        "sm": "0.25rem",
        "md": "0.75rem",
        "lg": "1rem",
        "xl": "1.5rem",
        "full": "9999px"
      },
      "spacing": {
        "margin-page": "48px",
        "margin-mobile": "20px",
        "gutter": "24px",
        "stack-sm": "8px",
        "stack-md": "16px",
        "stack-lg": "32px",
        "section-gap": "80px"
      },
      "fontFamily": {
        "headline-xl": ["EB Garamond", "serif"],
        "headline-lg": ["EB Garamond", "serif"],
        "headline-md": ["EB Garamond", "serif"],
        "body-lg": ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "label-md": ["Inter", "sans-serif"],
        "label-sm": ["Inter", "sans-serif"],
        "label-caps": ["Inter", "sans-serif"],
        "code-block": ["Inter", "sans-serif"]
      },
      "fontSize": {
        "headline-xl": ["64px", {"lineHeight": "72px", "letterSpacing": "-0.02em", "fontWeight": "500"}],
        "headline-lg": ["40px", {"lineHeight": "48px", "letterSpacing": "-0.01em", "fontWeight": "500"}],
        "headline-md": ["28px", {"lineHeight": "36px", "fontWeight": "500"}],
        "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
        "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
        "label-md": ["14px", {"lineHeight": "20px", "letterSpacing": "0.02em", "fontWeight": "500"}],
        "label-sm": ["12px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600"}],
        "label-caps": ["12px", {"lineHeight": "16px", "letterSpacing": "0.1em", "fontWeight": "600"}],
        "code-block": ["14px", {"lineHeight": "22px", "fontWeight": "400"}]
      }
    },
  },
  plugins: [],
}
