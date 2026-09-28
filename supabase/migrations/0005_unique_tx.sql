-- One row per on-chain transaction. Older rows used the placeholder tx_hash
-- 'onchain', so only real hashes are constrained. Safe to re-run.
create unique index if not exists claims_tx_hash_uniq on claims (tx_hash) where tx_hash like '0x%';
create unique index if not exists drops_tx_hash_uniq  on drops  (tx_hash) where tx_hash like '0x%';
