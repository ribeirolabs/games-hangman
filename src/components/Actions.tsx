import { FormEvent } from "react";
import { useGameState, useGameAction } from "../core";
import { cn } from "../utils";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function Actions() {
  const state = useGameState("playing");
  const action = useGameAction();
  const keyboardRows = [
    LETTERS.slice(0, LETTERS.length / 2),
    LETTERS.slice(LETTERS.length / 2),
  ];

  function onSubmit(e: FormEvent) {
    e.preventDefault();

    const data: { letter?: string; action?: "pass" | "restart" } =
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
    } else if (data.action === "pass") {
      action({
        type: "pass",
      });
    } else if (data.action === "restart") {
      action({
        type: "restart",
      });
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white w-full p-3 flex gap-3 items-center justify-between"
    >
      <button
        className="uppercase text-sm px-2 h-16 rounded-full bg-primary text-white font-bold"
        type="submit"
        name="action"
        value="pass"
      >
        Passar
      </button>
      <div className="flex flex-col gap-1">
        {keyboardRows.map((row, i) => (
          <div key={i} className="flex gap-1">
            {row.map((letter) => {
              const letterState = !state.round.lettersGuessed[letter]
                ? "idle"
                : state.round.word.includes(letter)
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
      <button
        className="uppercase text-sm px-2 h-16 rounded-full bg-primary text-white font-bold"
        type="submit"
        name="action"
        value="restart"
      >
        Restart
      </button>
    </form>
  );
}
