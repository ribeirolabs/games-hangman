import { Actions } from "../components/Actions";
import { Footer } from "../components/Footer";
import { GuessOptions } from "../components/GuessOptions";
import { Players } from "../components/Players";
import { WordPanel } from "../components/WordPanel";

export function PlayGame() {
  return (
    <div className="flex gap-16 flex-col h-screen">
      <Players />

      <div className="flex flex-col gap-8 items-center flex-1">
        <WordPanel />

        <GuessOptions />
      </div>

      <Actions />
      <Footer />
    </div>
  );
}
