"use client";
import { useEffect, useState } from "react";

const COLORS = ["#6366F1", "#7B61FF", "#10B981", "#FFD700", "#FF6B6B", "#FF9500", "#FF69B4", "#00BFFF"];

interface Piece {
  id: number;
  left: number;
  delay: number;
  color: string;
  w: number;
  h: number;
  dur: number;
  anim: string;
}

export function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!active) { setPieces([]); return; }
    setPieces(
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.9,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        w: 5 + Math.random() * 7,
        h: 5 + Math.random() * 7,
        dur: 2.2 + Math.random() * 1.4,
        anim: Math.random() > 0.5 ? "confetti-fall" : "confetti-drift",
      })),
    );
  }, [active]);

  if (!pieces.length) return null;

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 200 }}>
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: "fixed",
            top: 0,
            left: `${p.left}%`,
            width: p.w,
            height: p.h,
            borderRadius: 3,
            backgroundColor: p.color,
            animation: `${p.anim} ${p.dur}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg) scaleX(1); opacity: 1; }
          85%  { opacity: 0.9; }
          100% { transform: translateY(105vh) rotate(680deg) scaleX(0.4); opacity: 0; }
        }
        @keyframes confetti-drift {
          0%   { transform: translateY(-20px) rotate(0deg) scaleY(1); opacity: 1; }
          50%  { transform: translateY(50vh) rotate(320deg) scaleY(0.6); }
          100% { transform: translateY(105vh) rotate(680deg) scaleY(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
