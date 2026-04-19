import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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
    const { CHECKMATE_PUZZLES } = await import("@/data/checkmate-puzzles");

    // Get current open draw week
    const { data: drawWeek, error: dwErr } = await supabaseAdmin
      .from("winam_draw_weeks")
      .select("id")
      .eq("status", "open")
      .limit(1)
      .maybeSingle();

    if (dwErr || !drawWeek) {
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
        draw_week_id: drawWeek.id,
        session_date_wat: watDate,
      })
      .select("id")
      .single();

    if (sessErr || !session) {
      console.error("Failed to create session:", sessErr);
      return { success: false as const, error: "Failed to start session" };
    }

    // Pick puzzles (shuffle and take 10)
    let puzzleList: { id: string; clientData: Record<string, string | string[]> }[];
    if (data.gameType === "checkmate") {
      const shuffled = [...CHECKMATE_PUZZLES].sort(() => Math.random() - 0.5).slice(0, 10);
      puzzleList = shuffled.map((p) => ({
        id: p.id,
        clientData: { fen: p.fen },
      }));
    } else {
      const { data: allPuzzles, error: pzErr } = await supabaseAdmin
        .from("winam_wisdom_puzzles")
        .select("id, display_text, options, region");
      if (pzErr || !allPuzzles || allPuzzles.length === 0) {
        console.error("Failed to load wisdom puzzles:", pzErr);
        return { success: false as const, error: "No puzzles available" };
      }
      const shuffled = [...allPuzzles].sort(() => Math.random() - 0.5).slice(0, 10);
      puzzleList = shuffled.map((p) => {
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
      drawWeekId: drawWeek.id,
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
      puzzleId: z.string().min(1).max(20),
      answer: z.string().min(1).max(10),
      timeMs: z.number().min(0).max(600000),
      nextPuzzleId: z.string().min(1).max(20).optional(),
    })
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { CHECKMATE_PUZZLES } = await import("@/data/checkmate-puzzles");
    const { WISDOMDROP_PUZZLES } = await import("@/data/wisdomdrop-puzzles");

    // Determine game type from puzzle ID prefix
    const isCheckmate = data.puzzleId.startsWith("cm-");

    let isCorrect = false;
    let puzzleResult: "correct" | "incorrect" = "incorrect";

    if (isCheckmate) {
      const puzzle = CHECKMATE_PUZZLES.find((p) => p.id === data.puzzleId);
      if (puzzle) {
        isCorrect = data.answer === puzzle.solutionMove;
      }
    } else {
      const puzzle = WISDOMDROP_PUZZLES.find((p) => p.id === data.puzzleId);
      if (puzzle) {
        // Answer is the selected option text
        isCorrect = data.answer === puzzle.options[puzzle.correctIndex];
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
        const p = CHECKMATE_PUZZLES.find((x) => x.id === data.nextPuzzleId);
        if (p) nextPuzzle = { puzzleId: p.id, fen: p.fen };
      } else {
        const p = WISDOMDROP_PUZZLES.find((x) => x.id === data.nextPuzzleId);
        if (p) {
          const indices = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
          nextPuzzle = {
            puzzleId: p.id,
            proverb: p.proverb,
            options: indices.map((i) => p.options[i]),
            origin: p.origin,
          };
        }
      }
    }

    return {
      correct: isCorrect,
      nextPuzzle,
    };
  });

// ── useHint ───────────────────────────────────────────────────────────
export const useHint = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      playerId: z.string().uuid(),
      puzzleId: z.string().min(1).max(20),
      tier: z.number().min(1).max(3),
    })
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { CHECKMATE_PUZZLES } = await import("@/data/checkmate-puzzles");
    const { WISDOMDROP_PUZZLES } = await import("@/data/wisdomdrop-puzzles");

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
    const isCheckmate = data.puzzleId.startsWith("cm-");
    let hintData: Record<string, string> = {};

    if (isCheckmate) {
      const puzzle = CHECKMATE_PUZZLES.find((p) => p.id === data.puzzleId);
      if (puzzle) {
        if (data.tier >= 1) hintData.piece = puzzle.hintPiece;
        if (data.tier >= 2) hintData.destination = puzzle.hintDestination;
        if (data.tier >= 3) hintData.move = puzzle.solutionMove;
      }
    } else {
      const puzzle = WISDOMDROP_PUZZLES.find((p) => p.id === data.puzzleId);
      if (puzzle) {
        const correctAnswer = puzzle.options[puzzle.correctIndex];
        if (data.tier >= 1) {
          // Remove 2 wrong options
          const wrong = puzzle.options.filter((_, i) => i !== puzzle.correctIndex);
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

    // Streak bonus
    let streakBonus = 0;
    const streak = player.current_streak;
    if (streak >= 14) streakBonus = 3;
    else if (streak >= 7) streakBonus = 2;
    else if (streak >= 3) streakBonus = 1;

    // Mission bonus is now awarded directly by evaluatePendingMissions (which
    // writes its own ledger rows). Session-level rawEntries excludes missions.
    const watDate = session.session_date_wat;
    const rawEntries = baseEntries + streakBonus;

    // Get current week total
    const { data: weekEntries } = await supabaseAdmin
      .from("winam_entry_ledger")
      .select("week_total_after")
      .eq("player_id", data.playerId)
      .eq("draw_week_id", session.draw_week_id)
      .order("created_at", { ascending: false })
      .limit(1);

    const weekSoFar = weekEntries && weekEntries.length > 0 ? weekEntries[0].week_total_after : 0;
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
