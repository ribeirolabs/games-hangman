import { FormEvent, Fragment, useEffect, useRef, useState } from "react";
import {
  ArrowRightIcon,
  BlockIcon,
  ChatIcon,
  PencilIcon,
} from "../components/Icons";
import { useGameAction, useGameState } from "../core";
import { cn } from "../utils";

export function PlayGame() {
  const state = useGameState("playing");

  return (
    <div className="flex flex-col h-screen">
      <Players />

      <div className="p-4 flex flex-col gap-8 items-center flex-1">
        <WordPanel />

        <GuessOptions />
      </div>

      <div className="p-4 w-full bg-gray-200 flex flex-col gap-3">
        <div className="flex flex-col w-full justify-start">
          <span className="uppercase tracking-wider font-extrabold text-sm">
            Letras
          </span>
          <div className="flex h-8 gap-1">
            {Object.keys(state.round.lettersGuessed).map((letter) => (
              <div
                key={letter}
                className="bg-neutral-700 text-white flex justify-center items-center font-extrabold rounded-full w-8 text-xl"
              >
                {letter}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col w-full justify-start">
          <span className="uppercase tracking-wider font-extrabold text-sm">
            Palavras
          </span>
          <div className="flex h-8 gap-1">
            {Object.keys(state.round.wordsGuessed).map((word) => (
              <div
                key={word}
                className="bg-neutral-700 text-white flex justify-center items-center font-extrabold rounded-full text-sm px-4"
              >
                {word}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Players() {
  const { game, round } = useGameState("playing");
  const players = [...game.players]
    .map((player) => {
      const isHost = round.host === player.id;
      const isTurn = round.turn === player.id;

      return {
        ...player,
        state: isHost ? "host" : isTurn ? "turn" : "waiting",
      };
    })
    .sort((a, b) => (a.state === "host" ? -1 : b.state === "host" ? 1 : 0));

  return (
    <header className="p-3 pt-12 gap-3 flex w-full bg-neutral-900">
      {players.map((player) => {
        const isHost = round.host === player.id;
        const isWinner = round.winner === player.id;
        const isTurn = round.turn === player.id && round.winner == null;
        const letterGuesses = round.playerGuesses[player.id].letters;
        const wordGuesses = round.playerGuesses[player.id].words;
        const isOut = wordGuesses > 0 ? false : letterGuesses === 0;

        return (
          <div
            key={player.id}
            className={cn(
              "flex-1 flex flex-col text-white rounded relative",
              isWinner
                ? "bg-green-400 text-black/70 animate-pulse"
                : isHost
                ? "bg-info-700"
                : isTurn
                ? "animate-bounce bg-neutral-200/40"
                : isOut
                ? "opacity-40"
                : "bg-neutral-700"
            )}
          >
            <div className="flex justify-between p-2">
              <div
                className={cn(
                  "flex items-center justify-center gap-2 text-3xl uppercase font-bold flex-grow-0 tracking-wider"
                )}
              >
                <span>{player.name}</span>
                {isHost && <PencilIcon />}
                {isTurn && <ChatIcon />}
                {isOut && <BlockIcon />}
              </div>

              <div className="text-3xl font-extrabold">
                {game.playerPoints[player.id]}
              </div>
            </div>

            <div
              className={cn(
                "flex-1 flex justify-between font-bold p-2 bg-neutral-800/30 uppercase"
              )}
            >
              {isHost ? null : (
                <div className="flex justify-around flex-[2]">
                  <div className="flex-1 text-center">
                    <div className="text-[10px]">Letras</div>
                    <div className="text-2xl">{letterGuesses}</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-[10px]">Chutes</div>
                    <div className="text-2xl">{wordGuesses}</div>
                  </div>
                </div>
              )}

              <div className="h-full flex items-center justify-end flex-1">
                <div className="flex items-center justify-center">
                  <div className="text-xl">+</div>
                  <div className="text-4xl">{round.points[player.id]}</div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </header>
  );
}

function WordPanel() {
  const { round, type } = useGameState("playing");
  const [show, setShow] = useState(false);

  const letters = round.word.split("");

  function toggle() {
    setShow((current) => !current);
  }

  return (
    <div className="flex-1 flex flex-col justify-center gap-4">
      <h1 className="text-center">{round.hint}</h1>
      <div className="w-fit flex gap-2 h-16 items-center justify-center mx-auto">
        {letters.map((letter, i) => {
          const isGuessed = round.lettersGuessed[letter];
          const winner =
            round.winner == null
              ? null
              : round.winner === round.host
              ? "host"
              : "player";

          return (
            <div
              className={cn(
                "flex-1 w-16 h-full rounded flex items-center justify-center text-5xl font-extrabold",
                isGuessed || winner === "player"
                  ? "bg-green-200 border border-green-600"
                  : winner === "host"
                  ? "bg-red-200 border border-red-600"
                  : show
                  ? "border-2 border-dotted border-gray-400 text-gray-400"
                  : "bg-gray-300"
              )}
              key={`${letter}-${i}`}
            >
              {isGuessed || round.winner || show ? letter : null}
            </div>
          );
        })}
      </div>

      {type === "game" && round.winner == null ? (
        <div className="text-center">
          <button className="btn" onClick={toggle}>
            {show ? (
              <>
                <span>Esconder palavra</span>
              </>
            ) : (
              <>
                <span>Mostra palavra</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div>&nbsp;</div>
      )}
    </div>
  );
}

const LABEL = {
  letter: "letra",
  word: "palavra",
};

function GuessOptions() {
  const state = useGameState("playing");
  const send = useGameAction();
  const [word, setWord] = useState("");
  const channel = useRef(new BroadcastChannel("hangman/guess-word"));

  useEffect(() => {
    if (state.type === "presentation" || state.round.guessMode === "word") {
      return;
    }

    function listener(e: KeyboardEvent) {
      const isLetter = /^\w$/.test(e.key);

      if (!isLetter || e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) {
        return;
      }

      send({
        type: "guessLetter",
        letter: e.key,
      });
    }

    window.addEventListener("keyup", listener);
    return () => window.removeEventListener("keyup", listener);
  }, [state.type, state.round.guessMode]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const target = e.target as HTMLFormElement;
    const data = new FormData(target);

    send({ type: "guessWord", word: data.get("word") as string });

    target.reset();
  }

  useEffect(() => {
    if (state.type === "game") {
      return;
    }

    function listener(e: MessageEvent<string>) {
      setWord(e.data);
    }

    channel.current.addEventListener("message", listener);

    return () => channel.current.removeEventListener("message", listener);
  }, [state.type]);

  if (state.round.winner) {
    return (
      <div>
        <button
          className="btn"
          onClick={() => send({ type: "nextRound" })}
          autoFocus
        >
          <span>Próxima rodada</span>
          <ArrowRightIcon />
        </button>
      </div>
    );
  }

  return (
    <>
      {state.type === "game" ? (
        <>
          <div className="flex w-fit text-white uppercase font-extrabold text-lg items-center gap-4">
            {state.round.guessModeOptions.map((mode, i, options) => (
              <Fragment key={mode}>
                <button
                  onClick={() => send({ type: "setGuessMode", mode })}
                  className={cn(
                    "rounded-full px-6 py-2 border border-gray-400 uppercase tracking-wider",
                    mode === state.round.guessMode
                      ? "bg-info-700 border-transparent text-white"
                      : "text-black"
                  )}
                >
                  Chutar {LABEL[mode]}
                </button>

                {i < options.length - 1 && (
                  <span className="text-gray-600 text-sm">ou</span>
                )}
              </Fragment>
            ))}
          </div>

          {state.round.guessMode === "word" && (
            <form onSubmit={onSubmit}>
              <label className="input-label col-start-1 row-start-1">
                <span>Palavra</span>
                <input
                  type="text"
                  name="word"
                  autoFocus
                  onChange={(e) => {
                    channel.current.postMessage(e.target.value.toUpperCase());
                  }}
                />
              </label>
            </form>
          )}
        </>
      ) : state.round.guessMode === "word" ? (
        <h1>chute: {word}</h1>
      ) : null}
    </>
  );
}
