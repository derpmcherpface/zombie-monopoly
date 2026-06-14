import { useEffect, useMemo, useReducer, useState } from "react";
import { playSound } from "./audio";
import { createGame, gameReducer, isValidSave, playerChoices } from "./game";
import type { GameAction, GameState } from "./types";
import hero from "./assets/hero.png";

const SAVE_KEY = "doom-and-deeds-save";
const SETTINGS_KEY = "doom-and-deeds-settings";

function loadSave(): GameState | null {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SAVE_KEY) ?? "null");
    return isValidSave(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function Setup({ onStart }: { onStart: (names: string[]) => void }) {
  const [count, setCount] = useState(2);
  const [names, setNames] = useState(["Zed", "Drago", "Boo", "Wiz"]);

  return (
    <main className="setup simple-setup">
      <img className="hero-art" src={hero} alt="" />
      <section className="hero-copy">
        <h1>Doom <span>&amp;</span> Deeds</h1>
        <div className="three-rules">
          <div><b>1</b><span>ROLL</span></div>
          <div><b>2</b><span>MOVE</span></div>
          <div><b>3</b><span>GET RICH</span></div>
        </div>
        <div className="setup-card">
          <h2>How many players?</h2>
          <div className="big-count">
            {[2, 3, 4].map((value) => (
              <button
                className={count === value ? "active" : ""}
                onClick={() => setCount(value)}
                key={value}
              >
                {value}
              </button>
            ))}
          </div>
          <div className="name-grid">
            {names.slice(0, count).map((name, index) => (
              <label
                key={index}
                style={{ "--player": playerChoices[index].color } as React.CSSProperties}
              >
                <span className="mini-token">{playerChoices[index].token}</span>
                <input
                  aria-label={`Player ${index + 1} name`}
                  value={name}
                  maxLength={12}
                  onChange={(event) => {
                    const next = [...names];
                    next[index] = event.target.value;
                    setNames(next);
                  }}
                />
              </label>
            ))}
          </div>
          <button className="primary start giant" onClick={() => onStart(names.slice(0, count))}>
            ▶ PLAY
          </button>
        </div>
      </section>
    </main>
  );
}

function Board({ state }: { state: GameState }) {
  return (
    <div className="board-wrap">
      <div className="board simple-board">
        <div className="board-center">
          <strong>ROUND</strong>
          <b>{state.round} / 8</b>
          <small>Most treasure wins</small>
        </div>
        {state.board.map((space, index) => {
          const angle = (index / state.board.length) * 360 - 90;
          const players = state.players.filter(
            (player) => player.alive && player.position === space.id
          );
          const owner = state.players.find((player) => player.id === space.ownerId);
          return (
            <div
              key={space.id}
              className={`space ${space.kind}`}
              style={{
                "--angle": `${angle}deg`,
                "--space-color": space.color,
                "--owner": owner?.color ?? "transparent"
              } as React.CSSProperties}
            >
              <span className="space-icon">{space.icon}</span>
              <strong className="space-name">{space.name}</strong>
              {space.kind === "land" && (
                <small>{owner ? `${space.rent} RENT` : `${space.price} BUY`}</small>
              )}
              {owner && <b className="owner-flag" style={{ background: owner.color }}>{owner.token}</b>}
              <span className="tokens">
                {players.map((player) => (
                  <i key={player.id} style={{ background: player.color }}>
                    {player.token}
                  </i>
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlayerCard({
  player,
  current
}: {
  player: GameState["players"][number];
  current: boolean;
}) {
  return (
    <article className={`player-card ${current ? "current" : ""} ${!player.alive ? "out" : ""}`}>
      <span className="portrait" style={{ background: player.color }}>{player.token}</span>
      <strong>{player.name}</strong>
      <b className="coin-count">🪙 {player.coins}</b>
    </article>
  );
}

function Controls({
  state,
  dispatch,
  muted
}: {
  state: GameState;
  dispatch: (action: GameAction) => void;
  muted: boolean;
}) {
  const player = state.players[state.currentPlayer];
  const action = (gameAction: GameAction, sound: "roll" | "coin" = "coin") => {
    playSound(sound, muted);
    dispatch(gameAction);
  };

  return (
    <section className={`controls simple-controls phase-${state.phase}`}>
      <div className="turn-heading">
        <span style={{ background: player.color }}>{player.token}</span>
        <div><small>YOUR TURN</small><h2>{player.name}</h2></div>
      </div>

      {state.phase === "roll" && (
        <>
          <div className="instruction-icon">🎲</div>
          <h3>Press the big button</h3>
          <button className="primary mega-action" onClick={() => action({ type: "ROLL" }, "roll")}>
            🎲 ROLL
          </button>
        </>
      )}

      {state.phase === "result" && (
        <>
          {state.die && <div className="big-die">{state.die}</div>}
          <div className="result-icon">{state.messageIcon}</div>
          <p className="message">{state.message}</p>
          <button className="primary mega-action" onClick={() => dispatch({ type: "END_TURN" })}>
            DONE ✓
          </button>
        </>
      )}

      {state.phase === "handoff" && (
        <>
          <div className="instruction-icon">👉</div>
          <p className="message">{state.message}</p>
          <button className="primary mega-action" onClick={() => dispatch({ type: "CONTINUE" })}>
            I'M {player.name.toUpperCase()}
          </button>
        </>
      )}
    </section>
  );
}

function Rules({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="modal simple-rules">
        <button className="close" onClick={onClose}>×</button>
        <h2>That’s it. Just roll.</h2>
        <div className="rule-cards">
          <div><span>🏰</span><b>LAND</b><p>Free land is bought for you. Rival land costs rent.</p></div>
          <div><span>💰</span><b>GOOD</b><p>Treasure and camps give you coins.</p></div>
          <div><span>🧟🐲</span><b>BAD</b><p>Zombies and dragons take your coins.</p></div>
          <div><span>🏆</span><b>WIN</b><p>After 8 rounds, the richest player wins.</p></div>
        </div>
        <button className="primary giant" onClick={onClose}>OK, PLAY!</button>
      </section>
    </div>
  );
}

function Game({ initial, onQuit }: { initial: GameState; onQuit: () => void }) {
  const [state, dispatch] = useReducer(gameReducer, initial);
  const [rules, setRules] = useState(false);
  const [muted, setMuted] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "false") as boolean;
    } catch {
      return false;
    }
  });

  useEffect(() => localStorage.setItem(SAVE_KEY, JSON.stringify(state)), [state]);
  useEffect(() => localStorage.setItem(SETTINGS_KEY, JSON.stringify(muted)), [muted]);

  const winner = state.players.find((player) => player.id === state.winnerId);
  if (winner) {
    return (
      <main className="victory">
        <img src={hero} alt="" />
        <section>
          <div className="winner-token" style={{ background: winner.color }}>{winner.token}</div>
          <h1>{winner.name} wins!</h1>
          <p>🪙 {winner.coins} coins plus all owned land</p>
          <button className="primary giant" onClick={onQuit}>PLAY AGAIN</button>
        </section>
      </main>
    );
  }

  return (
    <main className="game simple-game">
      <header>
        <div className="brand"><span>☠</span><strong>Doom <i>&amp;</i> Deeds</strong></div>
        <div className="header-actions">
          <button onClick={() => setMuted(!muted)} aria-label={muted ? "Unmute" : "Mute"}>
            {muted ? "🔇" : "🔊"}
          </button>
          <button onClick={() => setRules(true)}>❓ HELP</button>
          <button className="danger" onClick={onQuit}>✕</button>
        </div>
      </header>
      <aside className="players">
        {state.players.map((player) => (
          <PlayerCard
            player={player}
            current={player.id === state.currentPlayer}
            key={player.id}
          />
        ))}
        <div className="legend">
          <span>💰 +20</span>
          <span>⛺ +10</span>
          <span>🧟 −15</span>
          <span>🐲 −25</span>
        </div>
      </aside>
      <Board state={state} />
      <Controls state={state} dispatch={dispatch} muted={muted} />
      {rules && <Rules onClose={() => setRules(false)} />}
    </main>
  );
}

export default function App() {
  const existing = useMemo(loadSave, []);
  const [game, setGame] = useState<GameState | null>(null);
  const [showResume, setShowResume] = useState(Boolean(existing));

  if (showResume && existing && !game) {
    return (
      <main className="resume-screen">
        <section className="resume-card">
          <div className="instruction-icon">🎮</div>
          <h1>Keep playing?</h1>
          <p>Round {existing.round} of 8</p>
          <button className="primary giant" onClick={() => {
            setGame(existing);
            setShowResume(false);
          }}>
            YES
          </button>
          <button onClick={() => {
            localStorage.removeItem(SAVE_KEY);
            setShowResume(false);
          }}>
            NEW GAME
          </button>
        </section>
      </main>
    );
  }

  if (!game) return <Setup onStart={(names) => setGame(createGame(names))} />;

  return (
    <Game
      initial={game}
      onQuit={() => {
        localStorage.removeItem(SAVE_KEY);
        setGame(null);
        setShowResume(false);
      }}
    />
  );
}
