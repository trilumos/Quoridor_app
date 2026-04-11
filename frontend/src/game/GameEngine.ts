import { Position, Wall, GameState, PlayerState } from "./types";

function edgeKey(r1: number, c1: number, r2: number, c2: number): string {
  if (r1 < r2 || (r1 === r2 && c1 < c2)) return `${r1},${c1}-${r2},${c2}`;
  return `${r2},${c2}-${r1},${c1}`;
}

export function buildBlockedEdges(walls: Wall[]): Set<string> {
  const blocked = new Set<string>();
  for (const wall of walls) {
    if (wall.orientation === "horizontal") {
      blocked.add(edgeKey(wall.row, wall.col, wall.row + 1, wall.col));
      blocked.add(edgeKey(wall.row, wall.col + 1, wall.row + 1, wall.col + 1));
    } else {
      blocked.add(edgeKey(wall.row, wall.col, wall.row, wall.col + 1));
      blocked.add(edgeKey(wall.row + 1, wall.col, wall.row + 1, wall.col + 1));
    }
  }
  return blocked;
}

export function isEdgeBlocked(
  r1: number,
  c1: number,
  r2: number,
  c2: number,
  blocked: Set<string>,
): boolean {
  return blocked.has(edgeKey(r1, c1, r2, c2));
}

const DIRS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

export function hasPath(
  startRow: number,
  startCol: number,
  goalRow: number,
  walls: Wall[],
): boolean {
  if (startRow === goalRow) return true;
  const blocked = buildBlockedEdges(walls);
  const visited = new Set<string>();
  const queue: number[][] = [[startRow, startCol]];
  visited.add(`${startRow},${startCol}`);
  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr > 8 || nc < 0 || nc > 8) continue;
      const key = `${nr},${nc}`;
      if (visited.has(key)) continue;
      if (isEdgeBlocked(r, c, nr, nc, blocked)) continue;
      if (nr === goalRow) return true;
      visited.add(key);
      queue.push([nr, nc]);
    }
  }
  return false;
}

export function bfsShortestPathLength(
  startRow: number,
  startCol: number,
  goalRow: number,
  walls: Wall[],
): number {
  if (startRow === goalRow) return 0;
  const blocked = buildBlockedEdges(walls);
  const visited = new Set<string>();
  const queue: number[][] = [[startRow, startCol, 0]];
  visited.add(`${startRow},${startCol}`);
  while (queue.length > 0) {
    const [r, c, dist] = queue.shift()!;
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr > 8 || nc < 0 || nc > 8) continue;
      const key = `${nr},${nc}`;
      if (visited.has(key)) continue;
      if (isEdgeBlocked(r, c, nr, nc, blocked)) continue;
      if (nr === goalRow) return dist + 1;
      visited.add(key);
      queue.push([nr, nc, dist + 1]);
    }
  }
  return 999;
}

export function bfsShortestPath(
  startRow: number,
  startCol: number,
  goalRow: number,
  walls: Wall[],
): Position[] | null {
  if (startRow === goalRow) return [{ row: startRow, col: startCol }];
  const blocked = buildBlockedEdges(walls);
  const visited = new Set<string>();
  const parent = new Map<string, string>();
  const queue: number[][] = [[startRow, startCol]];
  visited.add(`${startRow},${startCol}`);
  let goalKey: string | null = null;
  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    const key = `${r},${c}`;
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr > 8 || nc < 0 || nc > 8) continue;
      const nkey = `${nr},${nc}`;
      if (visited.has(nkey)) continue;
      if (isEdgeBlocked(r, c, nr, nc, blocked)) continue;
      visited.add(nkey);
      parent.set(nkey, key);
      if (nr === goalRow) {
        goalKey = nkey;
        break;
      }
      queue.push([nr, nc]);
    }
    if (goalKey) break;
  }
  if (!goalKey) return null;
  const path: Position[] = [];
  let current: string | undefined = goalKey;
  while (current) {
    const [r, c] = current.split(",").map(Number);
    path.unshift({ row: r, col: c });
    current = parent.get(current);
  }
  return path;
}

