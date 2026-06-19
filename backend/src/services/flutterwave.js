import dotenv from 'dotenv';

dotenv.config();

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;
const FLW_API = 'https://api.flutterwave.com/v3';

export async function initiatePayment({ amount, email, phone, name, tx_ref, redirect_url }) {
  const payload = {
    tx_ref,
    amount,
    currency: 'RWF',
    redirect_url,
    customer: {
      email,
      phone_number: phone,
      name,
    },
    customizations: {
      title: 'Creative Sound Studio',
      description: 'Studio Booking Deposit',
      logo: 'https://css-ltd.vercel.app/logo.png',
    },
    payment_options: 'mobilemoneyrw',
  };

  const res = await fetch(`${FLW_API}/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${FLW_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (data.status !== 'success') {
    throw new Error(data.message || 'Flutterwave payment initiation failed');
  }

  return data.data;
}

export async function verifyTransaction(txId) {
  const res = await fetch(`${FLW_API}/transactions/${txId}/verify`, {
    headers: {
      Authorization: `Bearer ${FLW_SECRET_KEY}`,
    },
  });

  const data = await res.json();
  if (data.status !== 'success') {
    throw new Error(data.message || 'Transaction verification failed');
  }

  return data.data;
}
