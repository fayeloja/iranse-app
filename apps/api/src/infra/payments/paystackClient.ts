import { env } from '../../config/env.js';

export interface PaystackInitResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaystackVerifyResponse {
  status: string; // 'success', 'failed', etc.
  amount: number;
  currency: string;
  transactionDate: string;
  paymentChannel: string;
}

/**
 * Paystack payment gateway wrapper client.
 * Interacts with Paystack API. Falls back to mock responses in local development.
 */
export async function initializeTransaction(
  email: string,
  amountInKobo: number,
  reference: string,
  callbackUrl: string
): Promise<PaystackInitResponse> {
  const secretKey = env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    console.log(`[Paystack Client Mock] Initializing transaction for ${email} (₦${amountInKobo / 100})`);
    return {
      authorization_url: `https://checkout.paystack.co/mock-checkout?ref=${reference}`,
      access_code: `mock_code_${reference}`,
      reference,
    };
  }

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
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

/**
 * Verifies a transaction payment status by payment reference.
 * 
 * @param reference - Unique Paystack payment reference string
 */
export async function verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
  const secretKey = env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    console.log(`[Paystack Client Mock] Verifying transaction reference ${reference}`);
    return {
      status: 'success',
      amount: 499900, // ₦4,999 in kobo (default premium plan price example)
      currency: 'NGN',
      transactionDate: new Date().toISOString(),
      paymentChannel: 'card',
    };
  }

  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
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
