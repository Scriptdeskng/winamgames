"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PIECE_URL: Record<string, string> = {
  K: "https://lichess1.org/assets/piece/staunty/wK.svg",
  Q: "https://lichess1.org/assets/piece/staunty/wQ.svg",
  R: "https://lichess1.org/assets/piece/staunty/wR.svg",
  B: "https://lichess1.org/assets/piece/staunty/wB.svg",
  N: "https://lichess1.org/assets/piece/staunty/wN.svg",
  P: "https://lichess1.org/assets/piece/staunty/wP.svg",
  k: "https://lichess1.org/assets/piece/staunty/bK.svg",
  q: "https://lichess1.org/assets/piece/staunty/bQ.svg",
  r: "https://lichess1.org/assets/piece/staunty/bR.svg",
  b: "https://lichess1.org/assets/piece/staunty/bB.svg",
  n: "https://lichess1.org/assets/piece/staunty/bN.svg",
  p: "https://lichess1.org/assets/piece/staunty/bP.svg",
};

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

const PIECE_NAME: Record<string, string> = {
  K: "White king",
  Q: "White queen",
  R: "White rook",
  B: "White bishop",
  N: "White knight",
  P: "White pawn",
  k: "Black king",
  q: "Black queen",
  r: "Black rook",
  b: "Black bishop",
  n: "Black knight",
  p: "Black pawn",
};

function parseFen(fen: string): (string | null)[][] {
  const rows = fen.split(" ")[0].split("/");
  return rows.map((row) => {
    const squares: (string | null)[] = [];
    for (const ch of row) {
      if (/\d/.test(ch)) {
        for (let i = 0; i < Number(ch); i += 1) squares.push(null);
      } else {
        squares.push(ch);
      }
    }
    return squares;
  });
}

function getSquareOffset(from: string, to: string): { dx: number; dy: number } {
  const fromFile = FILES.indexOf(from[0] as (typeof FILES)[number]);
  const fromRank = 8 - Number(from[1]);
  const toFile = FILES.indexOf(to[0] as (typeof FILES)[number]);
  const toRank = 8 - Number(to[1]);
  return {
    dx: fromFile - toFile,
    dy: fromRank - toRank,
  };
}

function squareCenter(sq: string, size: number): { x: number; y: number } {
  const file = FILES.indexOf(sq[0] as (typeof FILES)[number]);
  const rank = 8 - Number(sq[1]);
  return { x: (file + 0.5) * size, y: (rank + 0.5) * size };
}

interface ChessBoardProps {
  fen: string;
  selectedSquare: string | null;
  onSquareClick: (square: string) => void;
  lastMove?: { from: string; to: string } | null;
  hintFrom?: string | null;
  hintTo?: string | null;
  disabled?: boolean;
  legalMoves?: Set<string>;
  committedMove?: { from: string; to: string } | null;
  arrowMove?: { from: string; to: string } | null;
  feedback?: "correct" | "incorrect" | null;
}

