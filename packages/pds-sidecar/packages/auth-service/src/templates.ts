export function renderEmailInputPage(opts: {
  csrfToken: string;
  error?: string;
}): string {
  const { csrfToken, error } = opts;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in</title>
  <style>
    body { font-family: sans-serif; max-width: 400px; margin: 80px auto; padding: 24px; color: #222; }
    h1 { font-size: 22px; margin-bottom: 24px; }
    label { display: block; margin-bottom: 6px; font-size: 14px; color: #555; }
    input[type="email"] { width: 100%; box-sizing: border-box; padding: 10px 12px; font-size: 16px; border: 1px solid #ccc; border-radius: 6px; margin-bottom: 16px; }
    button { width: 100%; padding: 12px; font-size: 16px; background: #0070f3; color: #fff; border: none; border-radius: 6px; cursor: pointer; }
    button:hover { background: #0060df; }
    .error { color: #c00; font-size: 14px; margin-bottom: 16px; }
  </style>
</head>
<body>
  <h1>Sign in</h1>
  ${error ? `<p class="error">${escapeHtml(error)}</p>` : ''}
  <form method="POST" action="/auth/send-code" id="send-code-form">
    <label for="email">Email address</label>
    <input type="email" id="email" name="email" placeholder="you@example.com" required autofocus>
    <button type="submit">Continue</button>
  </form>
  <script>
    // Set CSRF header on form submit via fetch
    document.getElementById('send-code-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const csrfToken = getCookie('csrf-token');
      const res = await fetch('/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken || '' },
        body: JSON.stringify({ email }),
      });
      if (res.redirected) { window.location.href = res.url; return; }
      const data = await res.json();
      if (data.redirect) { window.location.href = data.redirect; return; }
      if (!data.success) { alert(data.error || 'Something went wrong'); }
    });
    function getCookie(name) {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? decodeURIComponent(match[2]) : '';
    }
  </script>
</body>
</html>`;
}

export function renderOTPPage(opts: {
  maskedEmail: string;
  csrfToken: string;
  error?: string;
}): string {
  const { maskedEmail, csrfToken, error } = opts;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enter your code</title>
  <style>
    body { font-family: sans-serif; max-width: 400px; margin: 80px auto; padding: 24px; color: #222; }
    h1 { font-size: 22px; margin-bottom: 8px; }
    .subtitle { color: #555; font-size: 14px; margin-bottom: 24px; }
    label { display: block; margin-bottom: 6px; font-size: 14px; color: #555; }
    input[type="text"] { width: 100%; box-sizing: border-box; padding: 10px 12px; font-size: 24px; font-family: monospace; letter-spacing: 4px; border: 1px solid #ccc; border-radius: 6px; margin-bottom: 16px; text-align: center; }
    button { width: 100%; padding: 12px; font-size: 16px; background: #0070f3; color: #fff; border: none; border-radius: 6px; cursor: pointer; }
    button:hover { background: #0060df; }
    .error { color: #c00; font-size: 14px; margin-bottom: 16px; }
    .resend { text-align: center; margin-top: 16px; font-size: 14px; }
    .resend a { color: #0070f3; text-decoration: none; cursor: pointer; }
  </style>
</head>
<body>
  <h1>Check your email</h1>
  <p class="subtitle">We sent an 8-digit code to <strong>${escapeHtml(maskedEmail)}</strong></p>
  ${error ? `<p class="error">${escapeHtml(error)}</p>` : ''}
  <form id="verify-form">
    <label for="code">Enter code</label>
    <input type="text" id="code" name="code" placeholder="00000000" maxlength="8" inputmode="numeric" pattern="[0-9]{8}" required autofocus>
    <button type="submit">Verify</button>
  </form>
  <div class="resend"><a href="#" id="resend-link">Resend code</a></div>
  <script>
    document.getElementById('verify-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      const code = document.getElementById('code').value;
      const csrfToken = getCookie('csrf-token');
      const res = await fetch('/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken || '' },
        body: JSON.stringify({ code }),
      });
      if (res.redirected) { window.location.href = res.url; return; }
      const data = await res.json();
      if (data.redirect) { window.location.href = data.redirect; return; }
      if (data.html) { document.open(); document.write(data.html); document.close(); return; }
      if (!data.success) { alert(data.error || 'Something went wrong'); }
    });
    document.getElementById('resend-link').addEventListener('click', async function(e) {
      e.preventDefault();
      const csrfToken = getCookie('csrf-token');
      const res = await fetch('/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken || '' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      alert(data.message || 'Code resent!');
    });
    function getCookie(name) {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? decodeURIComponent(match[2]) : '';
    }
  </script>
</body>
</html>`;
}

export function maskEmail(email: string): string {
  const atIndex = email.indexOf('@');
  if (atIndex <= 1) return email;
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex);
  const masked = local[0] + '***';
  return masked + domain;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
