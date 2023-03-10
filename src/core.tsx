import removeAccents from "remove-accents";
import produce, { Draft } from "immer";
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
import { playSound } from "./utils";

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

export type ScreenType = "game" | "presentation";
export type Game = z.infer<typeof gameSchema> & {
  playerPoints: Record<string, number>;
};
export type Player = z.infer<typeof playersSchema>[number];
export type GuessMode = "letter" | "word";
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
        guessMode: GuessMode;
        guessModeOptions: GuessMode[];
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
    }
  | {
      type: "pass";
    }
  | {
      type: "restart";
    }
  | {
      type: "setGuessMode";
      mode: GuessMode;
    }
  | {
      type: "nextRound";
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

      if (guesses.words > 0) {
        return true;
      }

      if (guesses.letters === 0) {
        return false;
      }
    }

    return true;
  });

  if (step === "playing") {
    const current = available.findIndex((p) => p.id === round.turn);

    return available[(current + 1) % available.length];
  }

  if (step === "selectingWord") {
    const host = players.findIndex((p) => p.id === round.host);
    const next = host % available.length;

    return available[next];
  }

  return available[0];
}

function setNextHost(draft: Draft<PlayingState>) {
  const currentHost = draft.game.players.findIndex(
    (player) => player.id === draft.round.host
  );

  const next =
    draft.game.players[(currentHost + 1) % draft.game.players.length];

  draft.round.host = next.id;
}

