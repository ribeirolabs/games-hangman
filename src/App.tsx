import { GameProvider, ScreenType } from "./core";
import { CreateGame } from "./steps/CreateGame";
import { SelectScreenType } from "./steps/SelectScreenType";
import { SelectWord } from "./steps/SelectWord";
import { PlayGame } from "./steps/PlayGame";

function App() {
  const screenType = (new URLSearchParams(window.location.search).get(
    "screen_type"
  ) ?? "game") as ScreenType;

  return (
    <GameProvider
      initial={{
        step: "creatingGame",
        type: screenType,
        // game: GAME,
        // round: {
        //   host: PLAYERS[0].id,
        // },
      }}
    >
      {(state) => (
        <div>
          {state.step === "selectingScreenType" && <SelectScreenType />}
          {state.step === "creatingGame" && <CreateGame />}
          {state.step === "selectingWord" && <SelectWord />}
          {state.step === "playing" && <PlayGame />}
        </div>
      )}
    </GameProvider>
  );
}

export default App;
