import {
  FormEvent,
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowRightIcon,
  BlockIcon,
  ChatIcon,
  PencilIcon,
  TrophyIcon,
} from "../components/Icons";
import { getGuessWordBonus, useGameAction, useGameState } from "../core";
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
            {Object.keys(state.round.lettersGuessed).map((letter) => {
              const isCorrect = state.round.word.includes(letter);

              return (
                <div
                  key={letter}
                  className={cn(
                    "text-black flex justify-center items-center font-extrabold rounded-full w-8 text-xl",
                    isCorrect
                      ? "bg-green-200 border border-green-600"
                      : "bg-red-200 border border-red-600"
                  )}
                >
                  {letter}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col w-full justify-start">
          <span className="uppercase tracking-wider font-extrabold text-sm">
            Palavras
          </span>
          <div className="flex h-8 gap-1">
            {Object.keys(state.round.wordsGuessed).map((word) => {
              const isCorrect = word === state.round.word;

              return (
                <div
                  key={word}
                  className={cn(
                    "text-black flex justify-center items-center font-extrabold rounded-full text-sm px-4",
                    isCorrect
                      ? "bg-green-200 border border-green-600"
                      : "bg-red-200 border border-red-600"
                  )}
                >
                  {word}
                </div>
              );
            })}
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
    <header className="p-3 pt-12 gap-3 flex w-full bg--neutral-900">
      {players.map((player) => {
        const isHost = round.host === player.id;
        const isWinner = round.winner === player.id;
        const isTurn = round.turn === player.id && round.winner == null;
        const letterGuesses = round.playerGuesses[player.id].letters;
        const wordGuesses = round.playerGuesses[player.id].words;
        const isOut = wordGuesses > 0 ? false : letterGuesses === 0;
        const roundPoints = round.points[player.id];

        return (
          <div
            key={player.id}
            className={cn(
              "flex-1 flex flex-col text-white rounded-lg overflow-hidden relative",
              isWinner
                ? "bg-green-700 text-black/70 animate-bounce"
                : isHost && round.winner && !isWinner
                ? "bg-red-900"
                : isHost
                ? "bg-info-700"
                : isTurn
                ? "animate--pulse bg-neutral-900"
                : isOut
                ? "bg-neutral-900/20 text-black/20"
                : "bg-neutral-700"
            )}
          >
            <div className="flex justify-between p-2 px-4">
              <div
                className={cn(
                  "flex items-center justify-center gap-2 text-3xl uppercase font-bold flex-grow-0 tracking-wider"
                )}
              >
                <span>{player.name}</span>
              </div>

              <div className="flex items-center">
                {isHost && round.winner == null && <PencilIcon />}
                {isTurn && (
                  <div className="animate-bounce">
                    <ChatIcon />
                  </div>
                )}
                {isWinner && <TrophyIcon />}
                {isOut && <BlockIcon />}
              </div>

              <div className="text-3xl font-extrabold">
                {game.playerPoints[player.id]}
              </div>
            </div>

            <div
              className={cn(
                "flex-1 flex justify-between font-bold p-2 bg-neutral-800/30 uppercase",
                isOut && "bg-transparent"
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
                  <div className="text-xl">
                    {roundPoints === 0 ? "" : roundPoints > 0 ? "+" : "-"}
                  </div>
                  <div className="text-4xl">{Math.abs(roundPoints)}</div>
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

  const spaces = letters
    .map((letter, i) => (letter === " " ? i : false))
    .filter((value) => value !== false) as number[];

  function toggle() {
    setShow((current) => !current);
  }

  return (
    <div className="flex flex-col gap-4 bg-white rounded-md shadow-[0px_0px_0px_6px_rgba(0_0_0/25%)] p-3">
      <h1 className="text-center">
        {round.hint} com {round.word.replace(/\s/g, "").length} letras
      </h1>
      <div className="w-fit flex gap-1 items-center justify-center mx-auto">
        {letters.map((letter, i) => {
          const isGuessed = round.lettersGuessed[letter];
          const isSpace = letter === " ";
          const winner =
            round.winner == null
              ? null
              : round.winner === round.host
              ? "host"
              : "player";

          const index =
            spaces.reduce(
              (index, space) =>
                i === space ? 0 : i > space ? index - 1 : index,
              i
            ) + 1;

          return (
            <div
              className={cn(
                "w-12 h-16 rounded-md flex flex-col p-0.5 text-5xl font-extrabold relative",
                isSpace
                  ? "bg-white w-8  border-dotted border-gray-400"
                  : isGuessed || winner === "player"
                  ? "bg-green-200 border-2 border-green-600"
                  : winner === "host"
                  ? "bg-red-200 border-2 border-red-600"
                  : show
                  ? "border-2 border-dotted border-gray-400 text-gray-400"
                  : "bg-gray-300 border-2 border-gray-400"
              )}
              key={`${letter}-${i}`}
            >
              {letter === " " ? null : (
                <span className="text-xs font-bold text-left">{index}</span>
              )}

              <div className="text-center">
                {isGuessed || round.winner || show ? (
                  letter
                ) : (
                  <span>&nbsp;</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {type === "game" && round.winner == null ? (
        <div className="text-center hidden">
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

  const remainingLetters = state.round.word
    .split("")
    .filter((w) => !state.round.lettersGuessed[w]).length;

  const availablePoints = useMemo(() => {
    const bonus = getGuessWordBonus(state);
    return {
      letter: 1,
      word: remainingLetters * bonus,
    };
  }, [remainingLetters, state]);

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
                    "inline-flex items-center flex-col rounded-full px-6 pt-2 pb-5 border border-gray-400 uppercase tracking-wider relative",
                    mode === state.round.guessMode
                      ? "bg-info-700 border-transparent text-white"
                      : "text-black"
                  )}
                >
                  <span>Chutar {LABEL[mode]}</span>
                  <span className="text-sm absolute left-0 bottom-1 w-full text-center">
                    +{availablePoints[mode]}
                  </span>
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
