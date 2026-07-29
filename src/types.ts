export type Plan = 'free' | 'pro';

export interface Profile {
  id: string;
  email: string | null;
  plan: Plan;
  clips_used_this_month: number;
  month_reset_at: string;
  stripe_customer_id: string | null;
  created_at: string;
}

export type SourceType = 'youtube' | 'upload';
export type JobStatus = 'processing' | 'completed' | 'failed';

export interface Clip {
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

export interface ClipJob {
  id: string;
  user_id: string;
  source_type: SourceType;
  source_url: string | null;
  source_label: string;
  status: JobStatus;
  progress: number;
  clips: Clip[] | null;
  created_at: string;
}

export const FREE_PLAN_CLIP_LIMIT = 5;
