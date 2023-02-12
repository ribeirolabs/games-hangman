import { FormEvent, useEffect } from "react";
import { BlockIcon, ChatIcon, PencilIcon } from "../components/Icons";
import { useGameAction, useGameState } from "../core";
import { cn } from "../utils";

export function PlayGame() {
  const state = useGameState("playing");
  const send = useGameAction();

  useEffect(() => {
    if (state.type === "host") {
      return;
    }

    function listener(e: KeyboardEvent) {
      const isLetter = /^\w$/.test(e.key);

      if (!isLetter || e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) {
        return;
      }

      send({
        type: "guessLetter",
        letter: e.key,
      });
    }

    window.addEventListener("keyup", listener);
    return () => window.removeEventListener("keyup", listener);
  }, [state.type]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
  }

  return (
    <div className="flex flex-col h-screen">
      <Players />

      <div className="p-4 flex flex-col gap-8 items-center flex-1">
        <WordPanel />

        <form
          onSubmit={onSubmit}
          className="flex w-fit text-white uppercase font-extrabold text-lg"
        >
          <button
            name="type"
            value="letter"
            className="rounded-l-full px-8 py-4 bg-info-600 uppercase tracking-wider"
          >
            Chutar letra
          </button>
          <button
            name="type"
            value="word"
            className="rounded-r-full px-8 py-4 bg-info-800 uppercase tracking-wider"
          >
            Chutar palavra
          </button>
        </form>
      </div>

      <div className="p-4 w-full bg-gray-200 flex flex-col gap-3">
        <div className="flex flex-col w-full justify-start">
          <span className="uppercase tracking-wider font-extrabold text-sm">
            Letras
          </span>
          <div className="flex h-8 gap-1">
            {Object.keys(state.round.lettersGuessed).map((letter) => (
              <div
                key={letter}
                className="bg-neutral-700 text-white flex justify-center items-center font-extrabold rounded-full w-8 text-xl"
              >
                {letter}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col w-full justify-start">
          <span className="uppercase tracking-wider font-extrabold text-sm">
            Palavras
          </span>
          <div className="flex h-8 gap-1">
            {Object.keys(state.round.wordsGuessed).map((word) => (
              <div
                key={word}
                className="bg-neutral-700 text-white flex justify-center items-center font-extrabold rounded-full w-8 text-xl"
              >
                {word}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Players() {
  const { game, round } = useGameState("playing");
  const players = [...game.players]
    .map((player) => {
      const isHost = round.host === player.id;
      const isTurn = round.turn === player.id;

      return {
        ...player,
        state: isHost ? "host" : isTurn ? "turn" : "waiting",
      };
    })
    .sort((a, b) => (a.state === "host" ? -1 : b.state === "host" ? 1 : 0));

  console.log(round);
  return (
    <header className="p-3 pt-12 gap-3 flex w-full bg-neutral-900">
      {players.map((player) => {
        const isHost = round.host === player.id;
        const isWinner = round.winner === player.id;
        const isTurn = round.turn === player.id && round.winner == null;
        const letterGuesses = round.playerGuesses[player.id].letters;
        const wordGuesses = round.playerGuesses[player.id].words;
        const isOut = letterGuesses <= 0;

        return (
          <div
            key={player.id}
            className={cn(
              "flex-1 flex flex-col text-white rounded",
              isWinner
                ? "bg-green-400 text-black/70 animate-pulse"
                : isHost
                ? "bg-info-700"
                : isTurn
                ? "animate-bounce bg-neutral-100/30"
                : isOut
                ? "opacity-40"
                : "bg-neutral-700"
            )}
          >
            <div
              className={cn(
                "py-1 flex items-center justify-center flex-1 gap-2 text-xl uppercase font-bold flex-grow-0"
              )}
            >
              {isHost && <PencilIcon />}
              {isTurn && <ChatIcon />}
              {isOut && <BlockIcon />}
              <span>{player.name}</span>
            </div>

            <div
              className={cn(
                "flex justify-between font-bold p-2 bg-neutral-800/30"
              )}
            >
              <div className="flex-1 text-center">
                <div className="text-[10px] uppercase">Pontos</div>
                <div className="text-2xl">{game.playerPoints[player.id]}</div>
              </div>

              {isHost ? null : (
                <>
                  <div className="flex-1 text-center">
                    <div className="text-[10px] uppercase">Letras</div>
                    <div className="text-2xl">{letterGuesses}</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-[10px] uppercase">Palavras</div>
                    <div className="text-2xl">{wordGuesses}</div>
                  </div>
                </>
              )}
            </div>

            <div className="flex-1 flex flex-col p-2 font-extrabold uppercase items-center">
              <div className="text-xs">Ganhando</div>
              <div className="flex items-baseline gap-2 justify-center">
                <div className="text-2xl">{round.points[player.id]}</div>
                <div className="text-[10px]">pontos</div>
              </div>
            </div>
          </div>
        );
      })}
    </header>
  );
}

function WordPanel() {
  const { round } = useGameState("playing");

  const letters = round.word.split("");

  return (
    <div className="flex-1 flex flex-col justify-center gap-4">
      <h1 className="text-center">{round.hint}</h1>
      <div className="w-fit flex gap-2 h-16 items-center justify-center mx-auto">
        {letters.map((letter, i) => {
          const isGuessed = round.lettersGuessed[letter];

          return (
            <div
              className={cn(
                "flex-1 w-16 h-full rounded flex items-center justify-center text-5xl font-extrabold",
                isGuessed
                  ? "bg-green-200 border border-green-600"
                  : "bg-gray-300"
              )}
              key={`${letter}-${i}`}
            >
              {isGuessed ? letter : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
