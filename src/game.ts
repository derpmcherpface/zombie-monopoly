import { createBoard } from "./board";
import type { GameAction, GameState } from "./types";

const SAVE_VERSION = 2;
const FINAL_ROUND = 8;

export const playerChoices = [
  { token: "🧟", color: "#91d447", label: "Zombie" },
  { token: "🐲", color: "#a878ef", label: "Dragon" },
  { token: "👻", color: "#f19749", label: "Ghost" },
  { token: "🧙", color: "#51bfca", label: "Wizard" }
];

function random(state: GameState): [number, GameState] {
  const seed = (state.seed * 1664525 + 1013904223) >>> 0;
  return [seed / 4294967296, { ...state, seed }];
}

function randInt(state: GameState, max: number): [number, GameState] {
  const [value, next] = random(state);
  return [Math.floor(value * max), next];
}

export function createGame(names: string[], seed = Date.now() >>> 0): GameState {
  const players = names.map((name, id) => ({
    id,
    name: name.trim() || `Player ${id + 1}`,
    ...playerChoices[id],
    coins: 100,
    position: 0,
    alive: true
  }));

  return {
    version: SAVE_VERSION,
    status: "playing",
    players,
    board: createBoard(),
    currentPlayer: 0,
    round: 1,
    phase: "roll",
    die: null,
    message: `${players[0].name}, press ROLL.`,
    messageIcon: "🎲",
    seed
  };
}

const activePlayer = (state: GameState) => state.players[state.currentPlayer];

function changeCoins(state: GameState, playerId: number, amount: number): GameState {
  return {
    ...state,
    players: state.players.map((player) =>
      player.id === playerId
        ? { ...player, coins: Math.max(0, player.coins + amount) }
        : player
    )
  };
}

function finishIfBroke(state: GameState, playerId: number): GameState {
  const player = state.players[playerId];
  if (player.coins > 0) return state;

  const players = state.players.map((candidate) =>
    candidate.id === playerId ? { ...candidate, alive: false } : candidate
  );
  const board = state.board.map((space) =>
    space.ownerId === playerId ? { ...space, ownerId: undefined } : space
  );
  const alive = players.filter((candidate) => candidate.alive);

  if (alive.length === 1) {
    return {
      ...state,
      players,
      board,
      status: "gameover",
      phase: "gameover",
      winnerId: alive[0].id,
      message: `${alive[0].name} wins!`,
      messageIcon: "🏆"
    };
  }

  return {
    ...state,
    players,
    board,
    message: `${player.name} is out of coins and out of the game!`,
    messageIcon: "💀"
  };
}

function resolveLanding(state: GameState): GameState {
  const player = activePlayer(state);
  const space = state.board[player.position];

  if (space.kind === "start") {
    state = changeCoins(state, player.id, 20);
    return { ...state, message: "START gives you 20 coins!", messageIcon: "🌅" };
  }

  if (space.kind === "land") {
    if (space.ownerId === undefined) {
      if (player.coins >= (space.price ?? 0)) {
        state = changeCoins(state, player.id, -(space.price ?? 0));
        const board = state.board.map((candidate) =>
          candidate.id === space.id ? { ...candidate, ownerId: player.id } : candidate
        );
        return {
          ...state,
          board,
          message: `You bought ${space.name} for ${space.price} coins!`,
          messageIcon: "🏰"
        };
      }
      return {
        ...state,
        message: `${space.name} costs ${space.price}. You need more coins.`,
        messageIcon: "🪙"
      };
    }

    if (space.ownerId === player.id) {
      return { ...state, message: `You own ${space.name}. Nothing to pay!`, messageIcon: "👍" };
    }

    const rent = Math.min(player.coins, space.rent ?? 0);
    state = changeCoins(state, player.id, -rent);
    state = changeCoins(state, space.ownerId, rent);
    state = finishIfBroke(state, player.id);
    return {
      ...state,
      message: `${space.name} belongs to someone else. Pay ${rent} coins.`,
      messageIcon: "💸"
    };
  }

  if (space.kind === "treasure") {
    state = changeCoins(state, player.id, 20);
    return { ...state, message: "TREASURE! You get 20 coins.", messageIcon: "💰" };
  }

  if (space.kind === "safe") {
    state = changeCoins(state, player.id, 10);
    return { ...state, message: "SAFE CAMP! Rest and get 10 coins.", messageIcon: "⛺" };
  }

  if (space.kind === "zombie") {
    const loss = Math.min(player.coins, 15);
    state = changeCoins(state, player.id, -loss);
    state = finishIfBroke(state, player.id);
    return { ...state, message: `ZOMBIES ate ${loss} coins!`, messageIcon: "🧟" };
  }

  const loss = Math.min(player.coins, 25);
  state = changeCoins(state, player.id, -loss);
  state = finishIfBroke(state, player.id);
  return { ...state, message: `DRAGON FIRE burned ${loss} coins!`, messageIcon: "🔥" };
}

function pickWinner(state: GameState): GameState {
  const scores = state.players
    .filter((player) => player.alive)
    .map((player) => ({
      player,
      score:
        player.coins +
        state.board
          .filter((space) => space.ownerId === player.id)
          .reduce((sum, space) => sum + (space.price ?? 0), 0)
    }))
    .sort((a, b) => b.score - a.score);
  const winner = scores[0].player;
  return {
    ...state,
    status: "gameover",
    phase: "gameover",
    winnerId: winner.id,
    message: `${winner.name} has the most treasure!`,
    messageIcon: "🏆"
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  if (state.status === "gameover") return state;

  if (action.type === "ROLL") {
    if (state.phase !== "roll") return state;
    let roll;
    [roll, state] = randInt(state, 6);
    roll += 1;
    const player = activePlayer(state);
    const position = (player.position + roll) % state.board.length;
    const passedStart = player.position + roll >= state.board.length;
    const players = state.players.map((candidate) =>
      candidate.id === player.id
        ? {
            ...candidate,
            position,
            coins: candidate.coins + (passedStart ? 20 : 0)
          }
        : candidate
    );
    state = { ...state, players, die: roll, phase: "result" };
    return resolveLanding(state);
  }

  if (action.type === "END_TURN") {
    if (state.phase !== "result") return state;
    let next = state.currentPlayer;
    do next = (next + 1) % state.players.length;
    while (!state.players[next].alive);
    const wrapped = next <= state.currentPlayer;
    const round = state.round + (wrapped ? 1 : 0);
    if (wrapped && round > FINAL_ROUND) return pickWinner(state);
    return {
      ...state,
      currentPlayer: next,
      round,
      phase: "handoff",
      message: `Pass to ${state.players[next].name}.`,
      messageIcon: "👉"
    };
  }

  if (action.type === "CONTINUE" && state.phase === "handoff") {
    return {
      ...state,
      phase: "roll",
      die: null,
      message: `${activePlayer(state).name}, press ROLL.`,
      messageIcon: "🎲"
    };
  }

  return state;
}

export function isValidSave(value: unknown): value is GameState {
  if (!value || typeof value !== "object") return false;
  const save = value as Partial<GameState>;
  return (
    save.version === SAVE_VERSION &&
    Array.isArray(save.players) &&
    save.players.length >= 2 &&
    Array.isArray(save.board) &&
    save.board.length === 16
  );
}
