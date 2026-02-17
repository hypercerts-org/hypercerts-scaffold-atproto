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

  // Construct signin SVG URL from base URL
  const signinUrl = `${baseUrl}/certified-signin.svg`;
  const sanitizedSigninUrl = sanitizeUrlForCss(signinUrl);

  return `/* Hypercerts Scaffold Custom Branding - Light Theme */

/* ===== FORCE LIGHT COLOR SCHEME ===== */
:root {
  color-scheme: light only !important;
  --branding-color-primary: 43 45 49;
  --branding-color-primary-contrast: 248 248 250;
  --branding-color-primary-hue: 220;
  --branding-color-error: 229 72 77;
  --branding-color-error-contrast: 255 255 255;
  --branding-color-error-hue: 358;
  --branding-color-warning: 245 159 0;
  --branding-color-warning-contrast: 43 45 49;
  --branding-color-warning-hue: 38;
  --branding-color-success: 43 138 62;
  --branding-color-success-contrast: 255 255 255;
  --branding-color-success-hue: 134;
}

/* ===== LOGO REPLACEMENT ===== */
/* Replace Hypercerts logo with Scaffold logo - Desktop: right aligned */
img[alt="Hypercerts Logo"],
img[alt*="Logo"] {
  width: 54px !important;
  height: 54px !important;
  object-fit: contain !important;
  object-position: -9999px -9999px !important;
  background-image: url('${sanitizedLogoUrl}') !important;
  background-size: contain !important;
  background-repeat: no-repeat !important;
  background-position: right center !important;
}

/* Mobile: left aligned with better spacing */
@media (max-width: 767px) {
  img[alt="Hypercerts Logo"],
  img[alt*="Logo"] {
    width: 40px !important;
    height: 40px !important;
    background-position: left center !important;
    margin-top: 8px !important;
    margin-bottom: 8px !important;
  }
}

/* ===== AUTHORIZE PAGE SMALL LOGO ===== */
/* The small logo on the Authorize page has alt="Ma Earth" and is in a constrained container */
img[alt="Ma Earth"] {
  width: 32px !important;
  height: 32px !important;
  object-fit: contain !important;
  object-position: left center !important;
}

/* Widen the logo container on Authorize page */
.flex.items-center.justify-start.gap-2 > div.w-8:has(img[alt="Ma Earth"]),
div.w-8:has(img[alt="Ma Earth"]) {
  width: 32px !important;
  flex-shrink: 0 !important;
}

/* ===== H1 TEXT REPLACEMENT ===== */
/* Replace "Sign in with Hypercerts" with certified-signin.svg image - only on sign-in page */
/* The sign-in H1 is in a grid layout, error page H1 is in a flex main */
.grid h1.text-primary {
  font-size: 0 !important;
  line-height: 0 !important;
  color: transparent !important;
  margin-top: 12px !important;
}

.grid h1.text-primary::after {
  content: "" !important;
  display: block !important;
  width: 280px !important;
  height: 98px !important;
  max-width: 100% !important;
  background-image: url('${sanitizedSigninUrl}') !important;
  background-size: contain !important;
  background-repeat: no-repeat !important;
  background-position: right center !important;
  margin-top: 8px !important;
  color: #ffffff !important;
}

/* Mobile: add spacing below header */
@media (max-width: 767px) {
  .grid h1.text-primary {
    margin-top: 24px !important;
    padding-top: 16px !important;
  }
}

/* Desktop: larger H1 with spacing */
@media (min-width: 768px) {
  .grid h1.text-primary {
    margin-top: 16px !important;
  }

  .grid h1.text-primary::after {
    width: 334px !important;
    height: 117px !important;
    margin-top: 16px !important;
  }
}

@media (min-width: 1024px) {
  .grid h1.text-primary::after {
    width: 400px !important;
    height: 140px !important;
  }
}

/* ===== AUTHENTICATE PAGE (New Session Landing) ===== */
/* This page has H1 "Authenticate" with buttons below, no logo element */

/* Add Scaffold logo above the H1 using ::before */
main.flex.flex-col.items-center > h1.text-primary {
  position: relative !important;
}

main.flex.flex-col.items-center > h1.text-primary::before {
  content: "" !important;
  display: block !important;
  width: 180px !important;
  height: 54px !important;
  margin: 0 auto 24px auto !important;
  background-image: url('${sanitizedLogoUrl}') !important;
  background-size: contain !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
}

/* Mobile: smaller logo */
@media (max-width: 767px) {
  main.flex.flex-col.items-center > h1.text-primary::before {
    width: 140px !important;
    height: 42px !important;
    margin-bottom: 16px !important;
  }
}

/* Style the "Authenticate" H1 text */
main.flex.flex-col.items-center > h1.text-primary {
  color: #ffffff !important;
  font-size: 1.5rem !important;
  line-height: 2rem !important;
}

@media (min-width: 768px) {
  main.flex.flex-col.items-center > h1.text-primary {
    font-size: 2.25rem !important;
    line-height: 2.5rem !important;
  }
}

/* Replace "Sign in with Hypercerts" button text on Authenticate page */
/* This is the second button (the bg-gray-100 button after the primary button) */
main.flex.flex-col.items-center > button:nth-of-type(2) {
  font-size: 0 !important;
  line-height: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
}

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

main.flex.flex-col.items-center > button:nth-of-type(2)::after {
  content: "Sign in with Certified" !important;
  font-size: 1rem !important;
  line-height: 1.5rem !important;
}

/* ===== ERROR/SESSION EXPIRY PAGE ===== */
/* Style the H1 "Error" on error pages - identified by having [role="alert"] */
main:has([role="alert"]) > h1.text-primary {
  font-size: 1.5rem !important;
  line-height: 2rem !important;
  color: #e5484d !important;
  font-weight: 700 !important;
}

/* Error page should NOT show logo */
main:has([role="alert"]) > h1.text-primary::before {
  display: none !important;
}

@media (min-width: 768px) {
  main:has([role="alert"]) > h1.text-primary {
    font-size: 2.25rem !important;
    line-height: 2.5rem !important;
  }
}

/* ===== MAIN BACKGROUNDS - LIGHT THEME ===== */
body {
  background-color: #fafafa !important;
  color-scheme: light !important;
}

/* Override dark mode - force light */
body,
.dark body,
body.dark {
  background-color: #fafafa !important;
}

/* Main content area */
.bg-white,
.dark .bg-white,
.dark\\:bg-slate-900 {
  background-color: #fafafa !important;
}

/* Left panel styling - dark navy background */
.md\\:bg-slate-100,
.dark .md\\:bg-slate-100,
.md\\:dark\\:bg-slate-800 {
  background-color: #0F2544 !important;
}

/* Light text for dark left panel */
.md\\:bg-slate-100 .text-primary,
.md\\:bg-slate-100 h1.text-primary {
  color: #ffffff !important;
}

/* ===== ACCOUNT SELECTION & FORM ITEMS ===== */
.bg-gray-100,
.dark\\:bg-gray-800,
.dark .dark\\:bg-gray-800 {
  background-color: #f8f8fa !important;
}

/* Hover states */
.hover\\:bg-gray-200:hover,
.dark\\:hover\\:bg-gray-700:hover,
.dark .dark\\:hover\\:bg-gray-700:hover {
  background-color: #f0f0f3 !important;
}

/* ===== TEXT COLORS - LIGHT THEME ===== */
.text-slate-900,
.dark\\:text-slate-100,
.dark .dark\\:text-slate-100 {
  color: #1a1b1e !important;
}

/* Secondary/muted text */
.text-slate-600,
.text-slate-700,
.text-slate-400,
.dark\\:text-slate-400,
.dark\\:text-slate-300,
.dark .dark\\:text-slate-400,
.dark .dark\\:text-slate-300 {
  color: #4a4b53 !important;
}

/* Neutral text colors */
.text-neutral-500,
.text-neutral-400,
.dark\\:text-neutral-400,
.dark .dark\\:text-neutral-400 {
  color: #5c5d66 !important;
}

/* ===== ACCENT/PRIMARY COLORS ===== */
.text-primary {
  color: #757780 !important;
}

/* Primary background (buttons) */
.bg-primary {
  background-color: #2b2d31 !important;
}

/* Primary border */
.border-primary {
  border-color: #2b2d31 !important;
}

/* Focus ring */
.focus\\:ring-primary:focus,
.has-focus\\:ring-primary:has(:focus) {
  --tw-ring-color: #4e5058 !important;
}

/* ===== FORM INPUTS ===== */
input,
textarea,
select {
  background-color: #f8f8fa !important;
  border: 1px solid #e4e4e8 !important;
  border-width: 1px !important;
  border-style: solid !important;
  color: #1a1b1e !important;
}

input::placeholder,
textarea::placeholder {
  color: #9a9ba3 !important;
}

input:focus,
textarea:focus,
select:focus {
  border-color: #757780 !important;
  outline: 2px solid #4e5058 !important;
  outline-offset: 2px !important;
}

/* ===== USERNAME PREVIEW & PASSWORD STRENGTH BOXES ===== */
/* These use bg-gray-200/bg-gray-300 in light mode, dark:bg-slate-* in dark mode */

/* Container backgrounds - the row below inputs (username preview, password strength) */
/* Using a slightly more saturated neutral to distinguish from input background */
.bg-gray-200,
.bg-slate-700,
.dark\\:bg-slate-700 {
  background-color: #eaeaed !important;
}

/* Inner elements - placeholder spans, meter bars */
.bg-gray-300,
.bg-slate-600,
.bg-slate-500,
.dark\\:bg-slate-600,
.dark\\:bg-slate-500 {
  background-color: #e4e4e8 !important;
}

/* Text in these areas - muted */
.text-gray-700,
.text-gray-500,
.text-gray-400,
.text-gray-300,
.dark\\:text-gray-300,
.dark\\:text-gray-400,
.dark\\:text-gray-500 {
  color: #4a4b53 !important;
}

/* Strong/bold username text - should be black */
.text-gray-800,
.text-gray-900,
.dark\\:text-gray-200,
.dark\\:text-gray-100,
strong.text-gray-800,
strong.dark\\:text-gray-200 {
  color: #1a1b1e !important;
}

/* Also override any remaining slate backgrounds */
.bg-slate-800,
.dark\\:bg-slate-800 {
  background-color: #f0f0f3 !important;
}

/* Text that should be dark on light backgrounds */
.text-slate-200,
.text-slate-300,
.text-slate-100,
.dark\\:text-slate-200,
.dark\\:text-slate-300,
.dark\\:text-slate-100,
.text-white {
  color: #4a4b53 !important;
}

/* Input container with rounded corners */
.rounded-br-none,
.rounded-bl-none,
.rounded-br-2,
.rounded-bl-2 {
  background-color: #f0f0f3 !important;
}

/* The container around inputs (identifier, password fields) */
/* These containers have focus:ring-primary or has-focus:ring-primary classes */
.rounded-lg.has-focus\\:ring-primary,
.rounded-lg.focus\\:ring-primary,
.rounded-lg[class*="has-focus:ring"],
.rounded-lg[class*="focus:ring"] {
  background-color: #f8f8fa !important;
  border: 1px solid #e4e4e8 !important;
}

/* Focus state for input containers - accent border */
.rounded-lg.has-focus\\:ring-primary:has(:focus),
.rounded-lg.focus\\:ring-primary:focus-within,
.rounded-lg[class*="has-focus:ring"]:has(:focus),
.rounded-lg[class*="focus:ring"]:focus-within {
  border-color: #757780 !important;
}

/* Also target bg-gray-100 containers that wrap inputs */
.bg-gray-100.rounded-lg:has(input),
.dark\\:bg-gray-800.rounded-lg:has(input) {
  background-color: #f8f8fa !important;
  border: 1px solid #e4e4e8 !important;
}

.bg-gray-100.rounded-lg:has(input:focus),
.dark\\:bg-gray-800.rounded-lg:has(input:focus) {
  border-color: #757780 !important;
}

/* Input inside containers - keep transparent (container has the border) */
.rounded-br-none input,
.rounded-bl-none input,
.border-primary input,
input.bg-transparent,
.bg-gray-100.rounded-lg input,
.dark\\:bg-gray-800.rounded-lg input,
.rounded-lg.has-focus\\:ring-primary input,
.rounded-lg.focus\\:ring-primary input,
.rounded-lg[class*="has-focus:ring"] input,
.rounded-lg[class*="focus:ring"] input {
  border: none !important;
  background-color: transparent !important;
  outline: none !important;
}

/* Ensure focus state doesn't add outline to inner inputs */
.bg-gray-100.rounded-lg input:focus,
.dark\\:bg-gray-800.rounded-lg input:focus,
.rounded-lg.has-focus\\:ring-primary input:focus,
.rounded-lg.focus\\:ring-primary input:focus {
  border: none !important;
  outline: none !important;
}

/* ===== CHECKBOXES ===== */
input[type="checkbox"] {
  accent-color: #2b2d31 !important;
  border: 1px solid #e4e4e8 !important;
  background-color: #f8f8fa !important;
}

input[type="checkbox"]:checked {
  background-color: #2b2d31 !important;
}

/* ===== INFO/WARNING/ERROR BOXES ===== */
.bg-contrast-25,
.bg-contrast-50,
[class*="bg-contrast"],
.dark\\:bg-contrast-50,
.dark .dark\\:bg-contrast-50 {
  background-color: #f0f0f3 !important;
}

/* Footer styling */
footer.bg-contrast-25,
footer.bg-contrast-50,
footer[class*="bg-contrast"] {
  background-color: #f0f0f3 !important;
  border-top: 1px solid #e4e4e8 !important;
}

.text-contrast-500,
[class*="text-contrast"] {
  color: #4a4b53 !important;
}

/* Warning styling - warm amber */
.bg-warning {
  background-color: #f59f00 !important;
}

.text-warning {
  color: #c77700 !important;
}

/* Warning contrast text (for text on warning background) */
.text-warning-contrast {
  color: #7d4e00 !important;
}

/* Warning alert box - ensure good contrast and styling */
[role="alert"].bg-warning {
  background-color: #fff4e6 !important;
  border: 1px solid #f59f00 !important;
}

[role="alert"].bg-warning .text-inherit,
[role="alert"].bg-warning h3 {
  color: #7d4e00 !important;
}

[role="alert"].bg-warning svg {
  color: #c77700 !important;
}

/* Error styling - red (for password meter "weak") */
.bg-error {
  background-color: #f8a5a8 !important;
}

.text-error {
  color: #e5484d !important;
}

/* Success styling - green */
.bg-success {
  background-color: #8fd19e !important;
}

.text-success {
  color: #2b8a3e !important;
}

/* Password strength meter specific - ensure bars are visible */
[role="meter"] .bg-error {
  background-color: #f8a5a8 !important;
}

[role="meter"] .bg-warning {
  background-color: #f59f00 !important;
}

[role="meter"] .bg-success {
  background-color: #8fd19e !important;
}

/* Inactive meter bars */
[role="meter"] .bg-gray-300,
[role="meter"] .dark\\:bg-slate-500 {
  background-color: #d4d4d8 !important;
}

/* ===== BUTTONS ===== */
/* Primary buttons (dark) */
button.bg-primary,
[role="button"].bg-primary,
button[type="submit"] {
  background-color: #2b2d31 !important;
  color: #f8f8fa !important;
}

button.bg-primary:hover,
[role="button"].bg-primary:hover,
button[type="submit"]:hover {
  background-color: #3e4147 !important;
}

/* Replace "Sign in with Hypercerts" button text with C logo icon + "Sign in with Certified" */
button[type="submit"].bg-primary {
  font-size: 0 !important;
  line-height: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
}

button[type="submit"].bg-primary::before {
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

button[type="submit"].bg-primary::after {
  content: "Sign in with Certified" !important;
  font-size: 1rem !important;
  line-height: 1.5rem !important;
}

/* Secondary buttons (light neutral) */
button.bg-gray-100,
button.bg-gray-200,
[role="button"].bg-gray-100,
[role="button"].bg-gray-200,
button.bg-transparent,
[role="button"].bg-transparent,
.dark .dark\\:bg-gray-800 button,
.dark .dark\\:bg-gray-800 [role="button"] {
  background-color: #f0f0f3 !important;
  color: #4a4b53 !important;
  border: 1px solid #e4e4e8 !important;
}

button.bg-gray-100:hover,
button.bg-gray-200:hover,
[role="button"].bg-gray-100:hover,
[role="button"].bg-gray-200:hover,
button.bg-transparent:hover,
[role="button"].bg-transparent:hover {
  background-color: #eaeaed !important;
}

/* Text-only buttons (like "Sign up", "Forgot?") */
button.text-primary,
[role="button"].text-primary {
  color: #757780 !important;
  background-color: transparent !important;
  border: none !important;
}

button.text-primary:hover,
[role="button"].text-primary:hover {
  color: #5c5d66 !important;
  text-decoration: underline !important;
}

/* ===== LINKS ===== */
a {
  color: #757780 !important;
}

a:hover {
  color: #5c5d66 !important;
}

/* ===== FORM TEXT ELEMENTS ===== */
ul li,
ol li,
p {
  color: #4a4b53 !important;
}

.text-sm.font-medium {
  color: #4a4b53 !important;
}

/* Username preview box */
.rounded-lg.border {
  background-color: #f8f8fa !important;
  border-color: #e4e4e8 !important;
}

/* Info icon boxes */
.rounded-lg.bg-contrast-25,
.rounded-lg[class*="bg-contrast"] {
  background-color: #f0f0f3 !important;
}

/* ===== DROPDOWN/SELECT STYLING ===== */
select {
  background-color: #f0f0f3 !important;
  color: #4a4b53 !important;
}

/* ===== ERROR PAGE ===== */
.text-4xl,
.text-5xl {
  color: #2b2d31 !important;
}

/* ===== MOBILE SPECIFIC FIXES ===== */
@media (max-width: 767px) {
  /* Mobile main content */
  main {
    background-color: #f8f8fa !important;
  }

  /* Grid content container - logo and title - dark navy background on mobile */
  .grid.grow.content-center {
    justify-items: start !important;
    gap: 8px !important;
    background-color: #0F2544 !important;
    padding: 24px !important;
    border-radius: 12px !important;
  }

  /* Space between logo and title on mobile */
  .grid.grow.content-center > img {
    margin-bottom: 8px !important;
  }

  /* H1 mobile spacing */
  .grid.grow.content-center > h1 {
    margin-top: 4px !important;
    margin-bottom: 15px !important;
  }

  /* Language selector - position top right on mobile */
  select[aria-label="Interface language selector"] {
    position: absolute !important;
    top: 16px !important;
    right: 16px !important;
    margin: 0 !important;
  }

  /* Make the header container relative for absolute positioning */
  .px-6.pt-4.w-full,
  .flex.flex-col.items-center > div:first-child,
  .w-full.flex.flex-row.items-center {
    position: relative !important;
  }
}

/* ===== DESKTOP ALIGNMENT ===== */
@media (min-width: 768px) {
  /* Right align content in left panel on desktop */
  .grid.grow.content-center {
    justify-items: end !important;
  }

  /* Right align text */
  .md\\:text-right {
    text-align: right !important;
  }
}`;
}

export { sanitizeUrlForCss };
