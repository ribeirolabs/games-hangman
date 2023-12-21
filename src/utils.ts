import { z } from "zod";
import { GameSound, Player } from "./core";

export function validate<T extends z.ZodSchema>(
  data: unknown,
  schema: T
):
  | z.SafeParseSuccess<z.infer<T>>
  | {
      success: false;
      errors: z.SafeParseError<
        z.input<T>
      >["error"]["formErrors"]["fieldErrors"];
    } {
  const result = schema.safeParse(data);

  if (result.success) {
    return result;
  }

  return {
    success: false,
    errors: result.error.formErrors.fieldErrors,
  };
}

export type ValidationErrors<T extends z.ZodSchema> =
  | z.inferFlattenedErrors<T>["fieldErrors"]
  | null;

export function getPlayer(players: Player[], id: string) {
  const player = players.find((player) => player.id === id);

  if (!player) {
    throw new Error(`Player ${id} no found`);
  }

  return player;
}

export function cn(
  ...classes: (string | boolean | null | undefined)[]
): string {
  return classes.filter(Boolean).join(" ");
}

export function playSound(id: GameSound, reason?: string) {
  console.log("playing", id, reason);
  window.dispatchEvent(
    new CustomEvent("play-sound", {
      detail: {
        id,
      },
    })
  );
}
