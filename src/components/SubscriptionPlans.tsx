import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { createCheckoutSession } from '../lib/stripe';
import { cn } from '../lib/utils';
import { Check, Clock, CreditCard } from 'lucide-react';

interface Price {
  id: string;
  stripe_price_id: string;
  description: string;
  unit_amount: number;
  currency: string;
  interval: string;
  active: boolean;
}

interface SubscriptionPlansProps {
  userId: string;
}

export function SubscriptionPlans({ userId }: SubscriptionPlansProps) {
  const [prices, setPrices] = useState<Price[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrices();
  }, []);

  async function fetchPrices() {
    try {
      const { data, error } = await supabase
        .from('prices')
        .select('*')
        .eq('active', true)
        .order('unit_amount', { ascending: true });

      if (error) throw error;
      setPrices(data || []);
    } catch (err) {
      console.error('Error fetching prices:', err);
    }
  }

  async function handleSubscribe(priceId: string) {
    setLoading(true);
    setError(null);

    try {
      await createCheckoutSession(priceId, userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Subscription Plans</h2>
        <p className="mt-2 text-gray-600">
          Choose a plan that works best for you
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {prices.map((price) => {
          const amount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: price.currency,
            minimumFractionDigits: 0,
          }).format(price.unit_amount / 100);

          return (
            <div
              key={price.id}
              className="relative p-6 bg-white rounded-lg border hover:border-blue-400 transition-colors"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold">{price.description}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{amount}</span>
                  <span className="text-gray-600">
                    /{price.interval}
                  </span>
                </div>
              </div>

              <ul className="mb-6 space-y-2">
                <li className="flex items-center gap-2 text-gray-600">
                  <Check size={18} className="text-green-500" />
                  Unlimited tasks
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <Check size={18} className="text-green-500" />
                  Custom sections
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <Check size={18} className="text-green-500" />
                  Priority support
                </li>
              </ul>

              <button
                onClick={() => handleSubscribe(price.stripe_price_id)}
                disabled={loading}
                className={cn(
                  'w-full py-2 px-4 rounded-md text-white flex items-center justify-center gap-2',
                  loading
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                )}
              >
                {loading ? (
                  <>
                    <Clock className="animate-spin" size={18} />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    Subscribe
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}