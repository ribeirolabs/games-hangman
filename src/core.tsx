import immer from "immer";
import {
  createContext,
  Dispatch,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { z } from "zod";

export const playersSchema = z.preprocess(
  (input) => {
    const processed = z
      .string()
      .array()
      .transform((data) =>
        data.filter(Boolean).map((name) => ({
          id: crypto.randomUUID(),
          name,
        }))
      )
      .safeParse(input);

    return processed.success ? processed.data : null;
  },
  z
    .array(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
      })
    )
    .min(2, "Um jogo precisa de pelo menos 2 jogadores")
);

export const gameSchema = z.object({
  id: z.string().uuid(),
  maxWordGuesses: z.preprocess(
    (input) => {
      return typeof input === "string"
        ? parseInt(input)
        : typeof input === "number"
        ? input
        : NaN;
    },
    z.number({
      required_error: "Opção obrigatória",
      invalid_type_error: "Opção inválida",
    })
  ),
  maxLetterGuesses: z.preprocess(
    (input) => {
      return typeof input === "string"
        ? parseInt(input)
        : typeof input === "number"
        ? input
        : NaN;
    },
    z.number({
      required_error: "Opção obrigatória",
      invalid_type_error: "Opção inválida",
    })
  ),
  players: playersSchema,
});

export const selectWordSchema = z.object({
  word: z.string().min(1, "Escolha uma palavra").min(3),
  hint: z.string().min(1, "Escolha uma dica").min(3),
});

export type ScreenType = "host" | "game";
export type Game = z.infer<typeof gameSchema> & {
  playerPoints: Record<string, number>;
};
export type Player = z.infer<typeof playersSchema>[number];
export type State =
  | {
      step: "selectingScreenType";
    }
  | {
      step: "creatingGame";
      type: ScreenType;
    }
  | {
      step: "selectingWord";
      type: ScreenType;
      game: Game;
      round: {
        host: string;
      };
    }
  | {
      step: "playing";
      type: ScreenType;
      game: Game;
      round: {
        word: string;
        lettersGuessed: Record<string, boolean>;
        wordsGuessed: Record<string, boolean>;
        hint: string;
        host: string;
        turn: string;
        points: Record<string, number>;
        winner: string | null;
        playerGuesses: Record<
          string,
          {
            words: number;
            letters: number;
          }
        >;
      };
    };

type Action =
  | {
      type: "createGame";
      game: Omit<Game, "playerPoints">;
    }
  | {
      type: "selectWord";
      word: string;
      hint: string;
    }
  | {
      type: "guessWord";
      word: string;
    }
  | {
      type: "guessLetter";
      letter: string;
    };

function getNextPlayer({
  step,
  round,
  game: { players },
}: Extract<State, { step: "playing" | "selectingWord" }>) {
  const available = players.filter((player) => {
    if (round.host === player.id) {
      return false;
    }

    if (step === "playing") {
      const guesses = round.playerGuesses[player.id];

      if (round.turn === player.id) {
        return false;
      }

      // if (guesses.words > 0) {
      //   return true;
      // }

      if (guesses.letters === 0) {
        return false;
      }
    }

    return true;
  });

  if (step === "playing") {
    const current = players.findIndex((p) => p.id === round.turn);

    return available[(current + 1) % available.length];
  }

  return available[0];
}

function resetPoints(players: Player[]) {
  return players.reduce(
    (points, player) => ({
      ...points,
      [player.id]: 0,
    }),
    {}
  );
}

function resetGuesses(game: Game) {
  return game.players.reduce(
    (guesses, player) => ({
      ...guesses,
      [player.id]: {
        letters: game.maxLetterGuesses,
        words: game.maxWordGuesses,
      },
    }),
    {}
  );
}

