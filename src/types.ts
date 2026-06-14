export type SpaceKind =
  | "start"
  | "land"
  | "zombie"
  | "dragon"
  | "treasure"
  | "safe";

export type Phase = "roll" | "result" | "handoff" | "gameover";

export interface BoardSpace {
  id: number;
  name: string;
  kind: SpaceKind;
  icon: string;
  color: string;
  price?: number;
  rent?: number;
  ownerId?: number;
}

export interface Player {
  id: number;
  name: string;
  color: string;
  token: string;
  coins: number;
  position: number;
  alive: boolean;
}

export interface GameState {
  version: 2;
  status: "playing" | "gameover";
  players: Player[];
  board: BoardSpace[];
  currentPlayer: number;
  round: number;
  phase: Phase;
  die: number | null;
  message: string;
  messageIcon: string;
  winnerId?: number;
  seed: number;
}

export type GameAction =
  | { type: "ROLL" }
  | { type: "END_TURN" }
  | { type: "CONTINUE" };
