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
      <div className="grid grid-cols-8 border-2 border-amber-900/30 rounded-lg overflow-hidden shadow-card">
        {board.map((row, ri) =>
          row.map((piece, ci) => {
            const square = `${files[ci]}${8 - ri}`;
            const isLight = (ri + ci) % 2 === 0;
            const isSelected = selectedSquare === square;
            const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square);
            const isHint = square === hintFrom || square === hintTo;

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
                {piece && (
                  <img
                    src={PIECE_URL[piece]}
                    alt={piece}
                    draggable={false}
                    className="w-[90%] h-[90%] pointer-events-none select-none"
                  />
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
                    {files[ci]}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
