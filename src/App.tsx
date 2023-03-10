import correctAudio from "./assets/correct.mp3";
import startAudio from "./assets/start.mp3";
import lostAudio from "./assets/lost.mp3";
import wrongAudio from "./assets/wrong.mp3";
import winnerAudio from "./assets/winner.mp3";
import { GameProvider, ScreenType, SOUNDS, State } from "./core";
import { CreateGame } from "./steps/CreateGame";
import { SelectScreenType } from "./steps/SelectScreenType";
import { SelectWord } from "./steps/SelectWord";
import { PlayGame } from "./steps/PlayGame";
import { useContext, useEffect, useRef } from "react";

function App() {
  return (
    <GameProvider>
      {(state) => (
        <>
          {state.step === "selectingScreenType" && <SelectScreenType />}
          {state.step === "creatingGame" && <CreateGame />}
          {state.step === "selectingWord" && <SelectWord />}
          {state.step === "playing" && <PlayGame />}
          <AudioEffect />
        </>
      )}
    </GameProvider>
  );
}

function StoreGame({ state }: { state: State }) {}

function AudioEffect() {
  const connected = useRef<Record<string, HTMLAudioElement>>({});
  const audioContext = useRef(new AudioContext());
  const timeout = useRef<number | null>(null);

  useEffect(() => {
    SOUNDS.forEach((id) => {
      if (connected.current[id]) {
        return;
      }

      const audio = document.getElementById(id) as HTMLAudioElement;
      const track = audioContext.current.createMediaElementSource(audio);
      track.connect(audioContext.current.destination);
      connected.current[id] = audio;
    });

    function listener(e: CustomEvent<{ id: string }>) {
      const audio = connected.current[e.detail.id];

      if (timeout.current) {
        clearTimeout(timeout.current);
      }

      if (audioContext.current.state === "suspended") {
        audioContext.current.resume();
      }

      if (audio) {
        audio.currentTime = 0;
        audio.play();
        timeout.current = setTimeout(() => audio.pause(), 2500);
      }
    }

    // @ts-ignore
    window.addEventListener("play-sound", listener);

    // @ts-ignore
    return () => window.removeEventListener("play-sound", listener);
  }, []);

  return (
    <>
      <audio id="correct" src={correctAudio}></audio>
      <audio id="start" src={startAudio}></audio>
      <audio id="lost" src={lostAudio}></audio>
      <audio id="wrong" src={wrongAudio}></audio>
      <audio id="winner" src={winnerAudio}></audio>
    </>
  );
}

export default App;
