import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface MailerConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: { user: string; pass: string };
  from: string;
}

export class Mailer {
  private transporter: Transporter;
  private from: string;

  constructor(config: MailerConfig) {
    this.from = config.from;

    // Only pass auth to nodemailer when credentials are actually provided.
    // MailHog and other dev SMTP servers don't need auth — passing an empty
    // auth object causes nodemailer to attempt PLAIN authentication and fail.
    const hasAuth = config.auth && (config.auth.user || config.auth.pass);

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      ...(hasAuth ? { auth: config.auth } : {}),
    });
  }

  async sendOTP(
    to: string,
    code: string,
    options?: { appName?: string }
  ): Promise<void> {
    const appName = options?.appName ?? 'Hypercerts Scaffold';
    const subject = `Your sign-in code: ${code}`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #222;">
  <h1 style="font-size: 20px; margin-bottom: 16px;">${appName}</h1>
  <p style="margin-bottom: 8px;">Your sign-in code is:</p>
  <p style="font-size: 36px; font-family: monospace; font-weight: bold; letter-spacing: 4px; margin: 16px 0;">${code}</p>
  <p style="color: #666; font-size: 14px; margin-bottom: 24px;">This code expires in 15 minutes.</p>
  <p style="color: #999; font-size: 12px;">If you didn't request this code, you can safely ignore this email.</p>
</body>
</html>`;

    const text = `${appName}

Your sign-in code is: ${code}

This code expires in 15 minutes.

If you didn't request this code, you can safely ignore this email.`;

    await this.transporter.sendMail({
      from: this.from,
      to,
      subject,
      html,
      text,
    });
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (err) {
      console.error('SMTP connection verification failed:', err);
      return false;
    }
  }
}
