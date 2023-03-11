import { FormEvent } from "react";
import { useGameAction } from "../core";

export function SelectScreenType() {
  const action = useGameAction();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
  }

  return (
    <div className="h-full w-full flex items-center justify-center">
      <form
        onSubmit={onSubmit}
        className="bg-white p-3 shadow-outline rounded-md flex flex-col gap-3"
      >
        <div className="input-group">
          <label className="font-semibold" htmlFor="screen">
            Tipo de Tela
          </label>
          <select id="screen" className="w-full" name="type">
            <option value="game">Admin</option>
            <option value="presentation">Spectador</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary">
          Confirmar
        </button>
      </form>
    </div>
  );
}
