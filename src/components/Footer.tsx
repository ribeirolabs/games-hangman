import { useGameState } from "../core";
import { cn } from "../utils";

export function Footer() {
  const state = useGameState("playing");

  return (
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
  );
}
