import { useState } from "react";
import { useGameState } from "../core";
import { cn } from "../utils";

export function WordPanel() {
  const { round, type } = useGameState("playing");
  const [show, setShow] = useState(false);

  const letters = round.word.split("");

  const spaces = letters
    .map((letter, i) => (letter === " " ? i : false))
    .filter((value) => value !== false) as number[];

  const firstEmptyLetter = round.wordGuess.findIndex((value) => value === "");

  return (
    <div className="flex flex-col gap-4 bg-white rounded-md shadow-[0px_0px_0px_6px_rgba(0_0_0/25%)] p-3">
      <h2 className="text-center text-2xl font-black uppercase">
        {round.hint} com {round.word.replace(/\s/g, "").length} letras
      </h2>

      <div className="w-fit flex gap-1 items-center justify-center mx-auto">
        {letters.map((letter, i) => {
          const isLetterGuessed = round.lettersGuessed[letter];
          const isSpace = letter === " ";
          const isGuessingWord = round.guessMode === "word";
          const isFirstEmpty = firstEmptyLetter === i;
          const winner =
            round.winner == null
              ? null
              : round.winner === round.host
              ? "host"
              : "player";

          const index =
            spaces.reduce(
              (index, space) =>
                i === space ? 0 : i > space ? index - 1 : index,
              i
            ) + 1;

          return (
            <div
              className={cn(
                "w-12 h-16 rounded-md flex flex-col p-0.5 text-5xl font-extrabold relative",
                isSpace
                  ? "bg-white w-8  border-dotted border-gray-400"
                  : winner === "player"
                  ? "bg-green-200 border-4 border-green-600"
                  : winner === "host"
                  ? "bg-red-200 border-4 border-red-600"
                  : show || isGuessingWord
                  ? "border-4 border-dotted border-gray-400"
                  : show && !isGuessingWord
                  ? "text-gray-400"
                  : "bg-gray-300 border-4 border-gray-400",
                isGuessingWord && !isLetterGuessed && isFirstEmpty
                  ? "border-info-500 bg-info-100"
                  : null,
                isFirstEmpty && isGuessingWord ? "animate-bounce" : null
              )}
              key={`${letter}-${i}`}
            >
              {letter === " " ? null : (
                <span className="text-sm leading-4 font-black text-left">
                  {index}
                </span>
              )}

              <div
                className={cn(
                  "text-center",
                  isGuessingWord && !isLetterGuessed ? "text-blue-400" : ""
                )}
              >
                {isGuessingWord ? (
                  round.wordGuess[i]
                ) : isLetterGuessed || round.winner || show ? (
                  letter
                ) : (
                  <span>&nbsp;</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {type === "game" && round.winner == null ? (
        <div className="text-center">
          <button
            className="btn"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
          >
            {show ? <span>Esconder palavra</span> : <span>Mostra palavra</span>}
          </button>
        </div>
      ) : null}
    </div>
  );
}
