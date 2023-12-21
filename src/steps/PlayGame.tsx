import { Actions } from "../components/Actions";
import { WrongGuesses } from "../components/WrongGuesses";
import { GuessOptions } from "../components/GuessOptions";
import { Players } from "../components/Players";
import { WordPanel } from "../components/WordPanel";

export function PlayGame() {
  return (
    <div className="flex justify-between flex-col h-screen">
      <Players />

      <div className="flex flex-col gap-4 justify-center items-center flex-1">
        <WordPanel />

        <GuessOptions />
      </div>

      <div>
        <WrongGuesses />
        <Actions />
      </div>
    </div>
  );
}
