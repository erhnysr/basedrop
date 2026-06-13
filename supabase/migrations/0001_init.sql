-- Drops created by users
create table if not exists drops (
  id bigint generated always as identity primary key,
  creator_address text not null,
  amount_per_claim numeric not null,
  total_claims integer not null,
  claimed_count integer not null default 0,
  expires_at timestamptz not null,
  message text,
  tx_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists drops_creator_address_idx on drops (creator_address);
create index if not exists drops_created_at_idx on drops (created_at desc);

-- Claims made against drops
create table if not exists claims (
  id bigint generated always as identity primary key,
  drop_id bigint not null references drops (id) on delete cascade,
  claimer_address text not null,
  tx_hash text not null,
  claimed_at timestamptz not null default now()
);

create index if not exists claims_drop_id_idx on claims (drop_id);
create index if not exists claims_claimer_address_idx on claims (claimer_address);

-- Increments the claimed_count on a drop when a new claim is recorded
create or replace function increment_claimed_count(drop_id_input bigint)
returns void as $$
  update drops set claimed_count = claimed_count + 1 where id = drop_id_input;
$$ language sql;

-- Top creators by total amount dropped
create or replace view leaderboard_creators as
select
  creator_address,
  sum(amount_per_claim * claimed_count) as total_dropped,
  count(*) as drop_count
from drops
group by creator_address
order by total_dropped desc;

-- Top claimers by total amount claimed
create or replace view leaderboard_claimers as
select
  c.claimer_address,
  sum(d.amount_per_claim) as total_claimed,
  count(*) as claim_count
from claims c
join drops d on d.id = c.drop_id
group by c.claimer_address
order by total_claimed desc;
