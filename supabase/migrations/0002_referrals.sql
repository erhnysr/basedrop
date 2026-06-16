create table if not exists referrals (
  id bigint generated always as identity primary key,
  referrer_address text not null,
  referee_address  text not null,
  drop_id          integer not null,
  points           integer not null default 1,
  created_at       timestamptz not null default now(),
  -- one referral credit per (referrer, referee, drop)
  unique (referrer_address, referee_address, drop_id)
);

create index if not exists referrals_referrer_idx on referrals (referrer_address);
create index if not exists referrals_referee_idx  on referrals (referee_address);

-- Referral leaderboard
create or replace view leaderboard_referrals as
select
  referrer_address,
  sum(points)  as total_points,
  count(*)     as referral_count
from referrals
group by referrer_address
order by total_points desc;
