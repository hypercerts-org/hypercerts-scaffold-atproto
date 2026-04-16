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

/* ===== AUTH SERVICE POLISH ===== */
body {
  background:
    radial-gradient(circle at top left, rgba(59,130,246,0.12), transparent 32%),
    radial-gradient(circle at bottom right, rgba(15,37,68,0.18), transparent 36%),
    linear-gradient(180deg, #f5f8fc 0%, #eef3f9 100%) !important;
}
.container {
  position: relative;
  background: rgba(255,255,255,0.92) !important;
  border: 1px solid rgba(15,37,68,0.08) !important;
  border-radius: 24px !important;
  padding: 40px 32px !important;
  box-shadow: 0 20px 50px rgba(15,37,68,0.12), 0 6px 18px rgba(15,37,68,0.06) !important;
  backdrop-filter: blur(10px);
}
.container::before {
  content: "" !important;
  position: absolute !important;
  inset: 0 0 auto 0 !important;
  height: 4px !important;
  border-radius: 24px 24px 0 0 !important;
  background: linear-gradient(90deg, #0F2544 0%, #3B82F6 100%) !important;
}
.client-logo {
  height: 72px !important;
  width: auto !important;
  margin-bottom: 20px !important;
  filter: drop-shadow(0 8px 20px rgba(15,37,68,0.12));
}
h1 {
  font-size: 2rem !important;
  line-height: 1.1 !important;
  letter-spacing: -0.03em !important;
  margin-bottom: 10px !important;
  color: #0F2544 !important;
}
.subtitle {
  color: #5b6b80 !important;
  font-size: 0.98rem !important;
  line-height: 1.6 !important;
  margin-bottom: 24px !important;
}
.subtitle strong {
  color: #0F2544 !important;
  font-weight: 700 !important;
}
.field {
  margin-bottom: 18px !important;
}
.field label {
  font-size: 0.92rem !important;
  font-weight: 600 !important;
  color: #24364d !important;
  margin-bottom: 8px !important;
}
.field input {
  height: 52px !important;
  border-radius: 14px !important;
  border: 1px solid rgba(15,37,68,0.14) !important;
  background: rgba(248,250,252,0.95) !important;
  color: #0F2544 !important;
  transition: border-color 140ms ease, box-shadow 140ms ease, background 140ms ease, transform 140ms ease !important;
}
.field input:hover {
  border-color: rgba(15,37,68,0.22) !important;
  background: #ffffff !important;
}
.field input:focus {
  border-color: #3B82F6 !important;
  box-shadow: 0 0 0 4px rgba(59,130,246,0.14) !important;
  background: #ffffff !important;
}
.otp-input {
  height: 60px !important;
  border-radius: 16px !important;
  font-size: 2rem !important;
  letter-spacing: 0.35em !important;
  font-weight: 700 !important;
  background: linear-gradient(180deg, #f8fbff 0%, #f1f6fc 100%) !important;
}
.btn-primary {
  height: 52px !important;
  border-radius: 14px !important;
  border: 0 !important;
  background: linear-gradient(135deg, #0F2544 0%, #1d4f91 45%, #3B82F6 100%) !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  letter-spacing: 0.01em !important;
  box-shadow: 0 12px 24px rgba(59,130,246,0.22) !important;
  transition: transform 140ms ease, box-shadow 140ms ease, filter 140ms ease !important;
}
.btn-primary:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 16px 28px rgba(59,130,246,0.28) !important;
  filter: saturate(1.04) !important;
}
.btn-primary:disabled {
  opacity: 0.7 !important;
  transform: none !important;
  box-shadow: none !important;
}
.btn-secondary {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  min-height: 40px !important;
  padding: 0 6px !important;
  margin-top: 14px !important;
  color: #4f6b94 !important;
  font-weight: 600 !important;
  text-decoration: none !important;
  border-radius: 10px !important;
}
.btn-secondary:hover {
  color: #0F2544 !important;
  background: rgba(15,37,68,0.05) !important;
}
.error {
  border: 1px solid rgba(220,38,38,0.14) !important;
  background: linear-gradient(180deg, #fff5f5 0%, #fef2f2 100%) !important;
  color: #b42318 !important;
  border-radius: 14px !important;
  padding: 14px 16px !important;
  margin: 0 0 18px 0 !important;
  font-weight: 500 !important;
}
.recovery-link {
  margin-top: 18px !important;
  color: #607089 !important;
  font-size: 0.92rem !important;
  text-decoration: none !important;
}
.recovery-link:hover {
  color: #0F2544 !important;
  text-decoration: underline !important;
}
#btn-resend,
#btn-back {
  margin-top: 10px !important;
}
@media (max-width: 640px) {
  .container {
    max-width: calc(100vw - 24px) !important;
    padding: 28px 20px !important;
    border-radius: 20px !important;
  }
  h1 {
    font-size: 1.75rem !important;
  }
  .otp-input {
    font-size: 1.7rem !important;
    letter-spacing: 0.25em !important;
  }
  .client-logo {
    height: 60px !important;
  }
}

/* ===== DARK MODE ===== */
@media (prefers-color-scheme: dark) {
  body {
    background:
      radial-gradient(circle at top left, rgba(59,130,246,0.12), transparent 30%),
      radial-gradient(circle at bottom right, rgba(15,37,68,0.24), transparent 35%),
      linear-gradient(180deg, #08111f 0%, #0b1728 100%) !important;
  }

  .container {
    background: rgba(10,18,31,0.88) !important;
    border-color: rgba(148,163,184,0.14) !important;
    box-shadow: 0 24px 60px rgba(0,0,0,0.42), 0 8px 24px rgba(0,0,0,0.24) !important;
  }

  h1,
  .subtitle strong,
  .field label {
    color: #e8eef7 !important;
  }

  .subtitle,
  .recovery-link,
  .btn-secondary {
    color: #9fb0c8 !important;
  }

  .field input {
    background: rgba(15,23,42,0.9) !important;
    border-color: rgba(148,163,184,0.16) !important;
    color: #f8fafc !important;
  }

  .field input:hover,
  .field input:focus {
    background: rgba(15,23,42,1) !important;
  }

  .otp-input {
    background: linear-gradient(180deg, #0f172a 0%, #111c31 100%) !important;
  }

  .btn-secondary:hover {
    background: rgba(255,255,255,0.05) !important;
    color: #ffffff !important;
  }

  .error {
    border-color: rgba(248,113,113,0.18) !important;
    background: rgba(69,10,10,0.65) !important;
    color: #fecaca !important;
  }

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
