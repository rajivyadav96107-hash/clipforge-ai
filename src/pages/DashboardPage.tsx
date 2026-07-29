import { useEffect, useState } from 'react';
import {
  Loader2,
  Youtube,
  Upload,
  Wand2,
  Play,
  Download,
  Clock,
  Gauge,
  Sparkles,
  Crown,
  LogOut,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Film,
  Quote,
  X,
} from 'lucide-react';
import { NavBar } from '../components/Brand';
import { Modal } from '../components/Modal';
import { UpgradeModal } from '../components/UpgradeModal';
import { toast } from '../components/Toast';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { navigate } from '../lib/router';
import { formatDuration, formatTimestamp, isYouTubeUrl, relativeTime } from '../lib/format';
import { FREE_PLAN_CLIP_LIMIT, type Clip, type ClipJob, type SourceType } from '../types';

const GENERATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-clips`;

type Tab = 'youtube' | 'upload';

export function DashboardPage() {
  const { user, profile, loading, plan, signOut, refreshProfile } = useAuth();
  const [tab, setTab] = useState<Tab>('youtube');
  const [url, setUrl] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [job, setJob] = useState<ClipJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [previewClip, setPreviewClip] = useState<Clip | null>(null);

  // Redirect unauthenticated users to login once auth finishes loading.
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [loading, user]);

  // Handle ?upgrade=success / cancelled feedback from Stripe redirect.
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.split('?')[1] ?? '');
    const upgrade = params.get('upgrade');
    if (upgrade === 'success') {
      toast('success', 'Payment received — upgrading your plan.');
      refreshProfile();
    } else if (upgrade === 'cancelled') {
      toast('info', 'Checkout was cancelled. You can upgrade anytime.');
    }
    if (upgrade) {
      const cleanHash = hash.split('?')[0];
      window.history.replaceState(null, '', cleanHash);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clips: Clip[] = job?.clips ?? [];
  const clipsUsed = profile?.clips_used_this_month ?? 0;
  const isFree = plan === 'free';
  const isPro = plan === 'pro';
  const reachedFreeLimit = isFree && clipsUsed >= FREE_PLAN_CLIP_LIMIT;

  function validateInput(): { ok: boolean; message?: string } {
    if (tab === 'youtube') {
      if (!url.trim()) return { ok: false, message: 'Paste a YouTube video link to continue.' };
      if (!isYouTubeUrl(url.trim())) return { ok: false, message: 'That doesn\'t look like a YouTube link.' };
      return { ok: true };
    }
    if (!fileName) return { ok: false, message: 'Choose a video file to upload.' };
    if (!isPro) {
      return { ok: false, message: 'Video uploads are a Pro feature. Upgrade to upload files.' };
    }
    return { ok: true };
  }

  async function pollProgress(jobId: string) {
    let ticks = 0;
    const interval = setInterval(async () => {
      ticks += 1;
      try {
        const { data, error: pollError } = await supabase
          .from('clip_jobs')
          .select('*')
          .eq('id', jobId)
          .maybeSingle();
        if (pollError || !data) {
          if (ticks > 40) {
            clearInterval(interval);
          }
          return;
        }
        const current = data as ClipJob;
        setProgress(current.progress);
        if (current.status === 'completed') {
          clearInterval(interval);
          setJob(current);
          setProcessing(false);
          setStatusText('Done');
          setProgress(100);
          toast('success', `Generated ${current.clips?.length ?? 0} clips.`);
          refreshProfile();
        } else if (current.status === 'failed') {
          clearInterval(interval);
          setProcessing(false);
          setError('Processing failed. Please try again.');
        }
      } catch {
        if (ticks > 40) clearInterval(interval);
      }
    }, 900);
  }

  async function handleGenerate() {
    setError(null);
    const validation = validateInput();
    if (!validation.ok) {
      setError(validation.message ?? 'Invalid input.');
      return;
    }
    if (reachedFreeLimit) {
      setUpgradeOpen(true);
      return;
    }

    setProcessing(true);
    setProgress(2);
    setStatusText('Starting analysis…');
    setJob(null);

    // Optimistically animate the progress bar while the edge function runs.
    const optimistic = setInterval(() => {
      setProgress((p) => {
        if (p >= 92) return p;
        return p + Math.max(1, Math.round((92 - p) * 0.06));
      });
      setStatusText((s) => {
        if (s.startsWith('Starting')) return 'Analyzing transcript…';
        if (s.startsWith('Analyzing')) return 'Detecting hooks…';
        if (s.startsWith('Detecting')) return 'Scoring moments…';
        return 'Scoring moments…';
      });
    }, 700);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        throw new Error('Your session has expired. Please sign in again.');
      }

      const payload: { source_type: SourceType; source_url?: string; source_label?: string } = {
        source_type: tab,
        source_label: tab === 'youtube' ? url.trim() : fileName ?? 'Uploaded video',
      };
      if (tab === 'youtube') payload.source_url = url.trim();

      const res = await fetch(GENERATE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Generation failed (${res.status})`);
      }

      const data = await res.json();
      clearInterval(optimistic);
      setProgress(98);

      // Fetch the finalized job row so we render the authoritative clips.
      const { data: jobRow, error: jobError } = await supabase
        .from('clip_jobs')
        .select('*')
        .eq('id', data.job_id)
        .maybeSingle();

      if (jobError || !jobRow) {
        // Fall back to polling if the row isn't immediately readable.
        pollProgress(data.job_id);
        return;
      }

      const finalJob = jobRow as ClipJob;
      if (finalJob.status === 'completed') {
        setJob(finalJob);
        setProgress(100);
        setStatusText('Done');
        setProcessing(false);
        toast('success', `Generated ${finalJob.clips?.length ?? 0} clips.`);
        refreshProfile();
      } else {
        setJob(finalJob);
        pollProgress(data.job_id);
      }
    } catch (err) {
      clearInterval(optimistic);
      setProcessing(false);
      setProgress(0);
      setStatusText('');
      const message = err instanceof Error ? err.message : 'Generation failed.';
      setError(message);
      toast('error', message);
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setFileName(null);
      return;
    }
    setFileName(file.name);
  }

  function resetInput() {
    setUrl('');
    setFileName(null);
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink-950">
        <Loader2 size={28} className="animate-spin text-accent-400" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-ink-950">
      <NavBar />

      <main className="container-page py-8 sm:py-10">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Your clip studio
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Paste a YouTube link or upload a video — we'll find the best hooks.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PlanBadge plan={plan} />
            <button onClick={() => setUpgradeOpen(true)} className="btn-ghost py-2 text-xs">
              <Crown size={13} className="text-gold-400" /> {isPro ? 'Manage plan' : 'Upgrade'}
            </button>
            <button
              onClick={() => {
                signOut();
                navigate('/');
              }}
              className="btn-ghost py-2 text-xs"
              aria-label="Sign out"
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>

        {/* Usage banner for Free users */}
        {isFree && (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-ink-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <Sparkles size={16} className="text-accent-400" />
              <span>
                <span className="font-medium text-white">{Math.max(0, FREE_PLAN_CLIP_LIMIT - clipsUsed)}</span> of{' '}
                {FREE_PLAN_CLIP_LIMIT} free clips remaining this month
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-32 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent-400 to-accent-600 transition-all duration-500"
                  style={{ width: `${Math.min(100, (clipsUsed / FREE_PLAN_CLIP_LIMIT) * 100)}%` }}
                />
              </div>
              <button onClick={() => setUpgradeOpen(true)} className="text-xs font-medium text-accent-400 transition hover:text-accent-300">
                Upgrade →
              </button>
            </div>
          </div>
        )}

        {/* Input card */}
        <div className="mt-6 card-base p-5 sm:p-6">
          <div className="mb-5 flex gap-2 rounded-2xl bg-ink-900/60 p-1">
            <TabButton active={tab === 'youtube'} onClick={() => setTab('youtube')} icon={<Youtube size={15} />}>
              YouTube link
            </TabButton>
            <TabButton
              active={tab === 'upload'}
              onClick={() => setTab('upload')}
              icon={<Upload size={15} />}
              disabled={isFree}
              badge={!isPro ? 'Pro' : undefined}
            >
              Upload video
            </TabButton>
          </div>

          {tab === 'youtube' ? (
            <div className="relative">
              <Youtube size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=…"
                className="input-field pl-12"
                disabled={processing}
              />
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-ink-900/40 px-6 py-10 text-center transition hover:border-accent-500/40 hover:bg-ink-900/70">
              <Upload size={22} className="text-accent-400" />
              <span className="mt-3 text-sm font-medium text-slate-200">
                {fileName ? fileName : 'Click to choose a video file'}
              </span>
              <span className="mt-1 text-xs text-slate-500">
                {fileName ? 'Ready to generate' : 'MP4, MOV, or WebM up to 500 MB'}
              </span>
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFile}
                disabled={processing}
              />
            </label>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300 animate-fade-in">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {tab === 'youtube'
                ? 'We\'ll analyze the video and surface the top hooks.'
                : isPro
                ? 'Your upload stays private to your account.'
                : 'Uploads are available on the Pro plan.'}
            </p>
            <div className="flex gap-2">
              {(url || fileName) && !processing && (
                <button onClick={resetInput} className="btn-ghost py-2.5 text-xs">
                  <X size={13} /> Clear
                </button>
              )}
              <button
                onClick={handleGenerate}
                disabled={processing || (tab === 'youtube' ? !url.trim() : !fileName)}
                className="btn-primary py-2.5"
              >
                {processing ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Generating…
                  </>
                ) : (
                  <>
                    <Wand2 size={15} /> Generate Clips
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress bar */}
          {processing && (
            <div className="mt-5 animate-fade-in">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-2">
                  <Loader2 size={13} className="animate-spin text-accent-400" />
                  {statusText || 'Processing…'}
                </span>
                <span className="tabular-nums">{Math.min(100, Math.round(progress))}%</span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent-400 to-accent-600 transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {job && !processing && (
          <div className="mt-10 animate-fade-up">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {clips.length} clips generated
                </h2>
                <p className="text-sm text-slate-400">
                  Ranked by virality score · from{' '}
                  <span className="text-slate-300">{job.source_label}</span> · {relativeTime(job.created_at)}
                </p>
              </div>
              <span className="chip">
                <CheckCircle2 size={12} className="text-accent-400" />
                Completed
              </span>
            </div>

            {clips.length === 0 ? (
              <div className="card-base p-10 text-center">
                <Film size={28} className="mx-auto text-slate-500" />
                <p className="mt-3 text-sm text-slate-400">No clips were generated. Try another video.</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {clips.map((clip, i) => (
                  <ClipCard
                    key={clip.id}
                    clip={clip}
                    rank={i + 1}
                    onPreview={() => setPreviewClip(clip)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!job && !processing && (
          <div className="mt-10 card-base p-12 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent-500/10 text-accent-400">
              <Wand2 size={24} />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-white">No clips yet</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">
              Paste a YouTube link above and click <span className="text-slate-200">Generate Clips</span> to see your top viral moments here.
            </p>
          </div>
        )}
      </main>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <PreviewModal clip={previewClip} onClose={() => setPreviewClip(null)} />
    </div>
  );
}

function PlanBadge({ plan }: { plan: 'free' | 'pro' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
        plan === 'pro'
          ? 'border-gold-400/30 bg-gold-400/10 text-gold-400'
          : 'border-white/10 bg-white/[0.04] text-slate-300'
      }`}
    >
      {plan === 'pro' ? <Crown size={12} /> : <Sparkles size={12} className="text-accent-400" />}
      {plan === 'pro' ? 'Pro' : 'Free'} plan
    </span>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
  disabled,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition ${
        active
          ? 'bg-ink-850 text-white shadow-soft'
          : 'text-slate-400 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50'
      }`}
    >
      {icon}
      {children}
      {badge && (
        <span className="rounded-full bg-gold-400/15 px-1.5 py-0.5 text-[10px] font-semibold text-gold-400">
          {badge}
        </span>
      )}
    </button>
  );
}

function ClipCard({ clip, rank, onPreview }: { clip: Clip; rank: number; onPreview: () => void }) {
  const [downloading, setDownloading] = useState(false);

  function handleDownload() {
    setDownloading(true);
    // MVP: downloads a metadata file describing the clip. A full impl would
    // render and stream the trimmed video; this keeps the demo self-contained.
    const blob = new Blob(
      [
        JSON.stringify(
          {
            title: clip.title,
            hook: clip.hook,
            platform: clip.platform,
            start_seconds: clip.start_seconds,
            end_seconds: clip.end_seconds,
            duration_seconds: clip.duration_seconds,
            virality_score: clip.score,
            transcript_excerpt: clip.transcript_excerpt,
            preview_url: clip.preview_url,
          },
          null,
          2
        ),
      ],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clipforge-${rank}-${clip.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setTimeout(() => setDownloading(false), 600);
  }

  const scoreColor =
    clip.score >= 90 ? 'text-accent-400' : clip.score >= 80 ? 'text-sky-accent' : 'text-gold-400';

  return (
    <div className="group card-base overflow-hidden transition hover:border-accent-500/20 hover:shadow-soft">
      <div className="relative aspect-video overflow-hidden bg-ink-900">
        <img
          src={clip.thumbnail_url}
          alt={clip.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = `https://picsum.photos/seed/${clip.id}/640/360`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <span className="rounded-full bg-ink-950/80 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">
            #{rank}
          </span>
          <span className="rounded-full bg-ink-950/80 px-2 py-1 text-[10px] font-medium text-slate-200 backdrop-blur">
            {clip.platform}
          </span>
        </div>
        <button
          onClick={onPreview}
          className="absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100"
          aria-label="Preview clip"
        >
          <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-500/90 text-ink-950 shadow-glow transition hover:scale-110">
            <Play size={20} className="ml-0.5" fill="currentColor" />
          </span>
        </button>
        <div className="absolute bottom-3 right-3 rounded-full bg-ink-950/80 px-2 py-1 text-[10px] font-medium text-slate-200 backdrop-blur">
          {formatDuration(clip.duration_seconds)}
        </div>
      </div>

      <div className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${scoreColor}`}>
            <TrendingUp size={13} /> {clip.score}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
            <Clock size={11} /> {formatTimestamp(clip.start_seconds)}–{formatTimestamp(clip.end_seconds)}
          </span>
        </div>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white">{clip.title}</h3>
        <p className="mt-1.5 flex items-start gap-1.5 text-xs italic leading-relaxed text-slate-400">
          <Quote size={12} className="mt-0.5 shrink-0 text-accent-400/70" />
          {clip.hook}
        </p>

        <div className="mt-4 flex items-center gap-2">
          <button onClick={onPreview} className="btn-ghost flex-1 py-2 text-xs">
            <Play size={12} /> Preview
          </button>
          <button onClick={handleDownload} disabled={downloading} className="btn-primary flex-1 py-2 text-xs">
            {downloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            Download
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewModal({ clip, onClose }: { clip: Clip | null; onClose: () => void }) {
  const isYouTubeEmbed = clip?.preview_url?.includes('youtube.com/embed');
  return (
    <Modal open={!!clip} onClose={onClose} title={clip?.title} maxWidth="max-w-2xl">
      {clip && (
        <div>
          <div className="mb-4 aspect-video overflow-hidden rounded-2xl border border-white/[0.06] bg-ink-900">
            {isYouTubeEmbed ? (
              <iframe
                src={clip.preview_url}
                title={clip.title}
                className="h-full w-full"
                allow="accelerated-procedures; autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="grid h-full place-items-center">
                <img src={clip.thumbnail_url} alt={clip.title} className="h-full w-full object-cover" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Stat icon={<Gauge size={14} />} label="Score" value={`${clip.score}`} accent />
            <Stat icon={<Clock size={14} />} label="Duration" value={formatDuration(clip.duration_seconds)} />
            <Stat icon={<Film size={14} />} label="Platform" value={clip.platform} />
          </div>

          <div className="mt-4 rounded-2xl border border-white/[0.06] bg-ink-900/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Hook</p>
            <p className="mt-1.5 text-sm italic text-slate-200">"{clip.hook}"</p>
            <p className="mt-3 text-xs font-medium uppercase tracking-wider text-slate-500">Excerpt</p>
            <p className="mt-1.5 text-sm text-slate-300">{clip.transcript_excerpt}</p>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-ink-900/60 p-3 text-center">
      <div className={`mx-auto mb-1 flex items-center justify-center gap-1 text-[11px] text-slate-500`}>
        {icon} {label}
      </div>
      <div className={`text-sm font-semibold ${accent ? 'text-accent-400' : 'text-white'}`}>{value}</div>
    </div>
  );
}
