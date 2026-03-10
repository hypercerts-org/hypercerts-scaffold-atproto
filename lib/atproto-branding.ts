/**
 * ATProto OAuth branding utilities
 *
 * Generates custom CSS for PDS OAuth pages to inject app-specific branding
 * (logo, colors, text) when users authenticate via this app.
 */

/**
 * Sanitizes a URL for safe use in CSS url() values
 *
 * Validates the URL structure and protocol, then escapes characters that could
 * break out of CSS url('...') context or enable injection attacks.
 *
 * @param url - The URL to sanitize
 * @returns The sanitized URL href string
 * @throws Error if URL is invalid or uses non-http/https protocol
 */
function sanitizeUrlForCss(url: string): string {
  // Validate URL structure
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL provided for logo: ${url}`);
  }

  // Only allow http and https protocols
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Invalid URL protocol. Only http/https allowed: ${url}`);
  }

  // Get the href and escape characters that could break out of CSS url('...')
  // Dangerous characters: ', ", ), \, newlines
  const sanitized = parsed.href
    .replace(/\\/g, "\\\\") // Escape backslashes first
    .replace(/'/g, "\\'") // Escape single quotes
    .replace(/"/g, '\\"') // Escape double quotes
    .replace(/\)/g, "\\)") // Escape closing parentheses
    .replace(/\n/g, "") // Remove newlines
    .replace(/\r/g, ""); // Remove carriage returns

  return sanitized;
}

/**
 * Generates custom CSS for PDS OAuth pages
 *
 * This CSS is injected into the PDS OAuth flow via the client metadata
 * branding.css field. It customizes the appearance of sign-in pages to
 * match the app's branding (logo, colors, text).
 *
 * @param baseUrl - The app base URL (e.g. https://hypercerts-scaffold.vercel.app)
 * @returns CSS string to inject into PDS OAuth pages
 */
