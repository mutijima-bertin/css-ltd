import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const FLW_CLIENT_ID = process.env.FLW_CLIENT_ID;
const FLW_CLIENT_SECRET = process.env.FLW_CLIENT_SECRET;
const ENVIRONMENT = process.env.FLW_ENVIRONMENT || 'sandbox';

const BASE_URL = ENVIRONMENT === 'live'
  ? 'https://api.flutterwave.com'
  : 'https://developersandbox-api.flutterwave.com';

const TOKEN_URL = 'https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token';

let cachedToken = null;
let tokenExpiry = 0;

function generateIdempotencyKey() {
  return crypto.randomUUID();
}

function generateTraceId() {
  return crypto.randomUUID();
}

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: FLW_CLIENT_ID,
      client_secret: FLW_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Flutterwave auth failed: ${err}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 30) * 1000;
  return cachedToken;
}

export async function initiatePayment({ amount, email, phone, name, tx_ref, redirect_url }) {
  const token = await getAccessToken();
  const traceId = generateTraceId();
  const idempotencyKey = generateIdempotencyKey();

  const nameParts = name.split(' ');
  const firstName = nameParts[0] || name;
  const lastName = nameParts.slice(1).join(' ') || 'Customer';

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const countryCode = cleanPhone.startsWith('250') ? '250' : '250';
  const phoneNumber = cleanPhone.startsWith('250') ? cleanPhone : `250${cleanPhone}`;

  const payload = {
    amount,
    currency: 'RWF',
    reference: tx_ref,
    redirect_url,
    customer: {
      email,
      name: { first: firstName, last: lastName },
      phone: { country_code: countryCode, number: phoneNumber },
    },
    payment_method: {
      type: 'mobile_money',
      mobile_money: {
        country_code: '250',
        network: 'MTN',
        phone_number: phoneNumber,
      },
    },
  };

  const res = await fetch(`${BASE_URL}/orchestration/direct-charges`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Trace-Id': traceId,
      'X-Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (data.status !== 'success') {
    throw new Error(data.message || 'Flutterwave v4 payment initiation failed');
  }

  const charge = data.data;

  let paymentLink = null;
  if (charge.next_action?.type === 'redirect_url') {
    paymentLink = charge.next_action.redirect_url.url;
  }

  return {
    charge_id: charge.id,
    link: paymentLink,
    status: charge.status,
    next_action: charge.next_action,
  };
}

export async function verifyTransaction(chargeId) {
  const token = await getAccessToken();
  const traceId = generateTraceId();

  const res = await fetch(`${BASE_URL}/charges/${chargeId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Trace-Id': traceId,
    },
  });

  const data = await res.json();

  if (data.status !== 'success') {
    throw new Error(data.message || 'Transaction verification failed');
  }

  return data.data;
}

export async function verifyTransactionByRef(reference) {
  const token = await getAccessToken();
  const traceId = generateTraceId();

  const res = await fetch(`${BASE_URL}/charges?reference=${encodeURIComponent(reference)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Trace-Id': traceId,
    },
  });

  const data = await res.json();

  if (data.status !== 'success') {
    throw new Error(data.message || 'Transaction lookup failed');
  }

  return data.data;
}
