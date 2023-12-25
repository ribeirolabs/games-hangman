import correctAudio from "./assets/correct-3.mp3";
import startAudio from "./assets/start.mp3";
import lostAudio from "./assets/lost.mp3";
import wrongAudio from "./assets/wrong.mp3";
import winnerAudio from "./assets/correct.mp3";
import selectAudio from "./assets/select.mp3";
import eraseAudio from "./assets/erase.mp3";
import skipAudio from "./assets/skip.mp3";

import { GameProvider, GameStateContext, SOUNDS } from "./core";
import { CreateGame } from "./steps/CreateGame";
import { SelectScreenType } from "./steps/SelectScreenType";
import { SelectWord } from "./steps/SelectWord";
import { PlayGame } from "./steps/PlayGame";
import { useContext, useEffect, useRef } from "react";
import { Toolbar } from "./components/Toolbar";

function App() {
  return (
    <GameProvider>
      {(state) => (
        <div className="h-screen grid grid-rows-[2rem,1fr]">
          <Toolbar />
          {state.step === "selectingScreenType" && <SelectScreenType />}
          {state.step === "creatingGame" && <CreateGame />}
          {state.step === "selectingWord" && <SelectWord />}
          {state.step === "playing" && <PlayGame />}
          <AudioEffect />
        </div>
      )}
    </GameProvider>
  );
}

function AudioEffect() {
  const state = useContext(GameStateContext);
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
  }, []);

  useEffect(() => {
    if (state.step === "selectingScreenType") {
      return;
    }

    if (state.type === "game") {
      return;
    }

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
  }, [state]);

  return (
    <>
      <audio id="correct" src={correctAudio}></audio>
      <audio id="start" src={startAudio}></audio>
      <audio id="lost" src={lostAudio}></audio>
      <audio id="wrong" src={wrongAudio}></audio>
      <audio id="winner" src={winnerAudio}></audio>
      <audio id="select" src={selectAudio}></audio>
      <audio id="erase" src={eraseAudio}></audio>
      <audio id="skip" src={skipAudio}></audio>
    </>
  );
}

export default App;