export function generateBrandingCss(baseUrl: string): string {
  // Construct logo URL from base URL
  const logoUrl = `${baseUrl}/certified-logo.svg`;

  // Sanitize the logo URL to prevent CSS injection
  const sanitizedLogoUrl = sanitizeUrlForCss(logoUrl);

  // Construct horizontal logo URL (full wordmark, 1929x340px, ~5.67:1 aspect ratio)
  const horizontalLogoUrl = `${baseUrl}/hypercerts_logo_horizontal.svg`;
  const sanitizedHorizontalLogoUrl = sanitizeUrlForCss(horizontalLogoUrl);

  // Construct signin SVG URL from base URL (dark variant: white text, for dark backgrounds)
  const signinUrl = `${baseUrl}/certified-signin.svg`;
  const sanitizedSigninUrl = sanitizeUrlForCss(signinUrl);

  // Construct signin light SVG URL (light variant: dark navy text, for light backgrounds)
  const signinLightUrl = `${baseUrl}/certified-signin-light.svg`;
  const sanitizedSigninLightUrl = sanitizeUrlForCss(signinLightUrl);

  return `/* Certified Custom Branding for PDS OAuth Pages */

/* ===== BRANDING CSS VARIABLES ===== */
:root {
  --branding-color-primary: 15 37 68;
  --branding-color-primary-contrast: 255 255 255;
  --branding-color-primary-hue: 216;
}

/* ===== LOGO REPLACEMENT ===== */
/* Replace default PDS logo with Hypercerts horizontal wordmark - Desktop: left aligned */
img[alt="Hypercerts Logo"] {
  width: 200px !important;
  height: 40px !important;
  object-fit: contain !important;
  object-position: -9999px -9999px !important;
  background-image: url('${sanitizedHorizontalLogoUrl}') !important;
  background-size: contain !important;
  background-repeat: no-repeat !important;
  background-position: left center !important;
}

/* Mobile: left aligned with better spacing */
@media (max-width: 767px) {
  img[alt="Hypercerts Logo"] {
    width: 150px !important;
    height: 30px !important;
    margin-top: 8px !important;
    margin-bottom: 8px !important;
  }
}

/* ===== H1 TEXT REPLACEMENT ===== */
/* Replace "Sign in with Hypercerts" heading with Certified sign-in SVG image - only on sign-in page */
/* The sign-in H1 is in a grid layout, error page H1 is in a flex main */
.grid h1.text-primary {
  font-size: 0 !important;
  line-height: 0 !important;
  color: transparent !important;
  margin-top: 12px !important;
}

/* Light mode: use dark-text variant of certified-signin SVG */
.grid h1.text-primary::after {
  content: "" !important;
  display: block !important;
  width: 280px !important;
  height: 98px !important;
  max-width: 100% !important;
  background-image: url('${sanitizedSigninLightUrl}') !important;
  background-size: contain !important;
  background-repeat: no-repeat !important;
  background-position: left center !important;
  margin-top: 8px !important;
}

/* Desktop: larger H1 image */
@media (min-width: 768px) {
  .grid h1.text-primary::after {
    width: 334px !important;
    height: 117px !important;
  }
}

/* ===== AUTHENTICATE PAGE (New Session Landing) ===== */
/* This page has H1 "Authenticate" with buttons below, no logo element */

/* Add Hypercerts wordmark above the Authenticate H1 using ::before */
/* Exclude error pages (which also use main.flex.flex-col.items-center) */
main.flex.flex-col.items-center:not(:has([role="alert"])) > h1.text-primary::before {
  content: "" !important;
  display: block !important;
  width: 200px !important;
  height: 40px !important;
  margin: 0 auto 24px auto !important;
  background-image: url('${sanitizedHorizontalLogoUrl}') !important;
  background-size: contain !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
}

/* Mobile: smaller logo */
@media (max-width: 767px) {
  main.flex.flex-col.items-center:not(:has([role="alert"])) > h1.text-primary::before {
    width: 150px !important;
    height: 30px !important;
    margin-bottom: 16px !important;
  }
}

/* ===== BUTTON TEXT/ICON REPLACEMENT ===== */
/* Button text/icon replacement — both sign-in page submit and Authenticate page button */
button[type="submit"].bg-primary,
main.flex.flex-col.items-center > button:nth-of-type(2) {
  font-size: 0 !important;
  line-height: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
}

button[type="submit"].bg-primary::before,
main.flex.flex-col.items-center > button:nth-of-type(2)::before {
  content: "" !important;
  display: inline-block !important;
  width: 20px !important;
  height: 22px !important;
  background-image: url('${sanitizedLogoUrl}') !important;
  background-size: contain !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
  flex-shrink: 0 !important;
}

button[type="submit"].bg-primary::after,
main.flex.flex-col.items-center > button:nth-of-type(2)::after {
  content: "Sign in with Certified" !important;
  font-size: 1rem !important;
  line-height: 1.5rem !important;
}

/* ===== DESKTOP ALIGNMENT ===== */
@media (min-width: 768px) {
  /* Left align content in left panel on desktop */
  .grid.grow.content-center {
    justify-items: start !important;
  }

  /* Left align text */
  .md\\:text-right {
    text-align: left !important;
  }
}

/* Left-alignment consistency on all viewports */
.grid.grow.content-center {
  justify-items: start !important;
}

/* ===== DARK MODE ===== */
@media (prefers-color-scheme: dark) {
  /* Logo: invert to white so it's visible on dark panel */
  img[alt="Hypercerts Logo"] {
    filter: invert(1) !important;
  }

  /* Authenticate page logo */
  main.flex.flex-col.items-center:not(:has([role="alert"])) > h1.text-primary::before {
    filter: invert(1) !important;
  }

  /* Sign-in H1: use white-text variant of certified-signin SVG */
  .grid h1.text-primary::after {
    background-image: url('${sanitizedSigninUrl}') !important;
  }

  /* Authenticate H1: white text */
  main.flex.flex-col.items-center > h1.text-primary {
    color: #ffffff !important;
  }

  /* Left panel: dark navy background */
  /* In light mode, the PDS native slate-100 (#f1f5f9) takes over */
  .md\\:bg-slate-100,
  .md\\:dark\\:bg-slate-800 {
    background-color: #0F2544 !important;
  }

  /* Light text for dark left panel */
  .md\\:bg-slate-100 .text-primary,
  .md\\:bg-slate-100 h1.text-primary {
    color: #ffffff !important;
  }

  /* Subtitle text in dark left panel (e.g. 'Enter your password') */
  .md\\:bg-slate-100 .text-slate-600,
  .md\\:bg-slate-100 .text-slate-700,
  .md\\:bg-slate-100 .text-slate-400,
  .md\\:bg-slate-100 p {
    color: rgba(255, 255, 255, 0.7) !important;
  }

  /* Button visibility: bg-primary (#0F2544) blends into dark panel — use bright blue instead */
  button[type="submit"].bg-primary,
  button.bg-primary,
  [role="button"].bg-primary {
    background-color: #3B82F6 !important;
  }
  button[type="submit"].bg-primary:hover,
  button.bg-primary:hover,
  [role="button"].bg-primary:hover {
    background-color: #2563EB !important;
  }
}`;
}

export { sanitizeUrlForCss };
