import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Chess } from "chess.js";

// ── ensureCurrentDrawWeek ─────────────────────────────────────────────
// Returns the id of the current open draw week, creating one if missing.
// Triggers lazily on the first session of a new week — no cron required.
async function ensureCurrentDrawWeek(): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const nowWAT = new Date(Date.now() + 60 * 60 * 1000);
  const todayWAT = nowWAT.toISOString().split("T")[0];

  // TODO (schema): add unique index on winam_draw_weeks(week_start_wat)
  // to harden rollover against concurrent insert races — Phase 1 CTO task
  const { data: existing } = await supabaseAdmin
    .from("winam_draw_weeks")
    .select("id")
    .eq("status", "open")
    .gte("week_end_wat", todayWAT)
    .order("week_start_wat", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return existing.id;

  // Compute current WAT week (Mon–Sun)
  const day = nowWAT.getUTCDay(); // 0 = Sunday
  const daysToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(nowWAT);
  monday.setUTCDate(nowWAT.getUTCDate() + daysToMonday);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const weekStart = monday.toISOString().split("T")[0];
  const weekEnd = sunday.toISOString().split("T")[0];

  const { data: newWeek, error } = await supabaseAdmin
    .from("winam_draw_weeks")
    .insert({
      week_start_wat: weekStart,
      week_end_wat: weekEnd,
      entry_lock_at: `${weekEnd}T18:00:00+00:00`, // 19:00 WAT
      draw_executes_at: `${weekEnd}T19:00:00+00:00`, // 20:00 WAT
      status: "open",
      total_entries: 0,
    })
    .select("id")
    .single();

  if (error || !newWeek) {
    console.error("ensureCurrentDrawWeek insert failed:", error);
    return null;
  }
  return newWeek.id;
}