export function ChessBoard({
  fen,
  selectedSquare,
  onSquareClick,
  lastMove,
  hintFrom,
  hintTo,
  disabled,
  legalMoves,
  committedMove,
  arrowMove,
  feedback,
}: ChessBoardProps) {
  const board = parseFen(fen);

  const lastMoveKey = lastMove ? `${lastMove.from}-${lastMove.to}` : null;
  const prevKeyRef = useRef<string | null>(null);
  const [pulseKey, setPulseKey] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const [animatingMove, setAnimatingMove] = useState<{
    piece: string;
    fromSquare: string;
    toSquare: string;
  } | null>(null);

  useEffect(() => {
    if (lastMoveKey && lastMoveKey !== prevKeyRef.current) {
      prevKeyRef.current = lastMoveKey;
      setPulseKey((k) => k + 1);
    } else if (!lastMoveKey) {
      prevKeyRef.current = null;
    }
  }, [lastMoveKey]);

  useEffect(() => {
    if (!lastMove || pulseKey === 0) return;

    const b = parseFen(fen);
    const toFile = FILES.indexOf(lastMove.to[0] as (typeof FILES)[number]);
    const toRank = 8 - Number(lastMove.to[1]);
    const movedPiece = b[toRank]?.[toFile];
    if (!movedPiece) return;

    setAnimatingMove({
      piece: movedPiece,
      fromSquare: lastMove.from,
      toSquare: lastMove.to,
    });

    const timer = setTimeout(() => setAnimatingMove(null), 800);
    return () => clearTimeout(timer);
  }, [fen, lastMove, pulseKey]);

  const baseBoard = animatingMove
    ? board.map((row, ri) =>
        row.map((piece, ci) => {
          const sq = `${FILES[ci]}${8 - ri}`;
          return sq === animatingMove.fromSquare ? null : piece;
        }),
      )
    : board.map((row) => row.slice());

  const displayBoard = baseBoard.map((row) => row.slice());

  if (committedMove) {
    const fromFile = FILES.indexOf(committedMove.from[0] as (typeof FILES)[number]);
    const fromRank = 8 - Number(committedMove.from[1]);
    const toFile = FILES.indexOf(committedMove.to[0] as (typeof FILES)[number]);
    const toRank = 8 - Number(committedMove.to[1]);
    const movedPiece = board[fromRank]?.[fromFile];
    if (movedPiece && displayBoard[fromRank] && displayBoard[toRank]) {
      displayBoard[fromRank][fromFile] = null;
      displayBoard[toRank][toFile] = movedPiece;
    }
  }

  const squareSize = gridRef.current ? gridRef.current.offsetWidth / 8 : 0;
  const overlayPieces = squareSize > 0 && animatingMove;

  let overlay: ReactNode = null;
  if (overlayPieces) {
    const { dx, dy } = getSquareOffset(animatingMove.fromSquare, animatingMove.toSquare);
    const toFile = FILES.indexOf(animatingMove.toSquare[0] as (typeof FILES)[number]);
    const toRank = 8 - Number(animatingMove.toSquare[1]);
    overlay = (
      <img
        key={`slide-${pulseKey}`}
        src={PIECE_URL[animatingMove.piece]}
        alt=""
        draggable={false}
        className="absolute pointer-events-none select-none z-20"
        style={{
          left: `${toFile * squareSize + squareSize * 0.05}px`,
          top: `${toRank * squareSize + squareSize * 0.05}px`,
          width: `${squareSize * 0.9}px`,
          height: `${squareSize * 0.9}px`,
          transform: `translate(${dx * squareSize}px, ${dy * squareSize}px)`,
          transition: "transform 0.75s ease-out",
        }}
      />
    );
  }

  let arrowOverlay: ReactNode = null;
  if (arrowMove && squareSize > 0) {
    const from = squareCenter(arrowMove.from, squareSize);
    const to = squareCenter(arrowMove.to, squareSize);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const headSize = squareSize * 0.4;
    const lineEndX = to.x - ux * headSize * 0.55;
    const lineEndY = to.y - uy * headSize * 0.55;
    const tipX = to.x;
    const tipY = to.y;
    const baseCenterX = to.x - ux * headSize;
    const baseCenterY = to.y - uy * headSize;
    const px = -uy;
    const py = ux;
    const halfBase = headSize * 0.55;
    const b1x = baseCenterX + px * halfBase;
    const b1y = baseCenterY + py * halfBase;
    const b2x = baseCenterX - px * halfBase;
    const b2y = baseCenterY - py * halfBase;
    const totalSize = squareSize * 8;
    arrowOverlay = (
      <svg className="pointer-events-none absolute inset-0 z-30" width={totalSize} height={totalSize} viewBox={`0 0 ${totalSize} ${totalSize}`}>
        <defs>
          <filter id="arrow-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.45" />
          </filter>
        </defs>
        <g filter="url(#arrow-shadow)">
          <line x1={from.x} y1={from.y} x2={lineEndX} y2={lineEndY} stroke="rgba(0,200,100,0.85)" strokeWidth={12} strokeLinecap="round" />
          <polygon points={`${tipX},${tipY} ${b1x},${b1y} ${b2x},${b2y}`} fill="rgba(0,200,100,0.85)" />
        </g>
      </svg>
    );
  }

  return (
    <div className="w-full aspect-square max-w-[374px] mx-auto">
      <div className="relative">
        <div ref={gridRef} className="grid grid-cols-8 border-2 border-amber-900/30 rounded-lg overflow-hidden shadow-card">
          {displayBoard.map((row, ri) =>
            row.map((piece, ci) => {
              const square = `${FILES[ci]}${8 - ri}`;
              const isLight = (ri + ci) % 2 === 0;
              const isSelected = selectedSquare === square;
              const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square);
              const isHint = square === hintFrom || square === hintTo;
              const isLegal = legalMoves?.has(square) ?? false;
              const showBadge = !!feedback && committedMove?.to === square;

              let bg = isLight ? "#F0D9B5" : "#B58863";
              if (isSelected) bg = "rgba(255, 255, 0, 0.7)";
              else if (isHint) bg = "rgba(255, 255, 0, 0.45)";
              else if (isLastMove) bg = isLight ? "rgba(155, 199, 100, 0.6)" : "rgba(110, 160, 80, 0.6)";
              const labelColor = isLight ? "#B58863" : "#F0D9B5";

              return (
                <button
                  key={square}
                  disabled={disabled}
                  onClick={() => onSquareClick(square)}
                  aria-label={`${square}${piece ? `, ${PIECE_NAME[piece] ?? "piece"}` : ", empty square"}${isSelected ? ", selected" : ""}${isHint ? ", hint" : ""}${isLastMove ? ", last move" : ""}`}
                  title={`${square}${piece ? `, ${PIECE_NAME[piece] ?? "piece"}` : ""}`}
                  aria-pressed={isSelected}
                  className={cn(
                    "relative aspect-square flex items-center justify-center transition-all min-h-[42px]",
                    disabled && "cursor-default"
                  )}
                  style={{ backgroundColor: bg }}
                >
                  {isLegal && !piece && !disabled && <span className="absolute h-3 w-3 rounded-full bg-foreground/25" />}
                  {piece && (
                    <img
                      src={PIECE_URL[piece]}
                      alt=""
                      draggable={false}
                      className={cn("relative w-[90%] h-[90%] pointer-events-none select-none", (piece === "k" || piece === "q" || piece === "r" || piece === "b" || piece === "n" || piece === "p") && "drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]")}
                    />
                  )}
                  {showBadge && (
                    <span className={cn("absolute bottom-1 right-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase", feedback === "correct" ? "bg-success text-background" : "bg-live text-background")}>
                      {feedback}
                    </span>
                  )}
                  {ci === 0 && (
                    <span
                      className="absolute top-0.5 left-0.5 text-[9px] font-semibold leading-none pointer-events-none"
                      style={{ color: labelColor }}
                    >
                      {8 - ri}
                    </span>
                  )}
                  {ri === 7 && (
                    <span
                      className="absolute bottom-0.5 right-0.5 text-[9px] font-semibold leading-none pointer-events-none"
                      style={{ color: labelColor }}
                    >
                      {FILES[ci]}
                    </span>
                  )}
                </button>
              );
            }),
          )}
          {arrowOverlay}
          {overlay}
        </div>
      </div>
    </div>
  );
}
