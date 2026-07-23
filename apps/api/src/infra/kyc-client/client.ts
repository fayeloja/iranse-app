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

  try {
    const vendorName = process.env.KYC_VENDOR_NAME || 'Prembly/IdentityPass';
    console.log(`[KYC Client] Verifying NIN with vendor: ${vendorName}`);
    
    const response = await fetch('https://api.prembly.com/identitypass/verification/nin', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'app-id': process.env.KYC_VENDOR_APP_ID || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ number: input.nin }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.status || data.response_code !== '00') {
      return {
        verified: false,
        matchScore: 0,
        reason: data.detail || 'Verification failed',
      };
    }

    const ninData = data.nin_data;
    const firstNameMatch = ninData.firstname?.toLowerCase() === input.firstName.toLowerCase();
    const lastNameMatch = ninData.surname?.toLowerCase() === input.lastName.toLowerCase();
    const dobMatch = ninData.birthdate === input.dateOfBirth;

    let matchCount = 0;
    if (firstNameMatch) matchCount++;
    if (lastNameMatch) matchCount++;
    if (dobMatch) matchCount++;

    let matchScore = 0;
    if (matchCount === 3) matchScore = 100;
    else if (matchCount === 2) matchScore = 75;
    else if (matchCount === 1) matchScore = 50;

    return {
      verified: matchScore >= 75,
      matchScore,
      details: {
        firstNameMatch,
        lastNameMatch,
        dobMatch,
        gender: ninData.gender,
        photoUrl: ninData.photo,
      },
    };
  } catch (error: any) {
    return {
      verified: false,
      matchScore: 0,
      reason: `KYC vendor API error: ${error.message}`,
    };
  }
}
