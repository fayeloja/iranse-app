import { env } from '../../config/env.js';

export interface KYCVerifyNINInput {
  nin: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
}

export interface KYCVerifyNINResult {
  verified: boolean;
  matchScore: number;
  reason?: string;
  details?: {
    firstNameMatch: boolean;
    lastNameMatch: boolean;
    dobMatch: boolean;
    gender?: string;
    photoUrl?: string;
  };
}

/**
 * KYC client interface for NIN verification via a licensed Nigerian aggregator 
 * (VerifyMe, Youverify, Prembly) sitting between Iransé and NIMC (Standards Rule 5).
 * Falls back to mock validation if KYC_VENDOR_API_KEY is omitted for development.
 */
export async function verifyNIN(input: KYCVerifyNINInput): Promise<KYCVerifyNINResult> {
  const apiKey = env.KYC_VENDOR_API_KEY;

  if (!apiKey) {
    // Local development mock mode
    console.log(`[KYC Client Mock] Verifying NIN ${input.nin} for ${input.firstName} ${input.lastName}`);

    // Simulate API latency
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simple mock error code
    if (input.nin === '00000000000') {
      return {
        verified: false,
        matchScore: 0,
        reason: 'NIN not found in NIMC database',
      };
    }

    return {
      verified: true,
      matchScore: 100,
      details: {
        firstNameMatch: true,
        lastNameMatch: true,
        dobMatch: true,
        gender: 'M',
      },
    };
  }

  // TODO: Implement aggregator-specific API integration once vendor selection spike is complete (see STATE.md)
  throw new Error('KYC client integration for selected vendor is not yet implemented.');
}
