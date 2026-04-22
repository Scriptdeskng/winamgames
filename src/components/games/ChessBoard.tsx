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
  hintFrom?: string | null;
  hintTo?: string | null;
  disabled?: boolean;
}

export function ChessBoard({ fen, selectedSquare, onSquareClick, lastMove, hintFrom, hintTo, disabled }: ChessBoardProps) {
  const board = parseFen(fen);
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

  return (
    <div className="w-full aspect-square max-w-[360px] mx-auto">
      <div className="grid grid-cols-8 border-2 border-emerald-900/50 rounded-lg overflow-hidden shadow-card">
        {board.map((row, ri) =>
          row.map((piece, ci) => {
            const square = `${files[ci]}${8 - ri}`;
            const isLight = (ri + ci) % 2 === 0;
            const isSelected = selectedSquare === square;
            const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square);
            const isHint = square === hintFrom || square === hintTo;
            const isWhitePiece = piece && piece === piece.toUpperCase();

            return (
              <button
                key={square}
                disabled={disabled}
                onClick={() => onSquareClick(square)}
                className={cn(
                  "aspect-square flex items-center justify-center text-3xl sm:text-4xl leading-none transition-all min-h-[44px]",
                  isWhitePiece ? "text-white drop-shadow-sm" : "text-gray-900",
                  isSelected && "ring-2 ring-primary ring-inset bg-primary/25",
                  isHint && !isSelected && "ring-2 ring-coin/70 ring-inset",
                  isLastMove && !isSelected && !isHint && "bg-primary/10",
                  disabled && "cursor-default"
                )}
                style={{
                  backgroundColor: isSelected
                    ? undefined
                    : isHint
                      ? undefined
                      : isLight
                        ? "#B8D4A8"
                        : "#4A7C59",
                }}
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
