"use client";
import { base } from "viem/chains";
import { useName } from "@coinbase/onchainkit/identity";
import { avatarGradient } from "../../lib/avatar";
import { shortAddr } from "../../lib/format";
import { FONT_MONO } from "../../lib/theme";

export function Avatar({ address, size = 36 }: { address: string; size?: number }) {
  return (
    <span aria-hidden style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, display: "inline-block",
      background: avatarGradient(address), boxShadow: "inset 0 0 0 1px rgba(255,255,255,.25)" }} />
  );
}

// Basename / ENS when the wallet has one, short address otherwise.
export function DisplayName({ address, mono = true }: { address: string; mono?: boolean }) {
  const valid = /^0x[0-9a-fA-F]{40}$/.test(address);
  const { data } = useName({ address: valid ? (address as `0x${string}`) : undefined, chain: base });
  if (data) return <span>{data}</span>;
  return <span style={mono ? { fontFamily: FONT_MONO, fontSize: "0.92em" } : undefined}>{shortAddr(address)}</span>;
}
