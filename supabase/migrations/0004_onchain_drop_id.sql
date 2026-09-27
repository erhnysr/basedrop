-- Link Supabase drop rows to their on-chain escrow drop id.
-- Before this, /api/claims wrote the on-chain id into claims.drop_id, which
-- references drops.id (a separate Supabase identity), so claims either failed
-- the foreign key or attached to the wrong drop. Safe to re-run.

alter table drops add column if not exists onchain_id bigint;

create unique index if not exists drops_onchain_id_idx
  on drops (onchain_id)
  where onchain_id is not null;

-- Addresses are now stored lowercase; normalise existing rows so leaderboard
-- views don't split one wallet into two entries by letter case.
update drops  set creator_address = lower(creator_address) where creator_address <> lower(creator_address);
update claims set claimer_address = lower(claimer_address) where claimer_address <> lower(claimer_address);
