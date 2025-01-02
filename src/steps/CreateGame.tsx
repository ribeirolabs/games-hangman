import { useState, FormEvent } from "react";
import { useGameAction, gameSchema, useGameState, Game } from "../core";
import { ValidationErrors, validate } from "../utils";

export function CreateGame() {
  const { type } = useGameState("creatingGame");
  const send = useGameAction();

  const [errors, setErrors] =
    useState<ValidationErrors<typeof gameSchema>>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    const maxLetterGuesses = data.get("max_letter_guesses");
    const maxWordGuesses = data.get("max_word_guesses");
    const time = data.get("time");
    const players = (data.get("players") as string)?.split(/\n/);

    const result = validate(
      {
        id: crypto.randomUUID(),
        maxLetterGuesses,
        maxWordGuesses,
        players,
        time,
      },
      gameSchema
    );

    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    send({ type: "createGame", game: result.data });
  }

  if (type === "presentation") {
    return <h1 className="text-center">Aguardando criação do jogo</h1>;
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <form
        className="form p-4 bg-white border-4 border-neutral-200 rounded-lg"
        onSubmit={onSubmit}
      >
        <label>
          <span className="input-label">Chances</span>
          <input name="max_letter_guesses" type="number" autoFocus />
          {errors && errors.maxLetterGuesses && (
            <div className="div input-helper">
              <span>&nbsp;</span>
              <span className="text-danger">{errors.maxLetterGuesses[0]}</span>
            </div>
          )}
        </label>

        <label>
          <span className="input-label">Chutes</span>
          <input name="max_word_guesses" type="number" />
          {errors && errors.maxWordGuesses && (
            <div className="div input-helper">
              <span>&nbsp;</span>
              <span className="text-danger">{errors.maxWordGuesses[0]}</span>
            </div>
          )}
        </label>

        <label>
          <span className="input-label">Tempo</span>
          <input name="time" type="number" />
          {errors && errors.time && (
            <div className="div input-helper">
              <span>&nbsp;</span>
              <span className="text-danger">{errors.time[0]}</span>
            </div>
          )}
        </label>

        <label>
          <span className="input-label">Jogadores</span>
          <textarea name="players" />
          {errors && errors.players && (
            <div className="input-helper">
              <span>&nbsp;</span>
              <span className="text-danger">{errors.players[0]}</span>
            </div>
          )}
        </label>

        <div>
          <button type="submit" className="btn btn-primary w-full">
            Começar
          </button>
        </div>
      </form>
    </div>
  );
}
