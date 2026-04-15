import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

const PIECE_MAP: Record<string, string> = {
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
};

function parseFen(fen: string): (string | null)[][] {
  const rows = fen.split(" ")[0].split("/");
  return rows.map((row) => {
    const squares: (string | null)[] = [];
    for (const ch of row) {
      if (/\d/.test(ch)) {
        for (let i = 0; i < parseInt(ch); i++) squares.push(null);
      } else {
        squares.push(ch);
      }
    }
    return squares;
  });
}

interface ChessBoardProps {
  fen: string;
  selectedSquare: string | null;
  onSquareClick: (square: string) => void;
  lastMove?: { from: string; to: string } | null;
  disabled?: boolean;
}

export function ChessBoard({ fen, selectedSquare, onSquareClick, lastMove, disabled }: ChessBoardProps) {
  const board = parseFen(fen);
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

  return (
    <div className="w-full aspect-square max-w-[360px] mx-auto">
      <div className="grid grid-cols-8 rounded-xl overflow-hidden border border-border shadow-card">
        {board.map((row, ri) =>
          row.map((piece, ci) => {
            const square = `${files[ci]}${8 - ri}`;
            const isLight = (ri + ci) % 2 === 0;
            const isSelected = selectedSquare === square;
            const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square);

            return (
              <button
                key={square}
                disabled={disabled}
                onClick={() => onSquareClick(square)}
                className={cn(
                  "aspect-square flex items-center justify-center text-2xl sm:text-3xl transition-all min-h-[44px]",
                  isLight
                    ? "bg-emerald-dim/30"
                    : "bg-surface-2",
                  isSelected && "ring-2 ring-primary ring-inset bg-primary/25",
                  isLastMove && !isSelected && "bg-primary/10",
                  disabled && "cursor-default"
                )}
                style={{ fontSize: "clamp(1.5rem, 4.5vw, 2.25rem)" }}
              >
                {piece ? PIECE_MAP[piece] || "" : ""}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
