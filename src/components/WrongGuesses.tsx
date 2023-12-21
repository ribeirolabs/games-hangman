import { useGameState } from "../core";
import { cn } from "../utils";

export function WrongGuesses() {
  const state = useGameState("playing");

  return (
    <div className="p-4 w-full flex flex-col gap-3">
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
  );
}
