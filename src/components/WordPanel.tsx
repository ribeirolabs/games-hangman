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

  function toggle() {
    setShow((current) => !current);
  }

  return (
    <div className="flex flex-col gap-4 bg-white rounded-md shadow-[0px_0px_0px_6px_rgba(0_0_0/25%)] p-3">
      <h1 className="text-center">
        {round.hint} com {round.word.replace(/\s/g, "").length} letras
      </h1>
      <div className="w-fit flex gap-1 items-center justify-center mx-auto">
        {letters.map((letter, i) => {
          const isGuessed = round.lettersGuessed[letter];
          const isSpace = letter === " ";
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
                  ? "bg-green-200 border-2 border-green-600"
                  : winner === "host"
                  ? "bg-red-200 border-2 border-red-600"
                  : show
                  ? "border-2 border-dotted border-gray-400 text-gray-400"
                  : "bg-gray-300 border-2 border-gray-400"
              )}
              key={`${letter}-${i}`}
            >
              {letter === " " ? null : (
                <span className="text-xs font-bold text-left">{index}</span>
              )}

              <div className="text-center">
                {isGuessed || round.winner || show ? (
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
        <div className="text-center hidden">
          <button className="btn" onClick={toggle}>
            {show ? (
              <>
                <span>Esconder palavra</span>
              </>
            ) : (
              <>
                <span>Mostra palavra</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div>&nbsp;</div>
      )}
    </div>
  );
}
