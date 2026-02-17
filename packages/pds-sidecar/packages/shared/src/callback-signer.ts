import crypto from 'node:crypto';

export interface CallbackParams {
  requestUri: string;
  email: string;
  approved: boolean;
  newAccount: boolean;
  timestamp: number;
}

export class CallbackSigner {
  private readonly secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  sign(params: CallbackParams): string {
    const serialized = `${params.requestUri}|${params.email}|${params.approved}|${params.newAccount}|${params.timestamp}`;
    return crypto.createHmac('sha256', this.secret).update(serialized).digest('hex');
  }

  verify(
    params: CallbackParams,
    signature: string,
    maxAgeSeconds: number = 300,
  ): { valid: boolean; error?: string } {
    const now = Math.floor(Date.now() / 1000);
    const age = now - params.timestamp;

    if (age > maxAgeSeconds || age < -maxAgeSeconds) {
      return { valid: false, error: 'Callback expired' };
    }

    const expected = this.sign(params);

    try {
      const sigBuf = Buffer.from(signature, 'hex');
      const expBuf = Buffer.from(expected, 'hex');

      if (sigBuf.length !== expBuf.length) {
        return { valid: false, error: 'Invalid signature' };
      }

      const match = crypto.timingSafeEqual(sigBuf, expBuf);
      if (!match) {
        return { valid: false, error: 'Invalid signature' };
      }

      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid signature' };
    }
  }

  buildCallbackUrl(baseUrl: string, params: CallbackParams): string {
    const signature = this.sign(params);
    const url = new URL(`${baseUrl}/oauth/magic-callback`);
    url.searchParams.set('request_uri', params.requestUri);
    url.searchParams.set('email', params.email);
    url.searchParams.set('approved', String(params.approved));
    url.searchParams.set('new_account', String(params.newAccount));
    url.searchParams.set('timestamp', String(params.timestamp));
    url.searchParams.set('sig', signature);
    return url.toString();
  }

  static parseCallbackUrl(url: URL): { params: CallbackParams; signature: string } {
    const requestUri = url.searchParams.get('request_uri') ?? '';
    const email = url.searchParams.get('email') ?? '';
    const approved = url.searchParams.get('approved') === 'true';
    const newAccount = url.searchParams.get('new_account') === 'true';
    const timestamp = Number(url.searchParams.get('timestamp') ?? '0');
    const signature = url.searchParams.get('sig') ?? '';

    return {
      params: { requestUri, email, approved, newAccount, timestamp },
      signature,
    };
  }
}
