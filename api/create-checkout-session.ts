import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { priceId, userId } = await req.json();

    // Get user from Supabase
    const { data: user, error: userError } = await supabase
      .from('auth.users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError) {
      throw new Error('User not found');
    }

    // Get or create Stripe customer
    let customerId = user.stripe_customer_id;
    
    if (!customerId) {
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      if (!userData.user) throw new Error('User not found');

      const customer = await stripe.customers.create({
        email: userData.user.email,
        metadata: {
          supabaseUUID: userId,
        },
      });
      
      customerId = customer.id;

      // Update user with Stripe customer ID
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { stripe_customer_id: customerId },
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/settings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/settings`,
      subscription_data: {
        metadata: {
          supabaseUUID: userId,
        },
      },
    });

    return new Response(JSON.stringify({ sessionId: session.id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}