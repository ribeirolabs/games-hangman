import { useState, FormEvent } from "react";
import { useGameAction, gameSchema, useGameState, Player } from "../core";
import { ValidationErrors, validate } from "../utils";
const PLAYERS: string[] = ["Igor", "Nay", "Lucia", "Livia"];

const GAME = {
  maxLetterGuesses: 2,
  maxWordGuesses: 1,
  id: crypto.randomUUID(),
  players: PLAYERS,
};

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
    const players = (data.get("players") as string)?.split(/\n/);

    const result = validate(
      GAME || {
        id: crypto.randomUUID(),
        maxLetterGuesses,
        maxWordGuesses,
        players,
      },
      gameSchema
    );

    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    send({ type: "createGame", game: result.data });
  }

  if (type === "game") {
    return <h1 className="text-center">Aguardando criação do jogo</h1>;
  }

  return (
    <form className="form p-4" onSubmit={onSubmit}>
      <h1>Novo Jogo</h1>

      <label>
        <span className="input-label">Máximo de letras chutadas</span>
        <input name="max_letter_guesses" type="number" />
        {errors && errors.maxLetterGuesses && (
          <div className="div input-helper">
            <span>&nbsp;</span>
            <span className="text-danger">{errors.maxLetterGuesses[0]}</span>
          </div>
        )}
      </label>

      <label>
        <span className="input-label">Máximo de palavras chutadas</span>
        <input name="max_word_guesses" type="number" />
        {errors && errors.maxWordGuesses && (
          <div className="div input-helper">
            <span>&nbsp;</span>
            <span className="text-danger">{errors.maxWordGuesses[0]}</span>
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
        <button type="submit" className="btn btn-positive w-full">
          Começar
        </button>
      </div>
    </form>
  );
}