// ── startSession ──────────────────────────────────────────────────────
export const startSession = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      playerId: z.string().uuid(),
      gameType: z.enum(["checkmate", "wisdomdrop"]),
    })
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Ensure current draw week exists (auto-rollover)
    const drawWeekId = await ensureCurrentDrawWeek();
    if (!drawWeekId) {
      return { success: false as const, error: "No active draw week" };
    }

    // Get today's date in WAT (UTC+1)
    const now = new Date();
    const watDate = new Date(now.getTime() + 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    // Create session row
    const { data: session, error: sessErr } = await supabaseAdmin
      .from("winam_game_sessions")
      .insert({
        player_id: data.playerId,
        game_type: data.gameType,
        draw_week_id: drawWeekId,
        session_date_wat: watDate,
      })
      .select("id")
      .single();

    if (sessErr || !session) {
      console.error("Failed to create session:", sessErr);
      return { success: false as const, error: "Failed to start session" };
    }

    // Pick puzzles (shuffle and take 10)
    let puzzleList: { id: string; clientData: Record<string, string | string[] | null> }[];

    // Fetch player rank for difficulty mix (used by both game types)
    const { data: playerRow } = await supabaseAdmin
      .from("winam_players")
      .select("rank_tier")
      .eq("id", data.playerId)
      .single();
    const rankTier = playerRow?.rank_tier ?? "starter";

    if (data.gameType === "checkmate") {
      // Numeric difficulty mix (1=beginner, 2=intermediate, 3=advanced) keyed by rank
      const RANK_DIFFICULTY_MIX_CM: Record<string, { 1: number; 2: number; 3: number }> = {
        starter:  { 1: 7, 2: 2, 3: 1 },
        recruit:  { 1: 5, 2: 4, 3: 1 },
        sergeant: { 1: 3, 2: 5, 3: 2 },
        veteran:  { 1: 1, 2: 5, 3: 4 },
        champion: { 1: 1, 2: 5, 3: 4 },
        icon:     { 1: 1, 2: 5, 3: 4 },
        legend:   { 1: 1, 2: 5, 3: 4 },
        immortal: { 1: 1, 2: 5, 3: 4 },
      };
      const cmMix = RANK_DIFFICULTY_MIX_CM[rankTier] ?? RANK_DIFFICULTY_MIX_CM.starter;

      // Fetch seen Lichess (lc_*) puzzle IDs only — keeps wisdom history isolated
      const { data: seenCm } = await supabaseAdmin
        .from("winam_puzzle_history")
        .select("puzzle_id")
        .eq("player_id", data.playerId)
        .like("puzzle_id", "lc_%");
      const seenCmIds = (seenCm ?? []).map((r) => r.puzzle_id);

      type CmPoolRow = { id: string; difficulty: number };
      let cmPool: CmPoolRow[];
      {
        let q = supabaseAdmin
          .from("winam_checkmate_puzzles")
          .select("id, difficulty");
        if (seenCmIds.length > 0) {
          const inList = `(${seenCmIds.map((id) => `"${id}"`).join(",")})`;
          q = q.not("id", "in", inList);
        }
        const { data: rows, error: poolErr } = await q;
        if (poolErr) {
          console.error("Failed to load checkmate pool:", poolErr);
          return { success: false as const, error: "No puzzles available" };
        }
        cmPool = (rows ?? []) as CmPoolRow[];
      }

      // Cycle reset: if unseen pool < 15, wipe only lc_-prefixed history
      if (cmPool.length < 15) {
        await supabaseAdmin
          .from("winam_puzzle_history")
          .delete()
          .eq("player_id", data.playerId)
          .like("puzzle_id", "lc_%");
        const { data: full, error: fullErr } = await supabaseAdmin
          .from("winam_checkmate_puzzles")
          .select("id, difficulty");
        if (fullErr || !full || full.length === 0) {
          console.error("Failed to load full checkmate pool:", fullErr);
          return { success: false as const, error: "No puzzles available" };
        }
        cmPool = full as CmPoolRow[];
      }

      const shuffleCm = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
      const cmBuckets: Record<1 | 2 | 3, CmPoolRow[]> = {
        1: shuffleCm(cmPool.filter((p) => p.difficulty === 1)),
        2: shuffleCm(cmPool.filter((p) => p.difficulty === 2)),
        3: shuffleCm(cmPool.filter((p) => p.difficulty === 3)),
      };

      const cmPicked: CmPoolRow[] = [];
      const cmPickedIds = new Set<string>();
      const cmTake = (key: 1 | 2 | 3, n: number): number => {
        let taken = 0;
        while (taken < n && cmBuckets[key].length > 0) {
          const p = cmBuckets[key].shift()!;
          if (cmPickedIds.has(p.id)) continue;
          cmPicked.push(p);
          cmPickedIds.add(p.id);
          taken++;
        }
        return taken;
      };

      // Cascade: advanced -> intermediate -> beginner; back-fill upward if beginner short
      const advTakenCm = cmTake(3, cmMix[3]);
      const advShortCm = cmMix[3] - advTakenCm;
      const intTargetCm = cmMix[2] + advShortCm;
      const intTakenCm = cmTake(2, intTargetCm);
      const intShortCm = intTargetCm - intTakenCm;
      const begTargetCm = cmMix[1] + intShortCm;
      const begTakenCm = cmTake(1, begTargetCm);
      let begShortCm = begTargetCm - begTakenCm;
      if (begShortCm > 0) begShortCm -= cmTake(2, begShortCm);
      if (begShortCm > 0) cmTake(3, begShortCm);

      if (cmPicked.length === 0) {
        return { success: false as const, error: "No puzzles available" };
      }

      // Re-query for fen + theme + opponent move; preserve picked order
      const { data: cmFull, error: cmFullErr } = await supabaseAdmin
        .from("winam_checkmate_puzzles")
        .select("id, fen, theme, opponent_from, opponent_to")
        .in("id", cmPicked.map((p) => p.id));
      if (cmFullErr || !cmFull) {
        console.error("Failed to load full checkmate puzzles:", cmFullErr);
        return { success: false as const, error: "No puzzles available" };
      }
      const cmById = new Map(cmFull.map((p) => [p.id, p]));
      puzzleList = cmPicked
        .map((sel) => cmById.get(sel.id))
        .filter((p): p is NonNullable<typeof p> => !!p)
        .map((p) => ({
          id: p.id,
          clientData: {
            fen: p.fen,
            theme: p.theme,
            opponentFrom: p.opponent_from,
            opponentTo: p.opponent_to,
          },
        }));
    } else {
      // Difficulty values in winam_wisdom_puzzles: beginner (144), intermediate (120), advanced (36)
      // Note: advanced pool is thin — Veteran+ (4/session) exhausts it in ~9 sessions before cascade kicks in.
      // Expand advanced pool in winam_wisdom_puzzles to 80+ for better Veteran+ experience.

      const RANK_DIFFICULTY_MIX: Record<string, { beginner: number; intermediate: number; advanced: number }> = {
        starter:   { beginner: 7, intermediate: 2, advanced: 1 },
        recruit:   { beginner: 5, intermediate: 4, advanced: 1 },
        sergeant:  { beginner: 3, intermediate: 5, advanced: 2 },
        veteran:   { beginner: 1, intermediate: 5, advanced: 4 },
        champion:  { beginner: 1, intermediate: 5, advanced: 4 },
        icon:      { beginner: 1, intermediate: 5, advanced: 4 },
        legend:    { beginner: 1, intermediate: 5, advanced: 4 },
        immortal:  { beginner: 1, intermediate: 5, advanced: 4 },
      };
      const mix = RANK_DIFFICULTY_MIX[rankTier] ?? RANK_DIFFICULTY_MIX.starter;

      // Adaptive difficulty nudge based on previous session accuracy
      const { data: lastSession } = await supabaseAdmin
        .from("winam_game_sessions")
        .select("wisdom_accuracy")
        .eq("player_id", data.playerId)
        .eq("game_type", "wisdomdrop")
        .not("wisdom_accuracy", "is", null)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastAccuracy = lastSession?.wisdom_accuracy ?? null;
      let adjustedMix = { ...mix };
      if (lastAccuracy !== null) {
        if (lastAccuracy >= 90) {
          // Harder: move 2 from beginner → advanced (clamp at 0)
          const shift = Math.min(2, adjustedMix.beginner);
          adjustedMix = {
            beginner: adjustedMix.beginner - shift,
            intermediate: adjustedMix.intermediate,
            advanced: adjustedMix.advanced + shift,
          };
        } else if (lastAccuracy < 50) {
          // Easier: move 2 from advanced → beginner (clamp at 0)
          const shift = Math.min(2, adjustedMix.advanced);
          adjustedMix = {
            beginner: adjustedMix.beginner + shift,
            intermediate: adjustedMix.intermediate,
            advanced: adjustedMix.advanced - shift,
          };
        }
        // 50–89: no change
      }

      // Fetch seen wisdom puzzle IDs (exclude lc_-prefixed checkmate ids)
      const { data: seen } = await supabaseAdmin
        .from("winam_puzzle_history")
        .select("puzzle_id")
        .eq("player_id", data.playerId)
        .not("puzzle_id", "like", "lc_%");
      const seenIds = (seen ?? []).map((r) => r.puzzle_id);

      // Fetch unseen pool (light columns only)
      type PoolRow = { id: string; difficulty: string; region: string };
      let unseen: PoolRow[];
      {
        let q = supabaseAdmin
          .from("winam_wisdom_puzzles")
          .select("id, difficulty, region");
        if (seenIds.length > 0) {
          const inList = `(${seenIds.map((id) => `"${id}"`).join(",")})`;
          q = q.not("id", "in", inList);
        }
        const { data: rows, error: poolErr } = await q;
        if (poolErr) {
          console.error("Failed to load wisdom pool:", poolErr);
          return { success: false as const, error: "No puzzles available" };
        }
        unseen = (rows ?? []) as PoolRow[];
      }

      // Cycle reset if too few unseen — wipe only non-lc_ history
      if (unseen.length < 15) {
        await supabaseAdmin
          .from("winam_puzzle_history")
          .delete()
          .eq("player_id", data.playerId)
          .not("puzzle_id", "like", "lc_%");
        const { data: full, error: fullErr } = await supabaseAdmin
          .from("winam_wisdom_puzzles")
          .select("id, difficulty, region");
        if (fullErr || !full || full.length === 0) {
          console.error("Failed to load full wisdom pool:", fullErr);
          return { success: false as const, error: "No puzzles available" };
        }
        unseen = full as PoolRow[];
      }

      // Bucket by difficulty + shuffle each bucket
      const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
      const buckets: Record<"beginner" | "intermediate" | "advanced", PoolRow[]> = {
        beginner: shuffle(unseen.filter((p) => p.difficulty === "beginner")),
        intermediate: shuffle(unseen.filter((p) => p.difficulty === "intermediate")),
        advanced: shuffle(unseen.filter((p) => p.difficulty === "advanced")),
      };

      // Pick with shortfall cascade: advanced -> intermediate -> beginner -> intermediate
      const picked: PoolRow[] = [];
      const pickedIds = new Set<string>();
      const takeFrom = (key: "beginner" | "intermediate" | "advanced", n: number): number => {
        let taken = 0;
        while (taken < n && buckets[key].length > 0) {
          const p = buckets[key].shift()!;
          if (pickedIds.has(p.id)) continue;
          picked.push(p);
          pickedIds.add(p.id);
          taken++;
        }
        return taken;
      };

      const advTaken = takeFrom("advanced", adjustedMix.advanced);
      let advShort = adjustedMix.advanced - advTaken;
      const intTarget = adjustedMix.intermediate + advShort;
      const intTaken = takeFrom("intermediate", intTarget);
      let intShort = intTarget - intTaken;
      const begTarget = adjustedMix.beginner + intShort;
      const begTaken = takeFrom("beginner", begTarget);
      let begShort = begTarget - begTaken;
      // Last resort: refill from intermediate then advanced if beginner ran out
      if (begShort > 0) begShort -= takeFrom("intermediate", begShort);
      if (begShort > 0) takeFrom("advanced", begShort);

      // Region variety pass: cap 4 per region; aim for >=3 distinct regions
      const regionCount: Record<string, number> = {};
      picked.forEach((p) => {
        regionCount[p.region] = (regionCount[p.region] ?? 0) + 1;
      });
      const overCapRegions = Object.entries(regionCount)
        .filter(([, c]) => c > 4)
        .map(([r]) => r);

      for (const region of overCapRegions) {
        let excess = regionCount[region] - 4;
        // Indices of picked puzzles from this region (later ones first to swap out)
        const indices = picked
          .map((p, i) => ({ p, i }))
          .filter((x) => x.p.region === region)
          .map((x) => x.i)
          .reverse();

        for (const idx of indices) {
          if (excess <= 0) break;
          const target = picked[idx];
          // Find replacement: same difficulty, different region, not already picked
          const candidates = unseen.filter(
            (u) =>
              u.difficulty === target.difficulty &&
              u.region !== region &&
              !pickedIds.has(u.id)
          );
          if (candidates.length === 0) continue;
          // Prefer regions absent from session, then lowest count
          const sessionRegions = new Set(picked.map((p) => p.region));
          candidates.sort((a, b) => {
            const aAbsent = sessionRegions.has(a.region) ? 1 : 0;
            const bAbsent = sessionRegions.has(b.region) ? 1 : 0;
            if (aAbsent !== bAbsent) return aAbsent - bAbsent;
            const aCount = regionCount[a.region] ?? 0;
            const bCount = regionCount[b.region] ?? 0;
            return aCount - bCount;
          });
          const replacement = candidates[0];
          pickedIds.delete(target.id);
          regionCount[region]--;
          picked[idx] = replacement;
          pickedIds.add(replacement.id);
          regionCount[replacement.region] = (regionCount[replacement.region] ?? 0) + 1;
          excess--;
        }
      }

      if (picked.length === 0) {
        return { success: false as const, error: "No puzzles available" };
      }

      // Fetch full puzzle data for the picked IDs
      const { data: fullPuzzles, error: fpErr } = await supabaseAdmin
        .from("winam_wisdom_puzzles")
        .select("id, display_text, options, region")
        .in("id", picked.map((p) => p.id));
      if (fpErr || !fullPuzzles) {
        console.error("Failed to load full puzzles:", fpErr);
        return { success: false as const, error: "No puzzles available" };
      }

      // Preserve picked order
      const byId = new Map(fullPuzzles.map((p) => [p.id, p]));
      puzzleList = picked
        .map((sel) => byId.get(sel.id))
        .filter((p): p is NonNullable<typeof p> => !!p)
        .map((p) => {
          const opts = (p.options as string[]) ?? [];
          const indices = opts.map((_, i) => i).sort(() => Math.random() - 0.5);
          const shuffledOptions = indices.map((i) => opts[i]);
          return {
            id: p.id,
            clientData: {
              displayText: p.display_text,
              options: shuffledOptions,
              region: p.region,
            },
          };
        });
    }

    // Return first puzzle only; store puzzle order in session metadata
    // For simplicity, we return all puzzle IDs and first puzzle data
    return {
      success: true as const,
      sessionId: session.id,
      drawWeekId: drawWeekId,
      puzzleIds: puzzleList.map((p) => p.id),
      firstPuzzle: {
        puzzleId: puzzleList[0].id,
        ...puzzleList[0].clientData,
      },
      totalPuzzles: puzzleList.length,
    };
  });

