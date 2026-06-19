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

const COUNTRY_CONFIG = {
  '250': { network: 'MTN', name: 'Rwanda' },
  '254': { network: 'SAFARICOM', name: 'Kenya' },
  '256': { network: 'MTN', name: 'Uganda' },
  '255': { network: 'VODACOM', name: 'Tanzania' },
  '233': { network: 'MTN', name: 'Ghana' },
  '234': { network: 'MTN', name: 'Nigeria' },
  '260': { network: 'MTN', name: 'Zambia' },
  '27': { network: 'VODACOM', name: 'South Africa' },
  '257': { network: 'ECONET', name: 'Burundi' },
  '243': { network: 'AIRTEL', name: 'DR Congo' },
};

const DEFAULT_COUNTRY = '250';

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

export async function initiatePayment({ amount, email, phone, name, tx_ref, redirect_url, country_code }) {
  const token = await getAccessToken();
  const traceId = generateTraceId();
  const idempotencyKey = generateIdempotencyKey();

  const cc = country_code || DEFAULT_COUNTRY;
  const config = COUNTRY_CONFIG[cc] || COUNTRY_CONFIG[DEFAULT_COUNTRY];

  const nameParts = name.split(' ');
  const firstName = nameParts[0] || name;
  const lastName = nameParts.slice(1).join(' ') || 'Customer';

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const localNumber = cleanPhone.replace(new RegExp(`^${cc}`), '').replace(/^0+/, '');

  const payload = {
    amount,
    currency: 'RWF',
    reference: tx_ref,
    ...(redirect_url ? { redirect_url } : {}),
    customer: {
      email,
      name: { first: firstName, last: lastName },
      phone: { country_code: cc, number: localNumber },
    },
    payment_method: {
      type: 'mobile_money',
      mobile_money: {
        country_code: cc,
        network: config.network,
        phone_number: localNumber,
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

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error(`Flutterwave v4 non-JSON response: ${text}`); }

  if (data.status !== 'success') {
    const msg = data.error?.message || data.message || JSON.stringify(data);
    throw new Error(msg);
  }

  const charge = data.data;

  let paymentLink = null;
  let instruction = null;

  if (charge.next_action?.type === 'redirect_url') {
    paymentLink = charge.next_action.redirect_url.url;
  } else if (charge.next_action?.type === 'payment_instruction') {
    instruction = charge.next_action.payment_instruction.note;
  }

  return {
    charge_id: charge.id,
    link: paymentLink,
    instruction,
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

export function verifyWebhookSignature(req) {
  const signature = req.headers['verif-hash'];
  if (!signature) return false;
  return signature === process.env.FLW_WEBHOOK_SECRET;
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
