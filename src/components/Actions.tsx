import { FormEvent } from "react";
import { useGameState, useGameAction } from "../core";
import { BackspaceIcon } from "../icons/BackspaceIcon";
import { GuessWordIcon } from "../icons/GuessWordIcon";
import { SkipIcon } from "../icons/SkipIcon";
import { cn } from "../utils";
import { ActionButton } from "./ActionButton";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function Actions() {
  const { round } = useGameState("playing");
  const action = useGameAction();
  const keyboardRows = [
    LETTERS.slice(0, LETTERS.length / 2),
    LETTERS.slice(LETTERS.length / 2),
  ];

  function onSubmit(e: FormEvent) {
    e.preventDefault();

    if (round.winner) {
      return;
    }

    const data: { letter?: string; action?: "skip" | "guessWord" } =
      Object.fromEntries(
        new FormData(
          e.target as HTMLFormElement,
          // @ts-ignore
          e.nativeEvent.submitter
        ).entries()
      );

    if (data.letter) {
      action({
        type: "guessLetter",
        letter: data.letter,
      });
    } else if (data.action === "skip") {
      action({
        type: "skip",
      });
    } else if (data.action === "guessWord") {
      action({
        type: "setGuessMode",
        mode: round.guessMode === "letter" ? "word" : "letter",
      });
    } else if (data.action === "backspace") {
      action({
        type: "backspace",
      });
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "bg-white w-full p-3 grid grid-cols-[1fr,4fr,1fr] gap-3 items-center justify-between",
        round.winner && "pointer-events-none"
      )}
    >
      <div className="flex justify-center">
        {round.guessMode === "letter" ? (
          <ActionButton type="submit" name="action" value="skip">
            <SkipIcon className="w-14" />
          </ActionButton>
        ) : (
          <ActionButton type="submit" name="action" value="backspace">
            <BackspaceIcon className="w-14" />
          </ActionButton>
        )}
      </div>

      <div className="flex flex-col gap-1 items-center">
        {keyboardRows.map((row, i) => (
          <div key={i} className="flex gap-1">
            {row.map((letter) => {
              const letterState = !round.lettersGuessed[letter]
                ? "idle"
                : round.word.includes(letter)
                ? "correct"
                : "wrong";

              return (
                <button
                  key={letter}
                  className={cn(
                    "text-lg md:text-4xl uppercase w-8 h-8 md:w-14 md:h-14 flex items-center justify-center font-black hover:bg-neutral-200 rounded-md",
                    letterState === "correct" && "bg-green-200 text-green-800",
                    letterState === "wrong" && "bg-red-200 text-red-800",
                    letterState === "idle"
                      ? "pointer-events-auto"
                      : "pointer-events-none"
                  )}
                  type="submit"
                  name="letter"
                  value={letter}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <ActionButton type="submit" name="action" value="guessWord">
          {round.guessMode === "letter" ? (
            <GuessWordIcon className="w-14" />
          ) : (
            <span className="text-6xl font-serif">W</span>
          )}
        </ActionButton>
      </div>
    </form>
  );
}
