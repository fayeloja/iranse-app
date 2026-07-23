import { env } from '../../config/env.js';

export interface PaymentServiceConfig {
  activeProvider: 'paystack' | 'flutterwave';
  paystack: {
    secretKey?: string;
    baseUrl: string;
  };
}

export const paymentConfig: PaymentServiceConfig = {
  activeProvider: env.PAYMENT_PROVIDER || 'paystack',
  paystack: {
    secretKey: env.PAYSTACK_SECRET_KEY,
    baseUrl: 'https://api.paystack.co',
  },
};
