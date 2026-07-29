import { Check, Sparkles } from 'lucide-react';
import { FREE_PLAN_CLIP_LIMIT } from '../types';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      `${FREE_PLAN_CLIP_LIMIT} clips per month`,
      'YouTube link input',
      'Top 5 clips per video',
      '720p downloads',
    ],
    cta: 'Stay on Free',
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/ month',
    features: [
      'Unlimited clips',
      'YouTube + video uploads',
      'Top 10 clips per video',
      '1080p downloads',
      'Priority processing',
    ],
    cta: 'Upgrade to Pro',
    highlighted: true,
  },
] as const;

export function PricingSection({ currentPlan }: { currentPlan: 'free' | 'pro' }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {PLANS.map((plan) => {
        const isCurrent = plan.name.toLowerCase() === currentPlan;
        const highlighted = 'highlighted' in plan && plan.highlighted;
        return (
          <div
            key={plan.name}
            className={`relative rounded-3xl p-6 transition ${
              highlighted
                ? 'border-2 border-accent-500/40 bg-ink-850 shadow-glow'
                : 'card-base hover:border-white/10'
            }`}
          >
            {highlighted && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent-500 px-3 py-1 text-[11px] font-semibold text-ink-950">
                Most popular
              </span>
            )}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
              {isCurrent && (
                <span className="chip">
                  <Sparkles size={11} className="text-accent-400" />
                  Current
                </span>
              )}
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight text-white">{plan.price}</span>
              <span className="text-sm text-slate-500">{plan.period}</span>
            </div>
            <ul className="mt-6 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <Check size={16} className="mt-0.5 shrink-0 text-accent-400" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
