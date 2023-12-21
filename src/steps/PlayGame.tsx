import { Actions } from "../components/Actions";
import { WrongGuesses } from "../components/WrongGuesses";
import { GuessOptions } from "../components/GuessOptions";
import { Players } from "../components/Players";
import { WordPanel } from "../components/WordPanel";
import { useGameState } from "../core";
import { cn } from "../utils";

export function PlayGame() {
  const { round } = useGameState("playing");

  return (
    <div className="flex h-full justify-between flex-col overflow-hidden">
      <Players />

      <div className="flex flex-col gap-4 justify-center items-center flex-1">
        <WordPanel />

        <GuessOptions />
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
