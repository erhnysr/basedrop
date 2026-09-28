-- Lock the tables to the server. Run this ONLY after SUPABASE_SERVICE_ROLE_KEY is set
-- in Vercel (and .env) and that deploy is live — the API routes switch to the
-- service-role key automatically, which bypasses RLS. Without the key, writes stop.
alter table drops     enable row level security;
alter table claims    enable row level security;
alter table tips      enable row level security;
alter table referrals enable row level security;

-- No policies = the public anon key can neither read nor write these tables directly.
-- The claimed-count helper is callable by the server only.
revoke execute on function increment_claimed_count(bigint) from anon, authenticated, public;
