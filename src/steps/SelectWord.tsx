import { useState, FormEvent } from "react";
import removeAccents from "remove-accents";
import { useGameState, useGameAction, selectWordSchema } from "../core";
import { getPlayer, ValidationErrors, validate, cn, playSound } from "../utils";

export function SelectWord() {
  const {
    type,
    game: { players },
    round,
  } = useGameState("selectingWord");
  const send = useGameAction();

  const host = getPlayer(players, round.host);
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [errors, setErrors] =
    useState<ValidationErrors<typeof selectWordSchema>>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);

    const result = validate(Object.fromEntries(data), selectWordSchema);

    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setErrors(null);
    send({ type: "selectWord", ...result.data });
  }

  if (type === "presentation") {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <h1>Aguardando {host.name} escolher palavra...</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen items-center justify-center">
      <form
        className="bg-white p-4 shadow-outline rounded-lg mx-auto w-fit flex flex-col gap-4"
        onSubmit={onSubmit}
      >
        <h1 className="text-center mb-4">Escolha uma palavra, {host.name}</h1>
        <div className="grid grid-cols-1 grid-rows-1 h-16">
          <label className="input-label col-start-1 row-start-1">
            <input
              type="text"
              name="word"
              value={value}
              onChange={(e) => {
                const event = e.nativeEvent as InputEvent;

                playSound(
                  event.inputType === "deleteContentBackward"
                    ? "erase"
                    : "select"
                );
                setValue(
                  removeAccents(
                    e.target.value.toUpperCase().replace(/\d+/g, "")
                  )
                );
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoFocus
            />
          </label>

          <div className="bg-white flex gap-1 items-center justify-center col-start-1 row-start-1 pointer-events-none">
            {value.split("").map((char, i) => (
              <div
                key={char + i}
                className={cn(
                  "text-4xl font-bold w-10 h-14 flex items-center justify-center rounded",
                  char === " "
                    ? "border-2 border-dotted border-gray-300"
                    : "bg-gray-300"
                )}
              >
                {char}
              </div>
            ))}

            <div
              className={cn(
                "h-14 w-10 rounded border--dotted",
                focused
                  ? "border-blue-400 bg-white border-2 duration-75"
                  : "border-gray-500 bg-gray-200 border"
              )}
            ></div>
          </div>
        </div>
        {errors && errors.word && (
          <span className="input-helper text-danger text-center">
            {errors.word[0]}
          </span>
        )}

        <div className="form w-fit">
          <label>
            <span className="input-label">Dica</span>
            <input type="text" name="hint" />
            {errors && errors.hint && (
              <span className="input-helper text-danger">{errors.hint[0]}</span>
            )}
          </label>

          <div>
            <button className="btn btn-positive w-full">Confirmar</button>
          </div>
        </div>
      </form>
    </div>
  );
}
