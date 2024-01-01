import { useState, useRef, useEffect, FormEvent } from "react";
import { useGameState, useGameAction } from "../core";
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
    <div className="flex flex-col w-fit uppercase text-lg items-center">
      <div className={state.round.guessMode === "letter" ? "font-black" : ""}>
        valendo {state.round.availablePoints.letter} ponto por acerto
      </div>
      <div className={state.round.guessMode === "word" ? "font-black" : ""}>
        valendo {state.round.availablePoints.word} pontos por chute
      </div>
    </div>
  );
}
