"use client";
import { useAccount, useConnect } from "wagmi";
import { coinbaseWallet } from "wagmi/connectors";
import { Transaction, TransactionButton, TransactionStatus, TransactionStatusLabel } from "@coinbase/onchainkit/transaction";
import { USDC_ADDRESS, USDC_ABI, usdcAmount } from "../usdc";

interface ClaimButtonProps {
  recipientAddress: `0x${string}`;
  amountDollars: number;
  onSuccess: () => void;
}

const btnStyle = {
  background: "#111",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "10px 14px",
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap" as const,
  display: "block",

};

export function ClaimButton({ recipientAddress, amountDollars, onSuccess }: ClaimButtonProps) {
  const { isConnected } = useAccount();
  const { connect } = useConnect();

  const calls = [{
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "transfer" as const,
    args: [recipientAddress, usdcAmount(amountDollars)] as const,
  }];

  if (!isConnected) {
    return (
      <button
        style={btnStyle}
        onClick={() => connect({ connector: coinbaseWallet({ preference: "smartWalletOnly" }) })}
      >
        Claim 💧
      </button>
    );
  }

  return (
    <Transaction
      chainId={8453}
      calls={calls}
      onStatus={(status) => {
        if (status.statusName === "success") onSuccess();
      }}
    >
      <TransactionButton text={`Claim $${amountDollars} 💧`} />
      <TransactionStatus>
        <TransactionStatusLabel />
      </TransactionStatus>
    </Transaction>
  );
}
