declare module 'web-push' {
  export interface PushSubscription {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }

  export interface VapidKeys {
    publicKey: string;
    privateKey: string;
  }

  export interface SendResult {
    statusCode: number;
    body: string;
    headers: Record<string, string>;
  }

  export interface RequestOptions {
    gcmAPIKey?: string;
    vapidDetails?: {
      subject: string;
      publicKey: string;
      privateKey: string;
    };
    TTL?: number;
    headers?: Record<string, string>;
    contentEncoding?: string;
    proxy?: string;
    timeout?: number;
  }

  export function generateVAPIDKeys(): VapidKeys;
  
  export function setGCMAPIKey(apiKey: string): void;
  
  export function setVapidDetails(
    subject: string,
    publicKey: string,
    privateKey: string
  ): void;
  
  export function sendNotification(
    subscription: PushSubscription | string,
    payload?: string | Buffer,
    options?: RequestOptions
  ): Promise<SendResult>;
}