import { useState, type ReactNode } from 'react';
import { Loader2, Mail, Lock, ArrowLeft, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Logo } from '../components/Brand';
import { navigate } from '../lib/router';
import { supabase } from '../lib/supabase';
import { toast } from '../components/Toast';

type Mode = 'login' | 'signup';

interface AuthPageProps {
  mode: Mode;
}

export function AuthPage({ mode }: AuthPageProps) {
  const isSignup = mode === 'signup';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function friendlyAuthError(err: unknown): string {
    const message = err instanceof Error ? err.message : String(err);
    if (/invalid credentials/i.test(message)) return 'Incorrect email or password.';
    if (/user already registered|already been registered/i.test(message)) return 'An account with this email already exists. Try logging in.';
    if (/password should be at least/i.test(message)) return 'Password must be at least 6 characters.';
    if (/unable to validate email/i.test(message)) return 'Please enter a valid email address.';
    if (/rate limit/i.test(message)) return 'Too many attempts. Please wait a moment and try again.';
    return message;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (isSignup && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signUpError) throw signUpError;
        // Email confirmation is OFF, so a session is returned immediately.
        toast('success', 'Account created. Welcome to ClipForge AI.');
        navigate('/dashboard');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
        toast('success', 'Welcome back.');
        navigate('/dashboard');
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/#dashboard`,
        },
      });
      if (oauthError) throw oauthError;
      // OAuth redirects the browser, so loading state resolves on return.
    } catch (err) {
      setGoogleLoading(false);
      setError(friendlyAuthError(err));
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-950">
      <div className="absolute inset-0 bg-grid-faint bg-grid opacity-50 [mask-image:radial-gradient(70%_60%_at_50%_20%,black,transparent)]" />
      <div className="absolute inset-0 bg-radial-fade" />

      <div className="relative flex min-h-screen flex-col">
        <div className="container-page flex h-16 items-center justify-between">
          <button onClick={() => navigate('/')} className="transition hover:opacity-80">
            <Logo size="sm" />
          </button>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={15} /> Back home
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-10">
          <div className="w-full max-w-md animate-fade-up">
            <div className="card-base p-7 shadow-card sm:p-9">
              <div className="mb-7 text-center">
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                  {isSignup ? 'Create your account' : 'Welcome back'}
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                  {isSignup
                    ? 'Start turning long videos into viral shorts.'
                    : 'Sign in to access your ClipForge dashboard.'}
                </p>
              </div>

              <GoogleButton onClick={handleGoogle} loading={googleLoading} />

              <Divider />

              <form onSubmit={handleSubmit} className="space-y-4">
                <Field
                  icon={<Mail size={16} />}
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                <div>
                  <Field
                    icon={<Lock size={16} />}
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={setPassword}
                    placeholder={isSignup ? 'At least 6 characters' : 'Your password'}
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    trailing={
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="rounded-md p-1 text-slate-500 transition hover:text-slate-300"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    }
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300 animate-fade-in">
                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {isSignup ? 'Creating account…' : 'Signing in…'}
                    </>
                  ) : isSignup ? (
                    'Create account'
                  ) : (
                    'Sign in'
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-400">
                {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  onClick={() => navigate(isSignup ? '/login' : '/signup')}
                  className="font-medium text-accent-400 transition hover:text-accent-300"
                >
                  {isSignup ? 'Sign in' : 'Sign up free'}
                </button>
              </p>
            </div>

            <p className="mt-5 text-center text-xs text-slate-600">
              By continuing you agree to our Terms and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="btn-ghost w-full justify-center py-3 disabled:opacity-50"
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden>
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92a8.78 8.78 0 0 0 2.68-6.61z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18z"
          />
          <path
            fill="#FBBC05"
            d="M3.97 10.71A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.29-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
          />
        </svg>
      )}
      Continue with Google
    </button>
  );
}

function Divider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <div className="h-px flex-1 bg-white/[0.06]" />
      <span className="text-xs text-slate-600">or</span>
      <div className="h-px flex-1 bg-white/[0.06]" />
    </div>
  );
}

interface FieldProps {
  icon: ReactNode;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  trailing?: ReactNode;
}

function Field({ icon, label, type, value, onChange, placeholder, autoComplete, trailing }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-400">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="input-field pl-10 pr-10"
        />
        {trailing && <span className="absolute right-3 top-1/2 -translate-y-1/2">{trailing}</span>}
      </div>
    </label>
  );
}