// ── submitMove ────────────────────────────────────────────────────────
export const submitMove = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      sessionId: z.string().uuid(),
      puzzleId: z.string().min(1).max(40),
      answer: z.string().min(1).max(50),
      timeMs: z.number().min(0).max(600000),
      nextPuzzleId: z.string().min(1).max(40).optional(),
    })
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Determine game type from puzzle ID prefix
    const isCheckmate = data.puzzleId.startsWith("lc_") || data.puzzleId.startsWith("cm-");

    let isCorrect = false;
    let puzzleResult: "correct" | "incorrect" = "incorrect";
    let revealData: {
      correctAnswer: string;
      blank: string;
      originalProverb: string;
      region: string;
      explanation: string | null;
    } | null = null;

    // Normalize for tolerant text comparison (WisdomDrop only — checkmate
    // moves are exact algebraic notation and must stay strict).
    const normalize = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

    if (isCheckmate) {
      const { data: puzzle } = await supabaseAdmin
        .from("winam_checkmate_puzzles")
        .select("fen, solution_move")
        .eq("id", data.puzzleId)
        .maybeSingle();
      if (puzzle) {
        try {
          const { from, to } = JSON.parse(data.answer) as { from: string; to: string };
          const chess = new Chess(puzzle.fen);
          const move = chess.move({ from, to, promotion: "q" });
          isCorrect = move !== null && `${from}${to}` === puzzle.solution_move;
        } catch {
          isCorrect = false;
        }
      }
    } else {
      const { data: puzzle } = await supabaseAdmin
        .from("winam_wisdom_puzzles")
        .select("options, correct_index, blank, original_proverb, region, explanation")
        .eq("id", data.puzzleId)
        .maybeSingle();
      if (puzzle) {
        const opts = (puzzle.options as string[]) ?? [];
        const correctAnswer = opts[puzzle.correct_index];
        isCorrect = normalize(data.answer) === normalize(correctAnswer ?? "");
        revealData = {
          correctAnswer,
          blank: puzzle.blank,
          originalProverb: puzzle.original_proverb,
          region: puzzle.region,
          explanation: puzzle.explanation ?? null,
        };
      }
    }

    puzzleResult = isCorrect ? "correct" : "incorrect";

    // Flag suspicious speed
    const isSuspicious = data.timeMs < 3000;
    if (isSuspicious) {
      console.warn(`[FRAUD_FLAG] Puzzle ${data.puzzleId} solved in ${data.timeMs}ms — session ${data.sessionId}`);
    }

    // Record attempt
    await supabaseAdmin.from("winam_puzzle_attempts").insert({
      session_id: data.sessionId,
      puzzle_id: data.puzzleId,
      result: puzzleResult,
      time_to_solve_ms: data.timeMs,
      moves_submitted: [data.answer],
    });

    // Get next puzzle data if requested
    let nextPuzzle: Record<string, string | string[]> | null = null;
    if (data.nextPuzzleId) {
      if (isCheckmate) {
        const { data: p } = await supabaseAdmin
          .from("winam_checkmate_puzzles")
          .select("id, fen, theme")
          .eq("id", data.nextPuzzleId)
          .maybeSingle();
        if (p) nextPuzzle = { puzzleId: p.id, fen: p.fen, theme: p.theme };
      } else {
        const { data: p } = await supabaseAdmin
          .from("winam_wisdom_puzzles")
          .select("id, display_text, options, region")
          .eq("id", data.nextPuzzleId)
          .maybeSingle();
        if (p) {
          const opts = (p.options as string[]) ?? [];
          const indices = opts.map((_, i) => i).sort(() => Math.random() - 0.5);
          nextPuzzle = {
            puzzleId: p.id,
            displayText: p.display_text,
            options: indices.map((i) => opts[i]),
            region: p.region,
          };
        }
      }
    }

    return {
      correct: isCorrect,
      submittedAnswer: data.answer,
      nextPuzzle,
      revealData,
    };
  });