function setNextPlayer(draft: Draft<PlayingState>) {
  const nextPlayer = getNextPlayer(draft);

  if (nextPlayer == null) {
    throw new Error("Jogo inválido, recomeçe");
  }

  draft.round.turn = nextPlayer.id;
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

type PlayingState = Extract<State, { step: "playing" }>;

function setWinner(draft: Draft<PlayingState>, id: string) {
  draft.round.winner = id;
}

function getRemainingLetters(state: PlayingState) {
  return state.round.word
    .split("")
    .filter((letter) => !state.round.lettersGuessed[letter] && letter !== " ")
    .length;
}

function setAvailableModes(draft: Draft<PlayingState>) {
  const guesses = draft.round.playerGuesses[draft.round.turn];

  if (
    guesses.letters === 0 &&
    guesses.words > 0 &&
    draft.game.maxWordGuesses > 0
  ) {
    draft.round.guessMode = "word";
    draft.round.guessModeOptions = ["word"];
  }
}

function checkRoundOver(draft: Draft<PlayingState>) {
  const remainingLetters = getRemainingLetters(draft);
  const remainingGuesses = draft.game.players.reduce((guesses, player) => {
    if (draft.round.host === player.id) {
      return guesses;
    }

    const playerGuesses = draft.round.playerGuesses[player.id];

    return guesses + playerGuesses.words + playerGuesses.letters;
  }, 0);

  if (remainingLetters === 0 || remainingGuesses === 0) {
    // draft.round.points[draft.round.host] += draft.round.word.length;

    setWinner(draft, draft.round.host);
    playSound("lost");
    return true;
  }

  return false;
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

    playSound("start");

    return {
      ...state,
      step: "playing",
      round: {
        ...state.round,
        guessMode: "letter",
        guessModeOptions:
          state.game.maxWordGuesses > 0 ? ["letter", "word"] : ["letter"],
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
    const result = produce(state, (draft) => {
      const letter = action.letter.toUpperCase();

      if (state.round.lettersGuessed[letter]) {
        console.log("letter guessed");
        playSound("wrong");
        return;
      }

      if (state.round.playerGuesses[state.round.turn].letters <= 0) {
        console.log("no more letter guesses");
        playSound("wrong");
        return;
      }

      draft.round.lettersGuessed[letter] = true;

      const remainingLetters = getRemainingLetters(draft);
      const hasLetter = draft.round.word.includes(letter);

      if (hasLetter) {
        // const occurences = draft.round.word
        //   .split("")
        //   .filter((l) => l === letter).length;

        draft.round.points[draft.round.turn] += 1;

        if (remainingLetters === 0) {
          playSound("winner");
          setWinner(draft, draft.round.turn);
          return;
        }

        playSound("correct");

        return;
      }

      draft.round.playerGuesses[draft.round.turn].letters--;
      draft.round.points[draft.round.host]++;

      const guesses = draft.round.playerGuesses[draft.round.turn];

      if (guesses.letters === 0 && guesses.words === 0) {
        playSound("lost");
      } else {
        playSound("wrong");
      }

      if (checkRoundOver(draft)) {
        return;
      }

      setNextPlayer(draft);
    });

    return produce(result, (draft) => {
      setAvailableModes(draft);
    });
  }

  if (action.type === "guessWord" && state.step === "playing") {
    const word = removeAccents(action.word.toUpperCase());
    const remainingLetters = getRemainingLetters(state);

    const result = produce(state, (draft) => {
      if (draft.round.wordsGuessed[word]) {
        playSound("wrong");
        return;
      }

      draft.round.wordsGuessed[word] = true;

      if (word !== draft.round.word) {
        draft.round.playerGuesses[draft.round.turn].words--;
        draft.round.guessMode = "letter";

        if (draft.round.playerGuesses[draft.round.turn].words === 0) {
          draft.round.points[draft.round.host]++;
        }

        if (draft.round.playerGuesses[draft.round.turn].words === 0) {
          draft.round.playerGuesses[draft.round.turn].letters = 0;
        }

        const guesses = draft.round.playerGuesses[draft.round.turn];

        if (checkRoundOver(draft)) {
          return;
        }

        if (guesses.letters === 0 && guesses.words === 0) {
          playSound("lost");
        } else {
          playSound("wrong");
        }
      }
    });

    return produce(result, (draft) => {
      const bonus = getGuessWordBonus(draft);
      if (word === draft.round.word) {
        draft.round.points[draft.round.turn] += remainingLetters * bonus;

        if (bonus > 1) {
          draft.round.points[draft.round.host] -= remainingLetters;
        }

        for (const letter of draft.round.word.split("")) {
          if (letter === " ") {
            continue;
          }
          draft.round.lettersGuessed[letter] = true;
        }

        setWinner(draft, draft.round.turn);
        playSound("winner");
        return;
      }

      const next = getNextPlayer(draft);

      if (next == null) {
        const remainingLetters = getRemainingLetters(draft);
        draft.round.points[draft.round.host] += remainingLetters;
        setWinner(draft, draft.round.host);
        return;
      }

      draft.round.turn = next.id;
      setAvailableModes(draft);
    });
  }

  if (action.type === "setGuessMode" && state.step === "playing") {
    return produce(state, (draft) => {
      draft.round.guessMode = action.mode;
    });
  }

  if (action.type === "nextRound" && state.step === "playing") {
    return produce(state, (draft) => {
      for (const player of draft.game.players) {
        draft.game.playerPoints[player.id] += draft.round.points[player.id];
      }

      setNextHost(draft);

      // @ts-ignore
      draft.step = "selectingWord";
    });
  }

  if (action.type === "pass" && state.step === "playing") {
    return produce(state, (draft) => {
      setNextPlayer(draft);
    });
  }

  if (action.type === "restart" && state.step === "playing") {
    return {
      step: "creatingGame",
      type: state.type,
    };
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

function getStorageKey(type: ScreenType) {
  return `game-${type}`;
}

export function GameProvider({
  children,
}: {
  children: (state: State) => JSX.Element;
}) {
  const screenType = (new URLSearchParams(window.location.search).get(
    "screen_type"
  ) ?? "game") as ScreenType;

  const [state, send] = useReducer(reducer, screenType, (screenType) => {
    try {
      const local = window.localStorage.getItem(getStorageKey(screenType));

      if (!local) {
        throw new Error("No local game");
      }

      return JSON.parse(local);
    } catch (e: any) {
      return screenType
        ? {
            step: "creatingGame",
            type: screenType,
          }
        : {
            step: "selectingScreenType",
          };
    }
  });

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
    window.localStorage.setItem(
      getStorageKey(screenType),
      JSON.stringify(state)
    );
  }, [state, screenType]);

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

export const SOUNDS = ["correct", "start", "lost", "wrong", "winner"] as const;

export type GameSound = typeof SOUNDS[number];

export function getGuessWordBonus(state: PlayingState) {
  return Object.keys(state.round.lettersGuessed).length === 0 ? 2 : 1;
}
