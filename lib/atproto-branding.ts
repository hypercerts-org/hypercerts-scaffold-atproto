/**
 * ATProto OAuth branding utilities
 *
 * Generates custom CSS for PDS OAuth pages to inject app-specific branding
 * (logo, colors, text) when users authenticate via this app.
 */

/**
 * Sanitizes a URL for safe use in CSS url() values
 */
function sanitizeUrlForCss(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL provided for logo: ${url}`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Invalid URL protocol. Only http/https allowed: ${url}`);
  }

  const sanitized = parsed.href
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\)/g, "\\)")
    .replace(/\n/g, "")
    .replace(/\r/g, "");

  return sanitized;
}

/**
 * Generates custom CSS for PDS OAuth pages
 *
 * @param baseUrl - The app base URL (e.g. https://hypercerts-scaffold.vercel.app)
 * @returns CSS string to inject into PDS OAuth pages
 */
export function generateBrandingCss(): string {
  return `
/* ===== FONTS ===== */
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

/* ===== DESIGN TOKENS ===== */
:root {
  /* Earthy luxury palette */
  --color-bg:            #F4EFE6;
  --color-surface:       rgba(255, 252, 247, 0.72);
  --color-surface-solid: #FFFCF7;
  --color-primary:       #1F3322;
  --color-primary-hover: #162618;
  --color-accent:        #B07D3A;
  --color-accent-soft:   rgba(176, 125, 58, 0.12);

  --color-text-heading:  #1A1208;
  --color-text-body:     #4A3F32;
  --color-text-muted:    #9C8E7E;
  --color-text-label:    #3A3028;
  --color-text-inverse:  #F9F5EF;

  --color-border:        rgba(176, 125, 58, 0.22);
  --color-border-focus:  #B07D3A;
  --color-input-bg:      rgba(255, 252, 247, 0.9);

  --color-error-text:    #8B3A2A;
  --color-error-bg:      rgba(139, 58, 42, 0.08);
  --color-divider:       rgba(176, 125, 58, 0.18);

  /* Typography */
  --font-display: 'Cormorant Garamond', Georgia, serif;
  --font-sans:    'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono:    'SF Mono', Menlo, Consolas, monospace;

  --font-size-xs:   12px;
  --font-size-sm:   13.5px;
  --font-size-base: 15px;
  --font-size-md:   15.5px;
  --font-size-lg:   32px;
  --font-size-otp:  30px;

  /* Spacing */
  --space-1: 6px;
  --space-2: 10px;
  --space-3: 14px;
  --space-4: 20px;
  --space-5: 28px;
  --space-6: 48px;

  /* Shape */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-pill: 100px;

  /* Sizes */
  --container-max: 440px;
  --logo-height:   72px;
  --input-padding: 11px 14px;
  --btn-padding:   13px 20px;
  --otp-padding:   16px;
  --otp-letter-spacing: 10px;

  /* Elevation */
  --shadow-card:  0 2px 24px rgba(30, 20, 10, 0.09), 0 1px 4px rgba(30, 20, 10, 0.06);
  --shadow-focus: 0 0 0 3px rgba(176, 125, 58, 0.22);
  --shadow-btn:   0 2px 12px rgba(31, 51, 34, 0.28);
}

/* ===== RESET ===== */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* ===== GRAIN TEXTURE OVERLAY ===== */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.045'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
  opacity: 0.6;
}

/* ===== BACKGROUND GRADIENT BLOBS ===== */
body::after {
  content: '';
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 50% at 15% 20%, rgba(176, 125, 58, 0.10) 0%, transparent 70%),
    radial-gradient(ellipse 50% 60% at 85% 75%, rgba(31, 51, 34, 0.08) 0%, transparent 65%),
    radial-gradient(ellipse 40% 40% at 50% 50%, rgba(244, 239, 230, 0.4) 0%, transparent 100%);
  pointer-events: none;
  z-index: 0;
}

/* ===== LAYOUT ===== */
body {
  font-family: var(--font-sans);
  background-color: var(--color-bg);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow-x: hidden;
}

.container {
  position: relative;
  z-index: 1;
  background: var(--color-surface);
  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
  border: 1px solid rgba(176, 125, 58, 0.16);
  border-radius: 18px;
  padding: var(--space-6);
  max-width: var(--container-max);
  width: 100%;
  text-align: center;
  box-shadow: var(--shadow-card);

  /* Subtle top shimmer line */
  background-image: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.55) 0px,
    rgba(255, 255, 255, 0) 60px
  );

  animation: fadeSlideUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ===== LOGO ===== */
.client-logo {
  height: var(--logo-height);
  margin-bottom: var(--space-5);
  display: block;
  margin-left: auto;
  margin-right: auto;
  animation: fadeSlideUp 0.55s 0.08s cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* ===== DECORATIVE RULE UNDER LOGO ===== */
.client-logo + * {
  position: relative;
}

/* ===== TYPOGRAPHY ===== */
h1 {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: var(--font-size-lg);
  letter-spacing: -0.01em;
  line-height: 1.15;
  margin-bottom: var(--space-2);
  color: var(--color-text-heading);
  animation: fadeSlideUp 0.55s 0.12s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.subtitle {
  font-family: var(--font-sans);
  font-weight: 300;
  color: var(--color-text-body);
  margin-bottom: var(--space-5);
  font-size: var(--font-size-base);
  line-height: 1.6;
  letter-spacing: 0.01em;
  animation: fadeSlideUp 0.55s 0.16s cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* Thin accent line between logo area and form */
.container > *:nth-child(3) {
  animation: fadeSlideUp 0.55s 0.2s cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* ===== FORM FIELDS ===== */
.field {
  margin-bottom: var(--space-4);
  text-align: left;
  animation: fadeSlideUp 0.55s 0.22s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.field label {
  display: block;
  font-family: var(--font-sans);
  font-size: var(--font-size-xs);
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: var(--space-1);
  transition: color 0.2s ease;
}

.field:focus-within label {
  color: var(--color-accent);
}

.field input {
  width: 100%;
  padding: var(--input-padding);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--font-size-md);
  font-weight: 300;
  letter-spacing: 0.02em;
  outline: none;
  background: var(--color-input-bg);
  color: var(--color-text-heading);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  -webkit-appearance: none;
}

.field input::placeholder {
  color: var(--color-text-muted);
  font-weight: 300;
}

.field input:focus {
  border-color: var(--color-border-focus);
  box-shadow: var(--shadow-focus);
  background: var(--color-surface-solid);
}

/* OTP input */
.otp-input {
  font-size: var(--font-size-otp) !important;
  font-family: var(--font-mono) !important;
  text-align: center !important;
  letter-spacing: var(--otp-letter-spacing) !important;
  padding: var(--otp-padding) !important;
  background: var(--color-surface-solid) !important;
}

.otp-input:focus {
  border-color: var(--color-border-focus) !important;
  box-shadow: var(--shadow-focus) !important;
}

/* ===== BUTTONS ===== */
.btn-primary {
  position: relative;
  width: 100%;
  padding: var(--btn-padding);
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--radius-pill);
  font-family: var(--font-sans);
  font-size: var(--font-size-sm);
  font-weight: 500;
  letter-spacing: 0.055em;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: var(--shadow-btn);
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.18s ease,
              background 0.18s ease;
  overflow: hidden;
}

/* Shimmer sweep on hover */
.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.12) 50%,
    transparent 100%
  );
  transition: left 0.5s ease;
}

.btn-primary:hover::before {
  left: 160%;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(31, 51, 34, 0.38);
}

.btn-primary:active {
  transform: translateY(0px);
  box-shadow: var(--shadow-btn);
  transition-duration: 0.08s;
}

.btn-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  display: inline-block;
  margin-top: var(--space-3);
  color: var(--color-text-muted);
  background: none;
  border: none;
  font-family: var(--font-sans);
  font-size: var(--font-size-xs);
  font-weight: 400;
  letter-spacing: 0.03em;
  cursor: pointer;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: color 0.18s ease, border-color 0.18s ease;
  padding-bottom: 1px;
}

.btn-secondary:hover {
  color: var(--color-text-body);
  border-bottom-color: var(--color-text-body);
}

.btn-social {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  padding: 10px var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  font-family: var(--font-sans);
  font-size: var(--font-size-sm);
  font-weight: 400;
  letter-spacing: 0.03em;
  cursor: pointer;
  text-decoration: none;
  background: var(--color-input-bg);
  color: var(--color-text-label);
  margin-bottom: var(--space-2);
  transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
}

.btn-social:hover {
  background: var(--color-surface-solid);
  border-color: rgba(176, 125, 58, 0.35);
  transform: translateY(-1px);
}

/* ===== DIVIDER ===== */
.divider {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: var(--space-4) 0;
  color: var(--color-text-muted);
  font-family: var(--font-sans);
  font-size: var(--font-size-xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-divider), transparent);
}

/* ===== FEEDBACK ===== */
#error-msg,
.error {
  color: var(--color-error-text);
  background: var(--color-error-bg);
  border: 1px solid rgba(139, 58, 42, 0.18);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  margin: var(--space-3) 0;
  font-family: var(--font-sans);
  font-size: var(--font-size-sm);
  font-weight: 400;
  line-height: 1.5;
  animation: shake 0.35s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes shake {
  10%, 90%  { transform: translateX(-2px); }
  20%, 80%  { transform: translateX(3px);  }
  30%, 50%, 70% { transform: translateX(-3px); }
  40%, 60%  { transform: translateX(3px);  }
}

/* ===== STEP VISIBILITY ===== */
.step-otp {
  display: none;
}

.step-otp.active {
  display: block;
  animation: fadeSlideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.step-email.hidden {
  display: none;
}

/* ===== RECOVERY LINK ===== */
#recovery-link,
.recovery-link {
  display: block;
  margin-top: var(--space-4);
  color: var(--color-text-muted);
  font-family: var(--font-sans);
  font-size: var(--font-size-xs);
  letter-spacing: 0.03em;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  display: inline-block;
  transition: color 0.18s ease, border-color 0.18s ease;
  padding-bottom: 1px;
}

#recovery-link:hover,
.recovery-link:hover {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}

/* ===== FOOTER WORDMARK ===== */
.container::after {
  content: '';
  display: block;
  margin-top: var(--space-5);
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-divider), transparent);
  opacity: 0.7;
}`;
}

export { sanitizeUrlForCss };