export function getValidMoves(
  playerPos: Position,
  opponentPos: Position,
  walls: Wall[],
): Position[] {
  const blocked = buildBlockedEdges(walls);
  const moves: Position[] = [];
  for (const [dr, dc] of DIRS) {
    const nr = playerPos.row + dr;
    const nc = playerPos.col + dc;
    if (nr < 0 || nr > 8 || nc < 0 || nc > 8) continue;
    if (isEdgeBlocked(playerPos.row, playerPos.col, nr, nc, blocked)) continue;
    if (nr === opponentPos.row && nc === opponentPos.col) {
      const jr = nr + dr;
      const jc = nc + dc;
      if (
        jr >= 0 &&
        jr <= 8 &&
        jc >= 0 &&
        jc <= 8 &&
        !isEdgeBlocked(nr, nc, jr, jc, blocked)
      ) {
        moves.push({ row: jr, col: jc });
      } else {
        const perpDirs =
          dc === 0
            ? [
                [0, -1],
                [0, 1],
              ]
            : [
                [-1, 0],
                [1, 0],
              ];
        for (const [pdr, pdc] of perpDirs) {
          const diagR = nr + pdr;
          const diagC = nc + pdc;
          if (
            diagR >= 0 &&
            diagR <= 8 &&
            diagC >= 0 &&
            diagC <= 8 &&
            !isEdgeBlocked(nr, nc, diagR, diagC, blocked)
          ) {
            moves.push({ row: diagR, col: diagC });
          }
        }
      }
    } else {
      moves.push({ row: nr, col: nc });
    }
  }
  return moves;
}

export function isValidWallPlacement(
  wall: Wall,
  existingWalls: Wall[],
  p1Pos: Position,
  p2Pos: Position,
): boolean {
  const { row, col, orientation } = wall;
  if (row < 0 || row > 7 || col < 0 || col > 7) return false;
  for (const existing of existingWalls) {
    if (existing.row === row && existing.col === col) return false;
    if (orientation === "horizontal" && existing.orientation === "horizontal") {
      if (existing.row === row && Math.abs(existing.col - col) === 1)
        return false;
    }
    if (orientation === "vertical" && existing.orientation === "vertical") {
      if (existing.col === col && Math.abs(existing.row - row) === 1)
        return false;
    }
  }
  const testWalls = [...existingWalls, wall];
  if (!hasPath(p1Pos.row, p1Pos.col, 0, testWalls)) return false;
  if (!hasPath(p2Pos.row, p2Pos.col, 8, testWalls)) return false;
  return true;
}

export function createInitialGameState(
  p1Name: string,
  p1Color: string,
  p2Name: string,
  p2Color: string,
): GameState {
  return {
    players: [
      {
        position: { row: 8, col: 4 },
        wallsRemaining: 10,
        name: p1Name,
        color: p1Color,
        goalRow: 0,
      },
      {
        position: { row: 0, col: 4 },
        wallsRemaining: 10,
        name: p2Name,
        color: p2Color,
        goalRow: 8,
      },
    ],
    currentPlayer: 0,
    walls: [],
    moveCount: [0, 0],
    wallsPlaced: [0, 0],
    gameOver: false,
    winner: null,
    startTime: Date.now(),
  };
}

export function checkWin(state: GameState): number | null {
  if (state.players[0].position.row === 0) return 0;
  if (state.players[1].position.row === 8) return 1;
  return null;
}

export function applyMove(state: GameState, to: Position): GameState {
  const cp = state.currentPlayer;
  const opponent = cp === 0 ? state.players[1].position : state.players[0].position;
  if (to.row === opponent.row && to.col === opponent.col) {
    return state;
  }
  const newPlayers: [PlayerState, PlayerState] = [
    cp === 0 ? { ...state.players[0], position: to } : { ...state.players[0] },
    cp === 1 ? { ...state.players[1], position: to } : { ...state.players[1] },
  ];
  const newMoveCount: [number, number] = [...state.moveCount];
  newMoveCount[cp]++;
  const newState: GameState = {
    ...state,
    players: newPlayers,
    currentPlayer: (1 - cp) as 0 | 1,
    moveCount: newMoveCount,
  };
  const winner = checkWin(newState);
  if (winner !== null) {
    newState.gameOver = true;
    newState.winner = winner;
  }
  return newState;
}

export function applyWall(state: GameState, wall: Wall): GameState {
  const cp = state.currentPlayer;
  const ownedWall: Wall = { ...wall, owner: cp };
  const newPlayers: [PlayerState, PlayerState] = [
    cp === 0
      ? {
          ...state.players[0],
          wallsRemaining: state.players[0].wallsRemaining - 1,
        }
      : { ...state.players[0] },
    cp === 1
      ? {
          ...state.players[1],
          wallsRemaining: state.players[1].wallsRemaining - 1,
        }
      : { ...state.players[1] },
  ];
  const newWallsPlaced: [number, number] = [...state.wallsPlaced];
  newWallsPlaced[cp]++;
  return {
    ...state,
    players: newPlayers,
    currentPlayer: (1 - cp) as 0 | 1,
    walls: [...state.walls, ownedWall],
    wallsPlaced: newWallsPlaced,
  };
}
