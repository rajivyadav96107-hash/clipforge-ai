/*
# Add increment_clip_usage function

## Summary
Adds a SECURITY DEFINER stored function that safely increments a user's
monthly clip usage counter and auto-resets it when a new month begins.
Called by the generate-clips edge function after a job completes.

## Function
### public.increment_clip_usage(p_user_id uuid) -> void
- If month_reset_at is older than 30 days, resets clips_used_this_month
  to 1 and bumps month_reset_at to now().
- Otherwise increments clips_used_this_month by 1.
- No return value.

## Security
- SECURITY DEFINER so the edge function (service role) can call it.
- Only acts on the row matching the supplied p_user_id.
*/

CREATE OR REPLACE FUNCTION public.increment_clip_usage(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    clips_used_this_month = CASE
      WHEN month_reset_at < now() - interval '30 days' THEN 1
      ELSE clips_used_this_month + 1
    END,
    month_reset_at = CASE
      WHEN month_reset_at < now() - interval '30 days' THEN now()
      ELSE month_reset_at
    END
  WHERE id = p_user_id;
END;
$$;
