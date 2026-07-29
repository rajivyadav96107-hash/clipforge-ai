import { useState } from 'react';
import { Lock, Loader2, ArrowRight, Check } from 'lucide-react';
import { Modal } from './Modal';
import { toast } from './Toast';
import { PricingSection } from './PricingSection';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

// Stripe is integrated via a Supabase edge function. When Stripe keys are
// configured, the function returns a Checkout URL we redirect to. When they
// are not configured yet, we surface clear onboarding guidance instead.
const STRIPE_CHECKOUT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`;

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast('error', 'You need to be signed in to upgrade.');
        setLoading(false);
        return;
      }
      const res = await fetch(STRIPE_CHECKOUT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ price_id: 'pro_monthly' }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message =
          body?.error === 'stripe_not_configured'
            ? 'Stripe is not configured yet. See the note below the dashboard to finish setup.'
            : body?.error || `Checkout failed (${res.status})`;
        throw new Error(message);
      }

      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error('No checkout URL returned');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upgrade failed.';
      toast('error', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Upgrade your plan" maxWidth="max-w-2xl">
      <p className="mb-6 text-sm text-slate-400">
        Unlock unlimited clips, video uploads, and priority processing.
      </p>

      <PricingSection currentPlan={profile?.plan ?? 'free'} />

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Lock size={13} className="text-accent-400" />
          Secure payment via Stripe
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost py-2.5 text-sm">
            Maybe later
          </button>
          <button
            onClick={handleUpgrade}
            disabled={loading || profile?.plan === 'pro'}
            className="btn-primary py-2.5 text-sm"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Redirecting…
              </>
            ) : profile?.plan === 'pro' ? (
              <>
                <Check size={15} /> You're on Pro
              </>
            ) : (
              <>
                Upgrade to Pro <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </div>

      <p className="mt-5 text-center text-[11px] text-slate-600">
        You'll be redirected to Stripe Checkout. Your plan updates automatically after payment.
      </p>
    </Modal>
  );
}
