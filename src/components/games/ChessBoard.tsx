import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

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

function getSquareOffset(from: string, to: string): { dx: number; dy: number } {
  const fromFile = FILES.indexOf(from[0] as (typeof FILES)[number]);
  const fromRank = 8 - parseInt(from[1]);
  const toFile = FILES.indexOf(to[0] as (typeof FILES)[number]);
  const toRank = 8 - parseInt(to[1]);
  return {
    dx: fromFile - toFile,
    dy: fromRank - toRank,
  };
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
}

export function ChessBoard({ fen, selectedSquare, onSquareClick, lastMove, hintFrom, hintTo, disabled, legalMoves }: ChessBoardProps) {
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
    const toRank = 8 - parseInt(lastMove.to[1]);
    const movedPiece = b[toRank]?.[toFile];
    if (!movedPiece) return;

    setAnimatingMove({
      piece: movedPiece,
      fromSquare: lastMove.from,
      toSquare: lastMove.to,
    });

    const timer = setTimeout(() => setAnimatingMove(null), 450);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulseKey]);

  const displayBoard = animatingMove
    ? board.map((row, ri) =>
        row.map((piece, ci) => {
          const sq = `${FILES[ci]}${8 - ri}`;
          return sq === animatingMove.fromSquare ? null : piece;
        })
      )
    : board;

  const squareSize = gridRef.current ? gridRef.current.offsetWidth / 8 : 0;
  let overlay: React.ReactNode = null;
  if (animatingMove && squareSize > 0) {
    const { dx, dy } = getSquareOffset(animatingMove.fromSquare, animatingMove.toSquare);
    const toFile = FILES.indexOf(animatingMove.toSquare[0] as (typeof FILES)[number]);
    const toRank = 8 - parseInt(animatingMove.toSquare[1]);
    overlay = (
      <img
        key={`slide-${pulseKey}`}
        src={PIECE_URL[animatingMove.piece]}
        alt=""
        draggable={false}
        className="absolute pointer-events-none select-none animate-chess-piece-slide z-10"
        style={{
          left: `${toFile * squareSize + squareSize * 0.05}px`,
          top: `${toRank * squareSize + squareSize * 0.05}px`,
          width: `${squareSize * 0.9}px`,
          height: `${squareSize * 0.9}px`,
          ["--slide-x" as string]: `${dx * squareSize}px`,
          ["--slide-y" as string]: `${dy * squareSize}px`,
        }}
      />
    );
  }

  return (
    <div className="w-full aspect-square max-w-[360px] mx-auto">
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

              let bg: string;
              if (isSelected) bg = "rgba(255, 255, 0, 0.7)";
              else if (isHint) bg = "rgba(255, 255, 0, 0.5)";
              else if (isLastMove) bg = isLight ? "rgba(155, 199, 100, 0.6)" : "rgba(110, 160, 80, 0.6)";
              else bg = isLight ? "#F0D9B5" : "#B58863";

              const labelColor = isLight ? "#B58863" : "#F0D9B5";

              return (
                <button
                  key={square}
                  disabled={disabled}
                  onClick={() => onSquareClick(square)}
                  className={cn(
                    "relative aspect-square flex items-center justify-center transition-all min-h-[44px]",
                    disabled && "cursor-default"
                  )}
                  style={{ backgroundColor: bg }}
                >
                  {isLastMove && (
                    <span
                      key={`pulse-${pulseKey}-${square}`}
                      className="absolute inset-0 pointer-events-none animate-checkmate-lastmove-pulse"
                    />
                  )}
                  {piece && (
                    <img
                      src={PIECE_URL[piece]}
                      alt={piece}
                      draggable={false}
                      className="relative w-[90%] h-[90%] pointer-events-none select-none"
                    />
                  )}
                  {isLegal && !piece && (
                    <span className="pointer-events-none absolute w-[28%] h-[28%] rounded-full bg-black/30" />
                  )}
                  {isLegal && piece && (
                    <span className="pointer-events-none absolute inset-[6%] rounded-full border-[3px] border-black/30" />
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
            })
          )}
        </div>
        {overlay}
      </div>
    </div>
  );
}
