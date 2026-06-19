import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const res = await fetch('https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: process.env.FLW_CLIENT_ID,
    client_secret: process.env.FLW_CLIENT_SECRET,
    grant_type: 'client_credentials',
  }),
});
const { access_token } = await res.json();

const payRes = await fetch('https://developersandbox-api.flutterwave.com/orchestration/direct-charges', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json',
    'X-Trace-Id': crypto.randomUUID(),
    'X-Idempotency-Key': crypto.randomUUID(),
  },
  body: JSON.stringify({
    amount: 25000,
    currency: 'RWF',
    reference: `TEST-${Date.now()}`,
    customer: {
      email: 'test@css.rw',
      name: { first: 'Test', last: 'User' },
      phone: { country_code: '250', number: '788123456' },
    },
    payment_method: {
      type: 'mobile_money',
      mobile_money: {
        country_code: '250',
        network: 'MTN',
        phone_number: '788123456',
      },
    },
  }),
});

console.log('Status:', payRes.status);
const data = await payRes.json();
console.log(JSON.stringify(data, null, 2));
