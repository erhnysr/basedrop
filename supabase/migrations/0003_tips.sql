-- Tips table + leaderboard views.
-- NOTE: This schema is shared with the (now retired) tipping.base app, which
-- originally created it. Basedrop's tip feature reuses the same table/views in
-- the shared Supabase project. Statements are idempotent and safe to re-run.

create table if not exists tips (
  id bigint generated always as identity primary key,
  tipper_address text not null,
  recipient_address text not null,
  amount numeric not null,
  tx_hash text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists tips_tipper_address_idx on tips (tipper_address);
create index if not exists tips_recipient_address_idx on tips (recipient_address);
create index if not exists tips_created_at_idx on tips (created_at desc);

-- Top tippers by total amount sent
create or replace view leaderboard_tippers as
select
  tipper_address,
  sum(amount) as total_tipped,
  count(*) as tip_count
from tips
group by tipper_address
order by total_tipped desc;

-- Top recipients by total amount received
create or replace view leaderboard_recipients as
select
  recipient_address,
  sum(amount) as total_received,
  count(*) as tip_count
from tips
group by recipient_address
order by total_received desc;
