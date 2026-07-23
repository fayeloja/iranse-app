import { paymentService } from '../../services/index.js';
import { PaystackInitResponse, PaystackVerifyResponse } from '../../services/payment/providers/paystack.provider.js';

export { PaystackInitResponse, PaystackVerifyResponse };

/**
 * Paystack payment gateway wrapper client.
 * Delegates to central paymentService.
 */
export async function initializeTransaction(
  email: string,
  amountInKobo: number,
  reference: string,
  callbackUrl: string
): Promise<PaystackInitResponse> {
  return paymentService.initializeTransaction(email, amountInKobo, reference, callbackUrl);
}

/**
 * Verifies a transaction payment status by payment reference.
 * Delegates to central paymentService.
 */
export async function verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
  return paymentService.verifyTransaction(reference);
}
