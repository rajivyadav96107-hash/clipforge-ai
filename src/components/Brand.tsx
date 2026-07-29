import { Link2, Scissors, Sparkles } from 'lucide-react';
import { navigate } from '../lib/router';
import { useAuth } from '../lib/auth';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`relative ${dims} rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 grid place-items-center shadow-glow`}
      >
        <Scissors size={iconSize} className="text-ink-950" strokeWidth={2.5} />
      </div>
      <span
        className={`font-semibold tracking-tight text-white ${
          size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-lg'
        }`}
      >
        ClipForge<span className="text-accent-400"> AI</span>
      </span>
    </div>
  );
}

export function NavBar() {
  const { user, plan } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.05] bg-ink-950/70 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between">
        <button onClick={() => navigate('/')} className="transition hover:opacity-80">
          <Logo size="sm" />
        </button>
        <nav className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <span className="chip hidden sm:inline-flex">
                <Sparkles size={12} className="text-accent-400" />
                {plan === 'pro' ? 'Pro plan' : 'Free plan'}
              </span>
              <button onClick={() => navigate('/dashboard')} className="btn-ghost py-2 text-xs">
                Dashboard
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="btn-ghost py-2 text-xs">
                Log in
              </button>
              <button onClick={() => navigate('/signup')} className="btn-primary py-2 text-xs">
                Get started
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/[0.05] py-10">
      <div className="container-page flex flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-2 text-slate-400">
          <Link2 size={16} className="text-accent-400" />
          <span className="text-sm">ClipForge AI — turn long videos into viral shorts.</span>
        </div>
        <div className="flex items-center gap-5 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} ClipForge AI</span>
          <span className="hidden sm:inline">Built for creators</span>
        </div>
      </div>
    </footer>
  );
}
