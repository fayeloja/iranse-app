import { PaystackProvider, PaystackInitResponse, PaystackVerifyResponse } from './providers/paystack.provider.js';
import { paymentConfig } from './payment.config.js';

export class PaymentService {
  private paystackProvider = new PaystackProvider();

  async initializeTransaction(
    email: string,
    amountInKobo: number,
    reference: string,
    callbackUrl: string
  ): Promise<PaystackInitResponse> {
    if (paymentConfig.activeProvider === 'paystack') {
      return this.paystackProvider.initializeTransaction(email, amountInKobo, reference, callbackUrl);
    }
    throw new Error(`Payment provider ${paymentConfig.activeProvider} is not implemented yet.`);
  }

  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    if (paymentConfig.activeProvider === 'paystack') {
      return this.paystackProvider.verifyTransaction(reference);
    }
    throw new Error(`Payment provider ${paymentConfig.activeProvider} is not implemented yet.`);
  }
}

export const paymentService = new PaymentService();
