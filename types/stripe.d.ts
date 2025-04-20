declare module '@stripe/stripe-js' {
  export interface StripeElementsOptions {
    clientSecret: string;
    appearance?: any;
  }

  export interface StripeElements {
    create(type: string, options?: any): StripeElement;
    getElement(type: string): StripeElement | null;
    update(options: StripeElementsOptions): void;
  }

  export interface StripeElement {
    mount(domElement: HTMLElement | string): void;
    unmount(): void;
    on(event: string, handler: (event: any) => void): void;
    update(options: any): void;
    blur(): void;
    clear(): void;
    focus(): void;
    destroy(): void;
  }

  export interface StripePaymentElement extends StripeElement {}
  export interface StripeCardElement extends StripeElement {}

  export interface StripeConfirmOptions {
    elements: StripeElements;
    confirmParams?: {
      return_url: string;
      payment_method_data?: any;
      shipping?: any;
      receipt_email?: string;
    };
    redirect: 'if_required' | 'always';
  }

  export interface StripePaymentResult {
    error?: {
      type: string;
      message: string;
      code?: string;
      decline_code?: string;
      param?: string;
    };
    paymentIntent?: {
      id: string;
      object: string;
      amount: number;
      created: number;
      currency: string;
      status: PaymentIntentStatus;
      client_secret: string;
    };
  }

  export type PaymentIntentStatus = 
    | 'requires_payment_method'
    | 'requires_confirmation'
    | 'requires_action'
    | 'processing'
    | 'requires_capture'
    | 'canceled'
    | 'succeeded';

  export interface Stripe {
    elements(options: StripeElementsOptions): StripeElements;
    confirmPayment(options: StripeConfirmOptions): Promise<StripePaymentResult>;
    confirmSetup(options: StripeConfirmOptions): Promise<StripePaymentResult>;
    retrievePaymentIntent(clientSecret: string): Promise<StripePaymentResult>;
    retrieveSetupIntent(clientSecret: string): Promise<StripePaymentResult>;
  }

  export interface StripeConstructor {
    (publicKey: string, options?: any): Stripe;
  }

  export const loadStripe: (publicKey: string, options?: any) => Promise<Stripe | null>;
}

declare module '@stripe/react-stripe-js' {
  import { Stripe, StripeElements, StripeElementsOptions } from '@stripe/stripe-js';
  import * as React from 'react';

  export interface ElementsContextValue {
    elements: StripeElements | null;
    stripe: Stripe | null;
  }

  export const ElementsContext: React.Context<ElementsContextValue>;

  export interface ElementsProps {
    stripe: Stripe | null | Promise<Stripe | null>;
    options: StripeElementsOptions;
    children: React.ReactNode;
  }

  export function Elements(props: ElementsProps): JSX.Element;

  export function useStripe(): Stripe | null;
  export function useElements(): StripeElements | null;

  export interface PaymentElementProps {
    id?: string;
    className?: string;
    options?: any;
    onChange?: (event: any) => void;
    onReady?: (element: any) => void;
    onFocus?: (event: any) => void;
    onBlur?: (event: any) => void;
    onEscape?: (event: any) => void;
  }

  export function PaymentElement(props: PaymentElementProps): JSX.Element;
  export function CardElement(props: PaymentElementProps): JSX.Element;
}