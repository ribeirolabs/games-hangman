import { Actions } from "../components/Actions";
import { WrongGuesses } from "../components/WrongGuesses";
import { GuessOptions } from "../components/GuessOptions";
import { Players } from "../components/Players";
import { WordPanel } from "../components/WordPanel";
import { useGameAction, useGameState } from "../core";
import { cn } from "../utils";
import { useEffect, useRef, useState } from "react";

export function PlayGame() {
  const { round } = useGameState("playing");

  return (
    <div className="flex h-full justify-between flex-col overflow-hidden">
      <Players />

      <div className="flex flex-col gap-4 justify-center items-center flex-1">
        <WordPanel />

        <GuessOptions />

        {round.timer > 0 && <Timer />}
      </div>

      <div
        className={cn(
          "transition-transform",
          round.winner && "translate-y-[100%] pointer-events-none"
        )}
      >
        <WrongGuesses />
        <Actions />
      </div>
    </div>
  );
}

function useTimer(initial: number) {
  const timeoutRef = useRef<number>(-1);
  const [time, setTime] = useState(initial);

  function start() {
    clear();

    timeoutRef.current = setInterval(() => {
      setTime((t) => Math.max(-1, t - 1));
    }, 1000);
  }
  function reset(time?: number) {
    clear();
    setTime(time ?? initial);
  }

  function clear() {
    if (timeoutRef.current) {
      clearInterval(timeoutRef.current);
    }
  }

  function stop() {
    clear();
  }

  function restart() {
    reset();
    start();
  }

  return {
    start,
    reset,
    restart,
    stop,
    time,
  };
}

function Timer() {
  const { round } = useGameState("playing");
  const action = useGameAction();
  const { time, start, restart, reset } = useTimer(round.timer);

  useEffect(() => {
    start();

    return reset;
  }, []);

  useEffect(() => {
    if (round.winner) {
      reset();
      return;
    }

    reset(round.timer);
    start();
  }, [round.timer, round.id, round.guessMode, round.winner]);

  useEffect(() => {
    if (time < 0) {
      action({ type: "skip" });
      restart();
    }
  }, [time]);

  return (
    <div
      className={cn(
        "p-4 font-black text-4xl rounded-md border-inside w-20 text-center text-black/70",
        time < 11
          ? "bg-red-400 animate-bounce"
          : time < 20
          ? "bg-yellow-500"
          : "bg-white"
      )}
    >
      {time}
    </div>
  );
}
