import {
  ArrowRight,
  Youtube,
  Instagram,
  Play,
  Sparkles,
  Wand2,
  Gauge,
  Download,
  Scissors,
  Check,
  Star,
} from 'lucide-react';
import { NavBar, Footer } from '../components/Brand';
import { navigate } from '../lib/router';
import { useAuth } from '../lib/auth';
import { FREE_PLAN_CLIP_LIMIT } from '../types';

const SAMPLE_CLIPS = [
  { title: 'The Hidden Truth About Success', platform: 'YouTube Shorts', score: 96, duration: 42, hook: 'Nobody talks about this, but...' },
  { title: '30-Day Challenge Results', platform: 'Instagram Reels', score: 92, duration: 38, hook: "Here's what happened when I tried this for 30 days" },
  { title: 'The Costly Mistake You\'re Making', platform: 'YouTube Shorts', score: 89, duration: 27, hook: 'This one mistake is costing you thousands' },
  { title: 'A Confession That Changed Everything', platform: 'Vyro', score: 86, duration: 51, hook: 'I was wrong about this the entire time' },
];

export function LandingPage() {
  const { user } = useAuth();
  const ctaPath = user ? '/dashboard' : '/signup';

  return (
    <div className="min-h-screen bg-ink-950">
      <NavBar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-faint bg-grid opacity-[0.6] [mask-image:radial-gradient(70%_60%_at_50%_30%,black,transparent)]" />
        <div className="absolute inset-0 bg-radial-fade" />
        <div className="container-page relative pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex animate-fade-up items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-slate-300">
              <Sparkles size={13} className="text-accent-400" />
              AI-powered clip extraction
            </div>
            <h1 className="animate-fade-up text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-6xl [animation-delay:60ms]">
              Turn long videos into <span className="gradient-text">viral shorts</span> in seconds
            </h1>
            <p className="mx-auto mt-6 max-w-2xl animate-fade-up text-base text-slate-400 sm:text-lg [animation-delay:120ms]">
              Paste a YouTube link or upload a long video. ClipForge AI finds the strongest
              hook-based moments and gives you the top 5–10 short clips — ready for YouTube
              Shorts, Instagram Reels, and Vyro.
            </p>
            <div className="mt-9 flex animate-fade-up flex-col items-center justify-center gap-3 sm:flex-row [animation-delay:180ms]">
              <button onClick={() => navigate(ctaPath)} className="btn-primary group px-6 py-3.5 text-base">
                {user ? 'Open Dashboard' : 'Start free — no card needed'}
                <ArrowRight size={18} className="transition group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-ghost px-6 py-3.5 text-base"
              >
                <Play size={16} /> See how it works
              </button>
            </div>
            <div className="mt-8 flex animate-fade-up items-center justify-center gap-5 text-xs text-slate-500 [animation-delay:240ms]">
              <span className="inline-flex items-center gap-1.5"><Check size={13} className="text-accent-400" /> No credit card on Free</span>
              <span className="inline-flex items-center gap-1.5"><Check size={13} className="text-accent-400" /> {FREE_PLAN_CLIP_LIMIT} free clips / month</span>
              <span className="hidden sm:inline-flex items-center gap-1.5"><Check size={13} className="text-accent-400" /> Cancel anytime</span>
            </div>
          </div>

          {/* Hero preview card */}
          <div className="mx-auto mt-16 max-w-4xl animate-fade-up [animation-delay:300ms]">
            <div className="card-base relative overflow-hidden p-2 shadow-card">
              <div className="rounded-2xl border border-white/[0.05] bg-ink-900/80 p-4 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Wand2 size={15} className="text-accent-400" />
                    <span>youtube.com/watch?v=…</span>
                  </div>
                  <span className="chip">
                    <Sparkles size={11} className="text-accent-400" />
                    8 clips found
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {SAMPLE_CLIPS.map((c, i) => (
                    <div
                      key={i}
                      className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-ink-850/70 p-3 transition hover:border-accent-500/30"
                    >
                      <div className="mb-2 flex aspect-video items-center justify-center rounded-lg bg-gradient-to-br from-ink-700 to-ink-800">
                        <Play size={18} className="text-accent-400/80 transition group-hover:scale-110" />
                      </div>
                      <p className="line-clamp-2 text-[11px] font-medium leading-tight text-slate-200">{c.title}</p>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                        <span>{c.duration}s</span>
                        <span className="text-accent-400">{c.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="border-y border-white/[0.05] bg-ink-900/40">
        <div className="container-page py-8">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-slate-500">
            Optimized for every short-form platform
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-6 sm:gap-12">
            <PlatformBadge icon={<Youtube size={20} />} label="YouTube Shorts" />
            <PlatformBadge icon={<Instagram size={20} />} label="Instagram Reels" />
            <PlatformBadge icon={<Play size={20} />} label="Vyro" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container-page py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-accent-400">How it works</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Three steps from long-form to viral
          </h2>
          <p className="mt-4 text-slate-400">
            No editing skills required. ClipForge handles the analysis, the trimming, and the
            scoring — you just hit download.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          <StepCard
            step="01"
            icon={<Link />}
            title="Paste or upload"
            body="Drop in a YouTube link or upload a long video. Podcasts, interviews, webinars — all welcome."
          />
          <StepCard
            step="02"
            icon={<Wand2 />}
            title="Generate clips"
            body="Our AI analyzes the transcript, finds the strongest hooks, and scores each moment for virality."
          />
          <StepCard
            step="03"
            icon={<Download />}
            title="Download & post"
            body="Get the top 5–10 short clips with previews, durations, and a one-click download for every platform."
          />
        </div>
      </section>

      {/* Features */}
      <section className="bg-ink-900/40 border-y border-white/[0.05]">
        <div className="container-page py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-accent-400">Why creators choose ClipForge</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Built for speed, tuned for virality
            </h2>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard icon={<Scissors />} title="Hook detection" body="We surface the opening lines most likely to stop the scroll on every platform." />
            <FeatureCard icon={<Gauge />} title="Virality score" body="Every clip gets a 0–100 score so you know which moments to post first." />
            <FeatureCard icon={<Sparkles />} title="Multi-platform" body="Clips are tagged for YouTube Shorts, Instagram Reels, and Vyro out of the box." />
            <FeatureCard icon={<Gauge />} title="Fast processing" body="Most videos finish in under a minute. Watch the progress bar in real time." />
            <FeatureCard icon={<Download />} title="One-click download" body="Download any clip instantly — no watermarks, no waiting in a queue." />
            <FeatureCard icon={<Star />} title="Ranked for you" body="Clips are sorted by score so the best moment is always at the top." />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container-page py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-accent-400">Pricing</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Start free. Upgrade when you grow.
          </h2>
          <p className="mt-4 text-slate-400">Two simple plans. No hidden fees.</p>
        </div>
        <div className="mx-auto mt-14 grid max-w-3xl gap-6 md:grid-cols-2">
          <PriceCard
            name="Free"
            price="$0"
            period="forever"
            features={[
              `${FREE_PLAN_CLIP_LIMIT} clips per month`,
              'YouTube link input',
              'Top 5 clips per video',
              '720p downloads',
            ]}
            cta={user ? 'Go to dashboard' : 'Create free account'}
            onClick={() => navigate(ctaPath)}
          />
          <PriceCard
            name="Pro"
            price="$19"
            period="/ month"
            highlighted
            features={[
              'Unlimited clips',
              'YouTube + video uploads',
              'Top 10 clips per video',
              '1080p downloads',
              'Priority processing',
            ]}
            cta={user ? 'Upgrade to Pro' : 'Start Pro trial'}
            onClick={() => (user ? navigate('/dashboard') : navigate('/signup'))}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-ink-850 to-ink-900 p-10 text-center shadow-card sm:p-16">
          <div className="absolute inset-0 bg-radial-fade opacity-80" />
          <div className="relative">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Your next viral clip is hiding in your last video.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-400">
              Spin up ClipForge and find it in under a minute.
            </p>
            <button onClick={() => navigate(ctaPath)} className="btn-primary group mt-8 px-6 py-3.5 text-base">
              {user ? 'Open Dashboard' : 'Get started free'}
              <ArrowRight size={18} className="transition group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function PlatformBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-400 transition hover:text-slate-200">
      <span className="text-accent-400">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

function StepCard({ step, icon, title, body }: { step: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="card-base group p-7 transition hover:border-accent-500/20 hover:shadow-soft">
      <div className="mb-5 flex items-center justify-between">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-accent-500/10 text-accent-400">
          {icon}
        </div>
        <span className="text-xs font-semibold tracking-widest text-slate-600">{step}</span>
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
    </div>
  );
}

function FeatureCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="card-base p-6 transition hover:border-white/10">
      <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-white/[0.04] text-accent-400">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{body}</p>
    </div>
  );
}

function PriceCard({
  name,
  price,
  period,
  features,
  cta,
  onClick,
  highlighted,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  onClick: () => void;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`relative rounded-3xl p-7 transition ${
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
      <h3 className="text-lg font-semibold text-white">{name}</h3>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-4xl font-semibold tracking-tight text-white">{price}</span>
        <span className="text-sm text-slate-500">{period}</span>
      </div>
      <ul className="mt-6 space-y-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
            <Check size={16} className="mt-0.5 shrink-0 text-accent-400" />
            {f}
          </li>
        ))}
      </ul>
      <button
        onClick={onClick}
        className={`mt-7 w-full ${highlighted ? 'btn-primary' : 'btn-ghost'} py-3`}
      >
        {cta}
      </button>
    </div>
  );
}

function Link() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