// ── useHint ───────────────────────────────────────────────────────────
export const useHint = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      playerId: z.string().uuid(),
      puzzleId: z.string().min(1).max(40),
      tier: z.number().min(1).max(3),
    })
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const costs = { 1: 25, 2: 75, 3: 150 } as const;
    const cost = costs[data.tier as 1 | 2 | 3];

    // Check balance
    const { data: player } = await supabaseAdmin
      .from("winam_players")
      .select("coin_balance")
      .eq("id", data.playerId)
      .single();

    if (!player || player.coin_balance < cost) {
      return { success: false as const, error: "Insufficient coins" };
    }

    // Deduct coins
    await supabaseAdmin
      .from("winam_players")
      .update({ coin_balance: player.coin_balance - cost })
      .eq("id", data.playerId);

    // Return hint data
    const isCheckmate = data.puzzleId.startsWith("lc_") || data.puzzleId.startsWith("cm-");
    let hintData: Record<string, string> = {};

    if (isCheckmate) {
      const { data: puzzle } = await supabaseAdmin
        .from("winam_checkmate_puzzles")
        .select("hint_piece, hint_destination, solution_move")
        .eq("id", data.puzzleId)
        .maybeSingle();
      if (puzzle) {
        if (data.tier >= 1) hintData.piece = puzzle.hint_piece ?? "";
        if (data.tier >= 2) hintData.destination = puzzle.hint_destination ?? "";
        if (data.tier >= 3) {
          hintData.from = puzzle.solution_move.slice(0, 2);
          hintData.to = puzzle.solution_move.slice(2, 4);
        }
      }
    } else {
      const { data: puzzle } = await supabaseAdmin
        .from("winam_wisdom_puzzles")
        .select("options, correct_index")
        .eq("id", data.puzzleId)
        .maybeSingle();
      if (puzzle) {
        const opts = (puzzle.options as string[]) ?? [];
        const correctAnswer = opts[puzzle.correct_index];
        if (data.tier >= 1) {
          // Remove 2 wrong options
          const wrong = opts.filter((_, i) => i !== puzzle.correct_index);
          hintData.eliminate = wrong.slice(0, 2).join(",");
        }
        if (data.tier >= 2) hintData.startsWidth = correctAnswer[0];
        if (data.tier >= 3) hintData.answer = correctAnswer;
      }
    }

    return {
      success: true as const,
      hintData,
      newBalance: player.coin_balance - cost,
    };
  });

