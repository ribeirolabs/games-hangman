import {
  useState,
  useRef,
  useEffect,
  FormEvent,
  useMemo,
  Fragment,
} from "react";
import { useGameState, useGameAction, getGuessWordBonus } from "../core";
import { cn } from "../utils";
import { ArrowRightIcon } from "./Icons";

const LABEL = {
  letter: "letra",
  word: "palavra",
};

export function GuessOptions() {
  const state = useGameState("playing");
  const send = useGameAction();
  const [word, setWord] = useState("");
  const channel = useRef(new BroadcastChannel("hangman/guess-word"));

  useEffect(() => {
    return;
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
