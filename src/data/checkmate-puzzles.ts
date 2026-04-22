// 20 chess puzzles — solutions NEVER sent to client
// Each puzzle has a FEN (position after opponent's move) and the correct response move
// solutionMove uses UCI format: <from-square><to-square>, e.g. "h5f7"

export interface ChessPuzzle {
  id: string;
  fen: string;
  /** The correct move in UCI format: from-square + to-square, e.g. "h5f7" or "e1g1" (castling) */
  solutionMove: string;
  /** Hint tiers: tier1=which piece, tier2=destination square, tier3=full move */
  hintPiece: string;
  hintDestination: string;
  difficulty: 1 | 2 | 3;
  /** Lichess-aligned tactical theme used to drive the goal text shown to the player */
  theme: string;
}

export const CHECKMATE_PUZZLES: ChessPuzzle[] = [
  {
    id: "cm-001",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
    solutionMove: "h5f7",
    hintPiece: "Queen",
    hintDestination: "f7",
    difficulty: 1,
    theme: "Fork",
  },
  {
    id: "cm-002",
    fen: "rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2",
    solutionMove: "d8h4",
    hintPiece: "Queen",
    hintDestination: "h4",
    difficulty: 1,
    theme: "Checkmate in 1",
  },
  {
    id: "cm-003",
    fen: "r1b1k2r/ppppqppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 5",
    solutionMove: "c1g5",
    hintPiece: "Bishop",
    hintDestination: "g5",
    difficulty: 2,
    theme: "Pin",
  },
  {
    id: "cm-004",
    fen: "r2qk2r/ppp2ppp/2np1n2/2b1p1B1/2B1P1b1/3P1N2/PPP2PPP/RN1QK2R w KQkq - 0 6",
    solutionMove: "c4f7",
    hintPiece: "Bishop",
    hintDestination: "f7",
    difficulty: 2,
    theme: "Attacking f2 or f7",
  },
  {
    id: "cm-005",
    fen: "r1bqkbnr/1ppp1ppp/p1n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4",
    solutionMove: "f3g5",
    hintPiece: "Knight",
    hintDestination: "g5",
    difficulty: 2,
    theme: "Attacking f2 or f7",
  },
  {
    id: "cm-006",
    fen: "rnb1kbnr/ppppqppp/8/4N3/4P3/8/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
    solutionMove: "e5f7",
    hintPiece: "Knight",
    hintDestination: "f7",
    difficulty: 2,
    theme: "Fork",
  },
  {
    id: "cm-007",
    fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/4P3/2NP1N2/PPP2PPP/R1BQKB1R w KQkq - 0 4",
    solutionMove: "f1e2",
    hintPiece: "Bishop",
    hintDestination: "e2",
    difficulty: 1,
    theme: "Clearance",
  },
  {
    id: "cm-008",
    fen: "r1bqr1k1/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 7",
    solutionMove: "c1g5",
    hintPiece: "Bishop",
    hintDestination: "g5",
    difficulty: 2,
    theme: "Pin",
  },
  {
    id: "cm-009",
    fen: "r3kb1r/ppp1qppp/2n1bn2/3pp3/4P3/1BN2N2/PPPP1PPP/R1BQK2R w KQkq - 0 6",
    solutionMove: "e1g1",
    hintPiece: "King",
    hintDestination: "g1",
    difficulty: 1,
    theme: "Exposed king",
  },
  {
    id: "cm-010",
    fen: "r1bq1rk1/ppppbppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 w - - 6 5",
    solutionMove: "d2d4",
    hintPiece: "Pawn",
    hintDestination: "d4",
    difficulty: 1,
    theme: "Advanced pawn",
  },
  {
    id: "cm-011",
    fen: "r2qkb1r/pppbpppp/2np1n2/8/3PP3/2N2N2/PPP2PPP/R1BQKB1R w KQkq - 2 5",
    solutionMove: "e4e5",
    hintPiece: "Pawn",
    hintDestination: "e5",
    difficulty: 2,
    theme: "Hanging piece",
  },
  {
    id: "cm-012",
    fen: "rnbqk2r/pppp1ppp/4pn2/8/1bPP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 4",
    solutionMove: "e2e3",
    hintPiece: "Pawn",
    hintDestination: "e3",
    difficulty: 1,
    theme: "Trapped piece",
  },
  {
    id: "cm-013",
    fen: "r1bqk2r/ppppbppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    solutionMove: "e1g1",
    hintPiece: "King",
    hintDestination: "g1",
    difficulty: 1,
    theme: "Exposed king",
  },
  {
    id: "cm-014",
    fen: "r2qr1k1/ppp2ppp/2npbn2/2b1p3/4P3/2NP1N1P/PPP1BPP1/R1BQ1RK1 w - - 0 8",
    solutionMove: "c1e3",
    hintPiece: "Bishop",
    hintDestination: "e3",
    difficulty: 2,
    theme: "Clearance",
  },
  {
    id: "cm-015",
    fen: "r1bq1rk1/ppp2ppp/2n1pn2/3p4/2PP4/2N2N2/PP2PPPP/R1BQKB1R w KQ - 0 6",
    solutionMove: "c4d5",
    hintPiece: "Pawn",
    hintDestination: "d5",
    difficulty: 2,
    theme: "Capture the defender",
  },
  {
    id: "cm-016",
    fen: "r2q1rk1/pp2ppbp/2np1np1/2p5/4P3/2NP1NP1/PPP2PBP/R1BQ1RK1 w - - 0 8",
    solutionMove: "c1e3",
    hintPiece: "Bishop",
    hintDestination: "e3",
    difficulty: 3,
    theme: "Clearance",
  },
  {
    id: "cm-017",
    fen: "r2qkb1r/pp1npppp/2p2n2/3p1bB1/3P4/2N2N2/PPP1PPPP/R2QKB1R w KQkq - 0 5",
    solutionMove: "e2e3",
    hintPiece: "Pawn",
    hintDestination: "e3",
    difficulty: 2,
    theme: "Pin",
  },
  {
    id: "cm-018",
    fen: "rn1qkbnr/ppp2ppp/4p3/3pPb2/3P4/8/PPP2PPP/RNBQKBNR w KQkq - 0 4",
    solutionMove: "g1f3",
    hintPiece: "Knight",
    hintDestination: "f3",
    difficulty: 1,
    theme: "Hanging piece",
  },
  {
    id: "cm-019",
    fen: "r1bqk2r/ppp2ppp/2n1pn2/3p4/1bPP4/2N1P3/PP3PPP/R1BQKBNR w KQkq - 0 5",
    solutionMove: "f1d3",
    hintPiece: "Bishop",
    hintDestination: "d3",
    difficulty: 2,
    theme: "Clearance",
  },
  {
    id: "cm-020",
    fen: "r2qk2r/ppp1bppp/2n1pn2/3p2B1/2PP4/2N2N2/PP2PPPP/R2QKB1R w KQkq - 0 6",
    solutionMove: "e2e3",
    hintPiece: "Pawn",
    hintDestination: "e3",
    difficulty: 3,
    theme: "Discovered attack",
  },
];