// ── closeSession ──────────────────────────────────────────────────────
export const closeSession = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      sessionId: z.string().uuid(),
      playerId: z.string().uuid(),
      puzzlesSolved: z.number().min(0).max(100),
      hintsUsed: z.number().min(0).max(100),
      durationSeconds: z.number().min(0).max(7200),
      servedPuzzleIds: z.array(z.string().min(1).max(40)).max(20).optional(),
    })
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Get player data
    const { data: player } = await supabaseAdmin
      .from("winam_players")
      .select("*")
      .eq("id", data.playerId)
      .single();

    if (!player) {
      return { success: false as const, error: "Player not found" };
    }

    // Get session to find draw_week_id
    const { data: session } = await supabaseAdmin
      .from("winam_game_sessions")
      .select("draw_week_id, session_date_wat, game_type")
      .eq("id", data.sessionId)
      .single();

    if (!session) {
      return { success: false as const, error: "Session not found" };
    }

    // ── Entry calculation ──
    // Hints cost coins only — they do NOT reduce puzzle count for entry math.
    const baseN = 5; // default divisor
    const weekCap = 50;
    const baseEntries = Math.floor(data.puzzlesSolved / baseN);
    const watDate = session.session_date_wat;

    // Get current week total (used by both branches)
    const { data: weekEntries } = await supabaseAdmin
      .from("winam_entry_ledger")
      .select("week_total_after")
      .eq("player_id", data.playerId)
      .eq("draw_week_id", session.draw_week_id)
      .order("created_at", { ascending: false })
      .limit(1);

    const weekSoFar = weekEntries && weekEntries.length > 0 ? weekEntries[0].week_total_after : 0;

    // Compute wisdom_accuracy from puzzle attempts (source of truth — handles early exit)
    let wisdomAccuracy: number | null = null;
    if (session.game_type === "wisdomdrop") {
      const { data: attempts } = await supabaseAdmin
        .from("winam_puzzle_attempts")
        .select("result")
        .eq("session_id", data.sessionId);
      const total = attempts?.length ?? 0;
      const correct = (attempts ?? []).filter((a) => a.result === "correct").length;
      wisdomAccuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    }

    // ── Server-side entry lock enforcement ──
    // Sessions completed between Sunday 19:00–20:00 WAT award coins only — no entries,
    // no streak bonus, no missions, no ledger write. XP, coin balance, streak, and
    // tier still update because playing during the lock window is valid play.
    const nowWAT = new Date(Date.now() + 60 * 60 * 1000);
    const isLockWindow =
      nowWAT.getUTCDay() === 0 &&
      nowWAT.getUTCHours() >= 19 &&
      nowWAT.getUTCHours() < 20;

    if (isLockWindow) {
      const coinsFromGameplay = data.puzzlesSolved * 5;
      const xpGained = data.puzzlesSolved * 10;

      await supabaseAdmin
        .from("winam_game_sessions")
        .update({
          puzzles_solved: data.puzzlesSolved,
          hints_used: data.hintsUsed,
          entries_awarded: 0,
          coins_awarded: coinsFromGameplay,
          duration_seconds: data.durationSeconds,
          ...(wisdomAccuracy !== null ? { wisdom_accuracy: wisdomAccuracy } : {}),
        })
        .eq("id", data.sessionId);

      // NOTE: streak/tier logic duplicated from performance branch — keep in sync if either changes
      let newStreak = 1;
      if (player.last_session_date) {
        const lastDate = new Date(player.last_session_date);
        const todayWat = new Date(watDate);
        const diffDays = Math.floor((todayWat.getTime() - lastDate.getTime()) / (86400 * 1000));
        if (diffDays === 0) newStreak = player.current_streak;
        else if (diffDays === 1) newStreak = player.current_streak + 1;
      }

      // NOTE: streak/tier logic duplicated from performance branch — keep in sync if either changes
      const newXp = player.xp_total + xpGained;
      let newTier = player.rank_tier;
      if (newXp >= 10000) newTier = "immortal";
      else if (newXp >= 7000) newTier = "legend";
      else if (newXp >= 4500) newTier = "icon";
      else if (newXp >= 2500) newTier = "champion";
      else if (newXp >= 1200) newTier = "veteran";
      else if (newXp >= 500) newTier = "sergeant";
      else if (newXp >= 150) newTier = "recruit";
      else newTier = "starter";

      await supabaseAdmin
        .from("winam_players")
        .update({
          xp_total: newXp,
          coin_balance: player.coin_balance + coinsFromGameplay,
          current_streak: newStreak,
          last_session_date: watDate,
          rank_tier: newTier,
        })
        .eq("id", data.playerId);

      // Record served puzzles in history (anti-fraud, same as other branches)
      if (data.servedPuzzleIds && data.servedPuzzleIds.length > 0) {
        for (const puzzleId of data.servedPuzzleIds) {
          await supabaseAdmin.from("winam_puzzle_history").insert({
            player_id: data.playerId,
            puzzle_id: puzzleId,
            seen_at: new Date().toISOString(),
          });
        }
      }

      return {
        success: true as const,
        entries: 0,
        sessionEntries: 0,
        baseEntries: 0,
        streakBonus: 0,
        missionEntries: 0,
        coins: coinsFromGameplay,
        xp: xpGained,
        streak: newStreak,
        weekTotal: weekSoFar,
        weekCap,
        overflow: 0,
        rankTier: newTier,
        previousRank: player.rank_tier,
        completedMissions: [],
      };
    }

    // ── Zero-performance gate ──
    // Player solved fewer than 5 puzzles → no entries, no streak, no missions,
    // no XP, no coins, no rank change. Session row + puzzle history still
    // written for audit / anti-fraud purposes.
    if (baseEntries === 0) {
      await supabaseAdmin
        .from("winam_game_sessions")
        .update({
          puzzles_solved: data.puzzlesSolved,
          hints_used: data.hintsUsed,
          entries_awarded: 0,
          coins_awarded: 0,
          duration_seconds: data.durationSeconds,
          ...(wisdomAccuracy !== null ? { wisdom_accuracy: wisdomAccuracy } : {}),
        })
        .eq("id", data.sessionId);

      // Still record served puzzles so they aren't re-served (anti-fraud, not a reward)
      if (data.servedPuzzleIds && data.servedPuzzleIds.length > 0) {
        for (const puzzleId of data.servedPuzzleIds) {
          await supabaseAdmin.from("winam_puzzle_history").insert({
            player_id: data.playerId,
            puzzle_id: puzzleId,
            seen_at: new Date().toISOString(),
          });
        }
      }

      return {
        success: true as const,
        entries: 0,
        sessionEntries: 0,
        baseEntries: 0,
        streakBonus: 0,
        missionEntries: 0,
        coins: 0,
        xp: 0,
        streak: player.current_streak,
        weekTotal: weekSoFar,
        weekCap,
        overflow: 0,
        rankTier: player.rank_tier,
        previousRank: player.rank_tier,
        completedMissions: [],
      };
    }

    // ── Performance branch (baseEntries >= 1) ──
    // Streak bonus
    let streakBonus = 0;
    const streak = player.current_streak;
    if (streak >= 14) streakBonus = 3;
    else if (streak >= 7) streakBonus = 2;
    else if (streak >= 3) streakBonus = 1;

    // Mission bonus is now awarded directly by evaluatePendingMissions (which
    // writes its own ledger rows). Session-level rawEntries excludes missions.
    const rawEntries = baseEntries + streakBonus;
    const entriesToAdd = Math.min(rawEntries, weekCap - weekSoFar);
    const overflow = rawEntries - entriesToAdd;

    // XP: 10 per correct answer
    const xpGained = data.puzzlesSolved * 10;
    // Coins: base coins + overflow conversion (1 overflow entry = 5 coins)
    const coinsFromGameplay = data.puzzlesSolved * 5;
    const coinsFromOverflow = overflow * 5;
    const totalCoins = coinsFromGameplay + coinsFromOverflow;

    // Update game session
    await supabaseAdmin
      .from("winam_game_sessions")
      .update({
        puzzles_solved: data.puzzlesSolved,
        hints_used: data.hintsUsed,
        entries_awarded: entriesToAdd,
        coins_awarded: totalCoins,
        duration_seconds: data.durationSeconds,
        ...(wisdomAccuracy !== null ? { wisdom_accuracy: wisdomAccuracy } : {}),
      })
      .eq("id", data.sessionId);

    // Append to entry ledger
    if (entriesToAdd > 0) {
      await supabaseAdmin.from("winam_entry_ledger").insert({
        player_id: data.playerId,
        draw_week_id: session.draw_week_id,
        source_type: "game_session",
        source_id: data.sessionId,
        entries_delta: entriesToAdd,
        cap_overflow: overflow,
        week_total_after: weekSoFar + entriesToAdd,
      });
    }

    // Update player: xp, coins, streak
    // Streak: if last_session_date was yesterday (WAT), increment; if today, keep; else reset to 1
    let newStreak = 1;
    if (player.last_session_date) {
      const lastDate = new Date(player.last_session_date);
      const todayWat = new Date(watDate);
      const diffDays = Math.floor((todayWat.getTime() - lastDate.getTime()) / (86400 * 1000));
      if (diffDays === 0) newStreak = player.current_streak; // same day
      else if (diffDays === 1) newStreak = player.current_streak + 1; // consecutive
      // else reset to 1
    }

    // Rank tier calculation
    const newXp = player.xp_total + xpGained;
    let newTier = player.rank_tier;
    if (newXp >= 10000) newTier = "immortal";
    else if (newXp >= 7000) newTier = "legend";
    else if (newXp >= 4500) newTier = "icon";
    else if (newXp >= 2500) newTier = "champion";
    else if (newXp >= 1200) newTier = "veteran";
    else if (newXp >= 500) newTier = "sergeant";
    else if (newXp >= 150) newTier = "recruit";
    else newTier = "starter";

    await supabaseAdmin
      .from("winam_players")
      .update({
        xp_total: newXp,
        coin_balance: player.coin_balance + totalCoins,
        current_streak: newStreak,
        last_session_date: watDate,
        rank_tier: newTier,
      })
      .eq("id", data.playerId);

    // ── Record served puzzles in history ──
    // TODO: switch to batch insert for puzzle history on session close
    if (data.servedPuzzleIds && data.servedPuzzleIds.length > 0) {
      for (const puzzleId of data.servedPuzzleIds) {
        await supabaseAdmin.from("winam_puzzle_history").insert({
          player_id: data.playerId,
          puzzle_id: puzzleId,
          seen_at: new Date().toISOString(),
        });
      }
    }

    // ── Evaluate missions (writes its own ledger rows for entry rewards) ──
    const { evaluatePendingMissions } = await import("@/utils/mission.server");
    const completedMissions = await evaluatePendingMissions(
      supabaseAdmin,
      data.playerId,
      session.draw_week_id,
      watDate,
      {
        puzzlesSolved: data.puzzlesSolved,
        hintsUsed: data.hintsUsed,
        gameType: session.game_type,
      }
    );

    const missionEntriesAdded = completedMissions.reduce(
      (sum, m) => sum + m.entriesAdded,
      0
    );

    return {
      success: true as const,
      entries: entriesToAdd + missionEntriesAdded,
      sessionEntries: entriesToAdd,
      baseEntries,
      streakBonus,
      missionEntries: missionEntriesAdded,
      coins: totalCoins,
      xp: xpGained,
      streak: newStreak,
      weekTotal: weekSoFar + entriesToAdd + missionEntriesAdded,
      weekCap,
      overflow,
      rankTier: newTier,
      previousRank: player.rank_tier,
      completedMissions: completedMissions.map((m) => ({
        title: m.title,
        rewardAmount: m.rewardAmount,
      })),
    };
  });
