import { describe, expect, it } from "vitest";
import { createGame, gameReducer, isValidSave } from "./game";

describe("simple game engine", () => {
  it("creates a 16-space, one-button game", () => {
    const game = createGame(["A", "B"], 123);
    expect(game.board).toHaveLength(16);
    expect(game.players[0].coins).toBe(100);
    expect(game.phase).toBe("roll");
    expect(isValidSave(game)).toBe(true);
  });

  it("rolls one die and resolves the space automatically", () => {
    const game = createGame(["A", "B"], 1);
    const next = gameReducer(game, { type: "ROLL" });
    expect(next.die).toBeGreaterThanOrEqual(1);
    expect(next.die).toBeLessThanOrEqual(6);
    expect(next.phase).toBe("result");
    expect(next.players[0].position).toBe(next.die);
  });

  it("automatically buys affordable empty land", () => {
    const game = createGame(["A", "B"], 1);
    game.players[0].position = 15;
    game.seed = 1;
    const next = gameReducer(game, { type: "ROLL" });
    const space = next.board[next.players[0].position];
    if (space.kind === "land") {
      expect(space.ownerId).toBe(0);
    }
    expect(next.phase).toBe("result");
  });

  it("moves through roll, result, handoff, roll", () => {
    let game = createGame(["A", "B"], 5);
    game = gameReducer(game, { type: "ROLL" });
    game = gameReducer(game, { type: "END_TURN" });
    expect(game.phase).toBe("handoff");
    expect(game.currentPlayer).toBe(1);
    game = gameReducer(game, { type: "CONTINUE" });
    expect(game.phase).toBe("roll");
  });

  it("rejects old or malformed saves", () => {
    expect(isValidSave({ version: 1, players: [], board: [] })).toBe(false);
    expect(isValidSave(null)).toBe(false);
  });

  it("finishes an automatic match with a winner", () => {
    let game = createGame(["A", "B", "C", "D"], 99);
    let actions = 0;
    while (game.status !== "gameover" && actions < 200) {
      if (game.phase === "roll") game = gameReducer(game, { type: "ROLL" });
      else if (game.phase === "result") game = gameReducer(game, { type: "END_TURN" });
      else if (game.phase === "handoff") game = gameReducer(game, { type: "CONTINUE" });
      actions += 1;
    }
    expect(game.status).toBe("gameover");
    expect(game.winnerId).toBeDefined();
    expect(actions).toBeLessThan(200);
  });
});