export function reducer(state: State, action: Action): State {
  if (action.type === "createGame" && state.step === "creatingGame") {
    return {
      step: "selectingWord",
      type: state.type,
      game: {
        ...action.game,
        playerPoints: action.game.players.reduce(
          (points, player) => ({
            ...points,
            [player.id]: 0,
          }),
          {}
        ),
      },
      round: {
        host: action.game.players[0].id,
      },
    };
  }

  if (action.type === "selectWord" && state.step === "selectingWord") {
    const nextPlayer = getNextPlayer(state);

    if (nextPlayer == null) {
      throw new Error("unable to find next player, invalid game");
    }

    return {
      ...state,
      step: "playing",
      round: {
        ...state.round,
        lettersGuessed: {},
        wordsGuessed: {},
        playerGuesses: resetGuesses(state.game),
        word: action.word.toUpperCase(),
        hint: action.hint.toUpperCase(),
        turn: nextPlayer.id,
        points: resetPoints(state.game.players),
        winner: null,
      },
    };
  }

  if (action.type === "guessLetter" && state.step === "playing") {
    return immer(state, (draft) => {
      function setWinner(id: string) {
        draft.round.winner = id;
        draft.round.lettersGuessed = {};
        draft.round.wordsGuessed = {};
        draft.round.playerGuesses = resetGuesses(draft.game);
      }

      const letter = action.letter.toUpperCase();

      if (state.round.lettersGuessed[letter]) {
        console.log("letter guessed");
        return;
      }

      if (state.round.playerGuesses[state.round.turn].letters <= 0) {
        console.log("no more letter guesses");
        return;
      }

      draft.round.lettersGuessed[letter] = true;

      const remainingLetters = draft.round.word
        .split("")
        .filter((word) => !draft.round.lettersGuessed[word]).length;

      const hasLetter = draft.round.word.includes(letter);

      console.log(remainingLetters, state.round);

      if (hasLetter) {
        draft.round.points[draft.round.turn]++;

        if (remainingLetters === 0) {
          setWinner(draft.round.turn);
          return;
        }

        return;
      }

      draft.round.playerGuesses[draft.round.turn].letters--;
      draft.round.points[draft.round.host]++;

      const nextPlayer = getNextPlayer(state);

      if (nextPlayer) {
        draft.round.turn = nextPlayer.id;
        return;
      }

      draft.game.playerPoints[state.round.host] +=
        remainingLetters + draft.round.points[draft.round.host];

      setWinner(draft.round.host);
    });
  }

  if (action.type === "guessWord" && state.step === "playing") {
    return immer(state, (draft) => {});
  }

  return state;
}

const StateContext = createContext<State>({ step: "selectingScreenType" });
const ActionContext = createContext<Dispatch<Action>>(() => {});

function StateProvider({
  state,
  children,
}: PropsWithChildren<{ state: State }>) {
  return (
    <StateContext.Provider value={state}>{children}</StateContext.Provider>
  );
}

function ActionProvider({
  send,
  children,
}: PropsWithChildren<{ send: Dispatch<Action> }>) {
  return (
    <ActionContext.Provider value={send}>{children}</ActionContext.Provider>
  );
}

export function GameProvider({
  initial = { step: "selectingScreenType" },
  children,
}: {
  initial?: State;
  children: (state: State) => JSX.Element;
}) {
  const [state, send] = useReducer(reducer, initial);

  const channel = useMemo(() => new BroadcastChannel("hangman"), []);

  const sendWithBroadcast = useCallback<typeof send>(
    (action) => {
      try {
        send(action);
        channel.postMessage(JSON.stringify(["action", action]));
      } catch (e: any) {
        alert(e.message);
      }
    },
    [channel]
  );

  useEffect(() => {
    function listener(event: { data: string }) {
      const data: ["action", Action] = JSON.parse(event.data as string);

      if (data[0] === "action") {
        send(data[1]);
      }
    }

    channel.addEventListener("message", listener);
    return () => channel.removeEventListener("message", listener);
  }, [channel, send]);

  return (
    <StateProvider state={state}>
      <ActionProvider send={sendWithBroadcast}>
        {children(state)}
      </ActionProvider>
    </StateProvider>
  );
}

export function useGameState<S extends State["step"]>(step: S) {
  const state = useContext(StateContext);

  if (state.step === step) {
    return state as Extract<State, { step: S }>;
  }

  throw new Error(`Invalid state step: ${step}`);
}

export function useGameAction() {
  return useContext(ActionContext);
}
