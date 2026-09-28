-- Backfill the three drops that exist on-chain (escrow 0x6077…AcfE) but were never
-- recorded in Supabase. Values read from getDropInfo on Base. Creation tx hashes
-- aren't known, so tx_hash uses a 'backfill-<id>' marker. Safe to re-run.
insert into drops (onchain_id, creator_address, amount_per_claim, total_claims, claimed_count, expires_at, message, tx_hash)
select * from (values
  (0::bigint, '0xd3467e00f6d7275c74e60fc7a1e5ed526893b29f', 0.01::numeric, 2,  0, '2026-06-04T22:39:29Z'::timestamptz, null::text,  'backfill-0'),
  (1::bigint, '0xd3467e00f6d7275c74e60fc7a1e5ed526893b29f', 0.01::numeric, 2,  1, '2026-06-08T15:34:53Z'::timestamptz, 'test drop', 'backfill-1'),
  (2::bigint, '0xd3467e00f6d7275c74e60fc7a1e5ed526893b29f', 0.10::numeric, 10, 1, '2026-06-18T20:35:55Z'::timestamptz, null::text,  'backfill-2')
) as v(onchain_id, creator_address, amount_per_claim, total_claims, claimed_count, expires_at, message, tx_hash)
where not exists (select 1 from drops d where d.onchain_id = v.onchain_id);
