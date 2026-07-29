import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ClipJob {
  id: string;
  user_id: string;
  source_type: "youtube" | "upload";
  source_url?: string;
  source_label: string;
  status: "processing" | "completed" | "failed";
  progress: number;
  clips?: Clip[];
}

interface Clip {
  id: string;
  title: string;
  hook: string;
  start_seconds: number;
  end_seconds: number;
  duration_seconds: number;
  score: number;
  thumbnail_url: string;
  preview_url: string;
  platform: string;
  transcript_excerpt: string;
}

interface JobRow {
  id: string;
  user_id: string;
  source_type: string;
  source_url: string | null;
  source_label: string;
  status: string;
  progress: number;
  clips: Clip[] | null;
}

// Curated hook templates ranked by viral potential — these model the
// "top 5-10 best hook-based short clips" the product would surface.
const HOOK_TEMPLATES: Array<{
  hook: string;
  title: string;
  platform: string;
  scoreRange: [number, number];
}> = [
  { hook: "Nobody talks about this, but...", title: "The Hidden Truth About Success", platform: "YouTube Shorts", scoreRange: [92, 98] },
  { hook: "Here's what happened when I tried this for 30 days", title: "30-Day Challenge Results", platform: "Instagram Reels", scoreRange: [88, 95] },
  { hook: "This one mistake is costing you thousands", title: "The Costly Mistake You're Making", platform: "YouTube Shorts", scoreRange: [85, 93] },
  { hook: "I was wrong about this the entire time", title: "A Confession That Changed Everything", platform: "Vyro", scoreRange: [82, 91] },
  { hook: "Stop doing this if you want to grow", title: "The Growth Killer You Ignore", platform: "Instagram Reels", scoreRange: [80, 89] },
  { hook: "This took me 5 years to learn", title: "5 Years of Hard Lessons in 60 Seconds", platform: "YouTube Shorts", scoreRange: [78, 88] },
  { hook: "The secret nobody shares about momentum", title: "Momentum: The Untold Secret", platform: "Vyro", scoreRange: [76, 86] },
  { hook: "Watch this before your next big decision", title: "Before You Decide, Watch This", platform: "Instagram Reels", scoreRange: [73, 84] },
  { hook: "This changes how you think about time", title: "Rethinking Time: A Quick Shift", platform: "YouTube Shorts", scoreRange: [70, 82] },
  { hook: "The 3-second rule that changed my life", title: "The 3-Second Rule Explained", platform: "Vyro", scoreRange: [68, 80] },
];

const THUMBNAIL_SEEDS = [
  "clip01", "clip02", "clip03", "clip04", "clip05",
  "clip06", "clip07", "clip08", "clip09", "clip10",
];

const TRANSCRIPT_EXCERPTS = [
  "So I started noticing a pattern that nobody else seemed to catch...",
  "And that's when everything clicked into place for the first time.",
  "The numbers don't lie, but most people read them wrong.",
  "Here's the part everyone skips, and it's the most important bit.",
  "I remember thinking this would never work, until it did.",
  "What if I told you the opposite is actually true?",
  "Let me break it down in a way that finally makes sense.",
  "This is the moment everything shifted for me.",
  "Pay close attention here, because this is where it gets good.",
  "And just like that, the whole approach changed.",
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /[?&]v=([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function generateClips(job: JobRow): Clip[] {
  // Pick between 5 and 10 hook templates, sorted by score descending.
  const count = randInt(5, 10);
  const chosen = pick(HOOK_TEMPLATES, count);
  const totalDuration = 600 + randInt(0, 2400); // simulated source length

  const clips: Clip[] = chosen.map((tpl, i) => {
    const duration = randInt(18, 60);
    const start = Math.min(
      totalDuration - duration,
      Math.floor((totalDuration / (count + 1)) * (i + 1)) + randInt(-30, 30)
    );
    const safeStart = Math.max(0, start);
    const score = randInt(tpl.scoreRange[0], tpl.scoreRange[1]);
    const ytId = job.source_type === "youtube" && job.source_url
      ? extractYouTubeId(job.source_url)
      : null;
    const thumbnailUrl = ytId
      ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
      : `https://picsum.photos/seed/${THUMBNAIL_SEEDS[i]}/640/360`;
    const previewUrl = ytId
      ? `https://www.youtube.com/embed/${ytId}?start=${safeStart}&end=${safeStart + duration}&autoplay=1`
      : `https://picsum.photos/seed/${THUMBNAIL_SEEDS[i]}/640/360`;

    return {
      id: `${job.id}-${i}`,
      title: tpl.title,
      hook: tpl.hook,
      start_seconds: safeStart,
      end_seconds: safeStart + duration,
      duration_seconds: duration,
      score,
      thumbnail_url: thumbnailUrl,
      preview_url: previewUrl,
      platform: tpl.platform,
      transcript_excerpt: TRANSCRIPT_EXCERPTS[i % TRANSCRIPT_EXCERPTS.length],
    };
  });

  return clips.sort((a, b) => b.score - a.score);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") as string;

    // Client scoped to the calling user (uses their JWT) for RLS-protected writes.
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { source_type, source_url, source_label } = body as {
      source_type: "youtube" | "upload";
      source_url?: string;
      source_label?: string;
    };

    if (!source_type || !["youtube", "upload"].includes(source_type)) {
      return new Response(
        JSON.stringify({ error: "Invalid source_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (source_type === "youtube" && !source_url) {
      return new Response(
        JSON.stringify({ error: "source_url is required for youtube source_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const label = source_label?.trim() || (source_type === "youtube" ? source_url! : "Uploaded video");

    // Create the job row at 0% via the user-scoped client (RLS: user owns row).
    const { data: jobRow, error: insertError } = await userClient
      .from("clip_jobs")
      .insert({
        user_id: user.id,
        source_type,
        source_url: source_url || null,
        source_label: label,
        status: "processing",
        progress: 0,
      })
      .select("*")
      .single();

    if (insertError || !jobRow) {
      return new Response(
        JSON.stringify({ error: "Failed to create clip job", details: insertError?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Simulate analysis latency so the frontend progress bar is meaningful.
    const steps = [15, 32, 48, 65, 80, 94];
    for (const pct of steps) {
      await new Promise((r) => setTimeout(r, 700));
      await userClient
        .from("clip_jobs")
        .update({ progress: pct })
        .eq("id", jobRow.id);
    }

    const clips = generateClips(jobRow as JobRow);

    const { error: finalError } = await userClient
      .from("clip_jobs")
      .update({ status: "completed", progress: 100, clips })
      .eq("id", jobRow.id);

    if (finalError) {
      return new Response(
        JSON.stringify({ error: "Failed to finalize clip job", details: finalError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Bump the user's monthly usage counter (service role bypasses RLS safely here).
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    await adminClient.rpc("increment_clip_usage", { p_user_id: user.id }).catch(() => {});

    return new Response(
      JSON.stringify({ job_id: jobRow.id, clips }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
