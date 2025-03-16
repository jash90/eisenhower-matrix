import Stripe from 'stripe';

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing Stripe public key');
}

export const stripe = new Stripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export async function createCheckoutSession(priceId: string, userId: string) {
  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        userId,
      }),
    });

    const { sessionId } = await response.json();
    const { error } = await stripe.redirectToCheckout({ sessionId });

    if (error) {
      throw error;
    }
  } catch (err) {
    console.error('Error:', err);
    throw err;
  }
}

export async function createPortalSession(customerId: string) {
  try {
    const response = await fetch('/api/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
      }),
    });

    const { url } = await response.json();
    window.location.href = url;
  } catch (err) {
    console.error('Error:', err);
    throw err;
  }
}