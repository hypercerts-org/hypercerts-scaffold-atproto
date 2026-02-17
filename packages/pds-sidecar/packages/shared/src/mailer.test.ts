import { describe, it, expect, vi, beforeEach } from 'vitest';
import nodemailer from 'nodemailer';
import { Mailer } from './mailer.js';

// Mock nodemailer
vi.mock('nodemailer');

const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'test-id' });
const mockVerify = vi.fn();

const mockTransporter = {
  sendMail: mockSendMail,
  verify: mockVerify,
};

const mockedCreateTransport = vi.mocked(nodemailer.createTransport);

beforeEach(() => {
  vi.clearAllMocks();
  mockedCreateTransport.mockReturnValue(mockTransporter as any);
});

const defaultConfig = {
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  auth: { user: 'user@example.com', pass: 'secret' },
  from: 'Hypercerts Scaffold <noreply@certified.app>',
};

describe('Mailer', () => {
  describe('sendOTP', () => {
    it('calls sendMail with correct to, from, and subject', async () => {
      const mailer = new Mailer(defaultConfig);
      await mailer.sendOTP('recipient@example.com', '12345678');

      expect(mockSendMail).toHaveBeenCalledOnce();
      const call = mockSendMail.mock.calls[0][0];
      expect(call.to).toBe('recipient@example.com');
      expect(call.from).toBe('Hypercerts Scaffold <noreply@certified.app>');
      expect(call.subject).toBe('Your sign-in code: 12345678');
    });

    it('includes the code in the HTML body', async () => {
      const mailer = new Mailer(defaultConfig);
      await mailer.sendOTP('recipient@example.com', '87654321');

      const call = mockSendMail.mock.calls[0][0];
      expect(call.html).toContain('87654321');
    });

    it('includes the code in the text body', async () => {
      const mailer = new Mailer(defaultConfig);
      await mailer.sendOTP('recipient@example.com', '87654321');

      const call = mockSendMail.mock.calls[0][0];
      expect(call.text).toContain('87654321');
    });

    it('has both HTML and plain text versions', async () => {
      const mailer = new Mailer(defaultConfig);
      await mailer.sendOTP('recipient@example.com', '11223344');

      const call = mockSendMail.mock.calls[0][0];
      expect(call.html).toBeTruthy();
      expect(call.text).toBeTruthy();
    });

    it('displays the code prominently in HTML (large, monospaced)', async () => {
      const mailer = new Mailer(defaultConfig);
      await mailer.sendOTP('recipient@example.com', '99887766');

      const call = mockSendMail.mock.calls[0][0];
      // Code should be in a large, monospaced element
      expect(call.html).toContain('monospace');
      expect(call.html).toContain('99887766');
    });

    it('uses custom appName when provided', async () => {
      const mailer = new Mailer(defaultConfig);
      await mailer.sendOTP('recipient@example.com', '12345678', {
        appName: 'My Custom App',
      });

      const call = mockSendMail.mock.calls[0][0];
      expect(call.html).toContain('My Custom App');
      expect(call.text).toContain('My Custom App');
    });

    it('defaults to "Hypercerts Scaffold" when no appName provided', async () => {
      const mailer = new Mailer(defaultConfig);
      await mailer.sendOTP('recipient@example.com', '12345678');

      const call = mockSendMail.mock.calls[0][0];
      expect(call.html).toContain('Hypercerts Scaffold');
      expect(call.text).toContain('Hypercerts Scaffold');
    });

    it('includes expiry notice in HTML and text', async () => {
      const mailer = new Mailer(defaultConfig);
      await mailer.sendOTP('recipient@example.com', '12345678');

      const call = mockSendMail.mock.calls[0][0];
      expect(call.html).toContain('15 minutes');
      expect(call.text).toContain('15 minutes');
    });
  });

  describe('verifyConnection', () => {
    it('returns true when SMTP is reachable', async () => {
      mockVerify.mockResolvedValueOnce(true);
      const mailer = new Mailer(defaultConfig);
      const result = await mailer.verifyConnection();
      expect(result).toBe(true);
    });

    it('returns false when SMTP is unreachable', async () => {
      mockVerify.mockRejectedValueOnce(new Error('Connection refused'));
      const mailer = new Mailer(defaultConfig);
      const result = await mailer.verifyConnection();
      expect(result).toBe(false);
    });

    it('does not throw when SMTP is unreachable', async () => {
      mockVerify.mockRejectedValueOnce(new Error('Connection refused'));
      const mailer = new Mailer(defaultConfig);
      await expect(mailer.verifyConnection()).resolves.not.toThrow();
    });
  });
});
