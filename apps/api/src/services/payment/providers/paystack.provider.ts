import { paymentConfig } from '../payment.config.js';

export interface PaystackInitResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaystackVerifyResponse {
  status: string;
  amount: number;
  currency: string;
  transactionDate: string;
  paymentChannel: string;
}

export class PaystackProvider {
  async initializeTransaction(
    email: string,
    amountInKobo: number,
    reference: string,
    callbackUrl: string
  ): Promise<PaystackInitResponse> {
    const { secretKey, baseUrl } = paymentConfig.paystack;

    if (!secretKey) {
      console.log(`[Paystack Provider Mock] Initializing transaction for ${email} (₦${amountInKobo / 100})`);
      return {
        authorization_url: `https://checkout.paystack.co/mock-checkout?ref=${reference}`,
        access_code: `mock_code_${reference}`,
        reference,
      };
    }

    const response = await fetch(`${baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        reference,
        callback_url: callbackUrl,
      }),
    });

    if (!response.ok) {
      throw new Error(`Paystack init payment failed: ${response.status} ${response.statusText}`);
    }

    const resBody = (await response.json()) as any;
    return resBody.data;
  }

  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    const { secretKey, baseUrl } = paymentConfig.paystack;

    if (!secretKey) {
      console.log(`[Paystack Provider Mock] Verifying transaction reference ${reference}`);
      return {
        status: 'success',
        amount: 499900,
        currency: 'NGN',
        transactionDate: new Date().toISOString(),
        paymentChannel: 'card',
      };
    }

    const response = await fetch(`${baseUrl}/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Paystack verify payment failed: ${response.status} ${response.statusText}`);
    }

    const resBody = (await response.json()) as any;
    const tx = resBody.data;

    return {
      status: tx.status,
      amount: tx.amount,
      currency: tx.currency,
      transactionDate: tx.transaction_date,
      paymentChannel: tx.channel,
    };
  }
}
