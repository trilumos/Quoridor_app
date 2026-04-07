import { GameState, Wall, GameAction, Position } from './types';
import {
  getValidMoves,
  bfsShortestPathLength,
  isValidWallPlacement,
} from './GameEngine';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const BOARD_SIZE = 8;

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type CandidateWall = {
  wall: Wall;
  score: number;
  humanDelta: number;
  aiDelta: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────

export function getAIMove(
  gameState: GameState,
  difficulty: 'easy' | 'medium' | 'hard',
): GameAction {
  switch (difficulty) {
    case 'easy':   return easyAIMove(gameState);
    case 'medium': return mediumAIMove(gameState);
    case 'hard':   return hardAIMove(gameState);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EASY AI — Novice
// ─────────────────────────────────────────────────────────────────────────────
//
//  • Moves toward goal most of the time using near-best move pool (feels human).
//  • 20% chance to place a wall — but only one that genuinely slows the human
//    (score >= 0.5) so it never accidentally helps the opponent.
//  • 25% random detour so it feels clearly beatable.
// ─────────────────────────────────────────────────────────────────────────────

function easyAIMove(gameState: GameState): GameAction {
  const aiIdx  = gameState.currentPlayer as 0 | 1;
  const oppIdx = (1 - aiIdx) as 0 | 1;
  const ai     = gameState.players[aiIdx];
  const opp    = gameState.players[oppIdx];

  const validMoves = getValidMoves(ai.position, opp.position, gameState.walls);

  // Occasional wall — only if it genuinely slows the opponent
  if (ai.wallsRemaining > 0 && Math.random() < 0.20) {
    const candidate = findBestWall(gameState, aiIdx, oppIdx, 0.75, 0.90);
    if (candidate && candidate.score >= 0.5) {
      return { type: 'wall', player: aiIdx, wall: candidate.wall };
    }
  }

  // 25% random detour — makes it feel beatable
  if (Math.random() < 0.25 && validMoves.length > 0) {
    const target = validMoves[Math.floor(Math.random() * validMoves.length)];
    return { type: 'move', player: aiIdx, from: ai.position, to: target };
  }

  const move = chooseMove(validMoves, ai.goalRow, gameState.walls, 0.18);
  return { type: 'move', player: aiIdx, from: ai.position, to: move ?? ai.position };
}

// ─────────────────────────────────────────────────────────────────────────────
// MEDIUM AI — Club Player
// ─────────────────────────────────────────────────────────────────────────────
//
//  • Always moves optimally toward goal (near-best pool, small variance).
//  • Places walls tactically: score threshold tightens when opponent is close
//    to winning (urgent mode) and loosens when AI is clearly behind.
//  • Keeps a 2-wall reserve — raises threshold when running low.
//  • 50% random gate prevents constant wall spam.
// ─────────────────────────────────────────────────────────────────────────────

function mediumAIMove(gameState: GameState): GameAction {
  const aiIdx  = gameState.currentPlayer as 0 | 1;
  const oppIdx = (1 - aiIdx) as 0 | 1;
  const ai     = gameState.players[aiIdx];
  const opp    = gameState.players[oppIdx];

  const validMoves = getValidMoves(ai.position, opp.position, gameState.walls);

  const aiLen  = safePathLen(ai.position.row,  ai.position.col,  ai.goalRow,  gameState.walls);
  const oppLen = safePathLen(opp.position.row, opp.position.col, opp.goalRow, gameState.walls);

  const threatened      = oppLen <= aiLen + 2 || oppLen <= 4;
  let   wallThreshold   = threatened ? 0.75 : 1.35;
  if (ai.wallsRemaining <= 2) wallThreshold += 0.20; // protect wall reserve

  if (ai.wallsRemaining > 0 && Math.random() < (threatened ? 0.70 : 0.50)) {
    const candidate = findBestWall(gameState, aiIdx, oppIdx, 1.10, 1.15);
    if (candidate && candidate.score >= wallThreshold) {
      return { type: 'wall', player: aiIdx, wall: candidate.wall };
    }
  }

  const move = chooseMove(validMoves, ai.goalRow, gameState.walls, 0.28);
  return { type: 'move', player: aiIdx, from: ai.position, to: move ?? ai.position };
}

// ─────────────────────────────────────────────────────────────────────────────
// HARD AI — Grandmaster
// ─────────────────────────────────────────────────────────────────────────────
//
//  Priority order each turn:
//
//  1. INSTANT WIN     — if any valid move reaches the goal row, take it.
//  2. EMERGENCY BLOCK — if opponent wins in <= 2 moves, drop the best wall
//                       immediately, ignoring normal thresholds.
//  3. STRATEGIC WALL  — adaptive threshold by race gap, game phase, opponent
//                       proximity to win, and remaining wall count.
//  4. OPTIMAL MOVE    — near-best pool (tiny variance) toward goal row.
// ─────────────────────────────────────────────────────────────────────────────

function hardAIMove(gameState: GameState): GameAction {
  const aiIdx  = gameState.currentPlayer as 0 | 1;
  const oppIdx = (1 - aiIdx) as 0 | 1;
  const ai     = gameState.players[aiIdx];
  const opp    = gameState.players[oppIdx];

  const validMoves = getValidMoves(ai.position, opp.position, gameState.walls);

  const aiLen  = safePathLen(ai.position.row,  ai.position.col,  ai.goalRow,  gameState.walls);
  const oppLen = safePathLen(opp.position.row, opp.position.col, opp.goalRow, gameState.walls);

  // ── 1. INSTANT WIN ──────────────────────────────────────────────────────
  for (const move of validMoves) {
    if (move.row === ai.goalRow) {
      return { type: 'move', player: aiIdx, from: ai.position, to: move };
    }
  }

  // ── 2. EMERGENCY BLOCK ──────────────────────────────────────────────────
  if (ai.wallsRemaining > 0 && oppLen <= 2) {
    const candidate = findBestWall(gameState, aiIdx, oppIdx, 2.0, 0.1);
    if (candidate && candidate.score >= 0.5) {
      return { type: 'wall', player: aiIdx, wall: candidate.wall };
    }
  }

  // ── 3. STRATEGIC WALL ───────────────────────────────────────────────────
  if (ai.wallsRemaining > 0) {
    const turnsPlayed = gameState.moveCount[0] + gameState.moveCount[1];
    const threatGap   = aiLen - oppLen; // positive = opponent is closer to winning

    // Base threshold by race gap
    let wallThreshold =
      threatGap >= 2 ? 0.55 :  // clearly losing  → aggressive
      threatGap >= 0 ? 0.80 :  // roughly even    → standard
                       1.15;   // AI is ahead     → don't waste turns

    // Game-phase modifiers
    if (turnsPlayed < 6)  wallThreshold += 0.50; // early game → conservative
    else if (turnsPlayed < 16) wallThreshold += 0.20; // mid game → slight caution

    // Situation modifiers
    if (oppLen <= 4)            wallThreshold -= 0.10; // opponent near win → press harder
    if (ai.wallsRemaining <= 2) wallThreshold += 0.15; // protect reserve

    // Bias — how likely to act once threshold is met
    const wallBias = threatGap >= 1 ? 0.88 : 0.72;

    const candidate = findBestWall(gameState, aiIdx, oppIdx, 1.35, 1.30);
    if (candidate && candidate.score >= wallThreshold && Math.random() < wallBias) {
      return { type: 'wall', player: aiIdx, wall: candidate.wall };
    }
  }

  // ── 4. OPTIMAL MOVE ─────────────────────────────────────────────────────
  const move = chooseMove(validMoves, ai.goalRow, gameState.walls, 0.10);
  return { type: 'move', player: aiIdx, from: ai.position, to: move ?? ai.position };
}

// ─────────────────────────────────────────────────────────────────────────────
// WALL EVALUATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Scans all 128 possible wall positions and returns the best one.
 *
 * score = (opponentPathGain × humanGainWeight) − (aiPathCost × aiPenaltyWeight)
 *
 * Additional bonuses / penalties applied per candidate:
 *   +0.35  when opponent is only marginally ahead (makes walls feel urgent)
 *   +0.25  when opponent is within 4 steps of winning
 *   +0.03  per row of proximity to opponent's current position (spatial bias)
 *   −0.60  for "helpful walls" where both paths shrink (bad placement)
 *
 * IMPORTANT — isValidWallPlacement(wall, existingWalls, p1Pos, p2Pos):
 *   The engine internally checks that p1 can still reach row 0 and p2 can
 *   still reach row 8.  We always pass players[0] as p1 and players[1] as p2
 *   regardless of which seat the AI occupies, to match the engine contract.
 */
function findBestWall(
  gameState: GameState,
  aiIdx: 0 | 1,
  oppIdx: 0 | 1,
  humanGainWeight: number,
  aiPenaltyWeight: number,
): CandidateWall | null {
  const ai  = gameState.players[aiIdx];
  const opp = gameState.players[oppIdx];

  if (ai.wallsRemaining <= 0) return null;

  const baseAiLen  = safePathLen(ai.position.row,  ai.position.col,  ai.goalRow,  gameState.walls);
  const baseOppLen = safePathLen(opp.position.row, opp.position.col, opp.goalRow, gameState.walls);

  // Always use the fixed seat order that matches the engine's path contracts
  const p1 = gameState.players[0];
  const p2 = gameState.players[1];

  let best: CandidateWall | null = null;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      for (const orientation of ['horizontal', 'vertical'] as const) {
        const wall: Wall = { row: r, col: c, orientation };

        if (!isValidWallPlacement(wall, gameState.walls, p1.position, p2.position)) continue;

        const testWalls  = [...gameState.walls, wall];
        const newOppLen  = safePathLen(opp.position.row, opp.position.col, opp.goalRow, testWalls);
        const newAiLen   = safePathLen(ai.position.row,  ai.position.col,  ai.goalRow,  testWalls);

        const humanDelta = newOppLen - baseOppLen; // steps added to opponent
        const aiDelta    = newAiLen  - baseAiLen;  // steps added to ourselves

        let score = humanDelta * humanGainWeight - aiDelta * aiPenaltyWeight;

        // Situation bonuses
        if (baseOppLen <= baseAiLen + 2) score += 0.35;
        if (baseOppLen <= 4)             score += 0.25;

        // Penalty for walls that shrink both paths (AI accidentally helps itself
        // but also gives opponent a shorter route — net negative intent)
        if (humanDelta <= 0 && aiDelta < 0) score -= 0.60;

        // Spatial proximity bias — walls near the opponent's forward lane score higher
        const progressBias = opp.position.row - r;
        score += Math.max(0, progressBias) * 0.03;

        if (!best || score > best.score) {
          best = { wall, score, humanDelta, aiDelta };
        }
      }
    }
  }

  return best;
}

// ─────────────────────────────────────────────────────────────────────────────
// MOVE SELECTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Picks the best move toward goalRow with human-like variance.
 *
 * Ranks all valid moves by BFS distance to goalRow, then:
 *   • With prob `variance`       → picks randomly from moves within +1 of best
 *     distance (near-best pool — feels natural, rarely loses meaningful ground)
 *   • With prob `variance × 0.35`→ picks the second-best move
 *     (occasional suboptimal step — intentional only for Easy/Medium)
 *   • Otherwise                  → strict BFS-optimal move
 *
 * Tiebreaker: central column (col 4) preference via a tiny penalty.
 * Central positions give more future wall options — a genuine Quoridor heuristic.
 */
function chooseMove(
  validMoves: Position[],
  goalRow: number,
  walls: Wall[],
  variance: number,
): Position | null {
  if (validMoves.length === 0) return null;
  if (validMoves.length === 1) return validMoves[0];

  const scored = validMoves
    .map(move => ({
      move,
      // Tiny centre-column tiebreaker so AI doesn't hug edges
      dist: safePathLen(move.row, move.col, goalRow, walls)
            + Math.abs(move.col - 4) * 0.01,
    }))
    .sort((a, b) => a.dist - b.dist);

  const bestDist = scored[0].dist;
  const nearBest = scored.filter(s => s.dist <= bestDist + 1);

  // Near-best pool variance
  if (nearBest.length > 1 && Math.random() < variance) {
    return nearBest[Math.floor(Math.random() * nearBest.length)].move;
  }

  // Occasional second-best step (only meaningful with higher variance values)
  if (scored.length > 1 && Math.random() < variance * 0.35) {
    return scored[1].move;
  }

  return scored[0].move;
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * BFS path length with a finite fallback.
 * Returns 99 if no path exists — guards against any edge case where BFS
 * returns Infinity in an otherwise valid game state.
 */
function safePathLen(
  row: number,
  col: number,
  goalRow: number,
  walls: Wall[],
): number {
  const len = bfsShortestPathLength(row, col, goalRow, walls);
  return Number.isFinite(len) ? len : 99;
}