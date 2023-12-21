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
      round: Round;
    };

type Round = {
  guessMode: GuessMode;
  guessModeOptions: GuessMode[];
  wordGuess: string[];
  word: string;
  availablePoints: Record<GuessMode, number>;
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
      type: "backspace";
    }
  | {
      type: "skip";
    }
  | {
      type: "undo";
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

function getRemainingLetters(state: {
  round: Pick<Round, "word" | "lettersGuessed">;
}) {
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

function setAvailablePoints(draft: {
  round: Pick<Round, "word" | "lettersGuessed" | "availablePoints">;
}) {
  draft.round.availablePoints = {
    letter: 1,
    word: getGuessWordPoints(draft),
  };
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

let lastUndoableState: PlayingState | null = null;
const UNDOABLE_ACTIONS: Action["type"][] = ["guessLetter"];

export function reducer(state: State, action: Action): State {
  if (action.type === "undo" && lastUndoableState) {
    const next = lastUndoableState;
    return next;
  }

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

    const word = action.word.toUpperCase();

    const next: PlayingState = {
      ...state,
      step: "playing",
      round: {
        ...state.round,
        guessMode: "letter",
        wordGuess: [],
        availablePoints: {
          letter: 0,
          word: 0,
        },
        guessModeOptions:
          state.game.maxWordGuesses > 0 ? ["letter", "word"] : ["letter"],
        lettersGuessed: {},
        wordsGuessed: {},
        playerGuesses: resetGuesses(state.game),
        word,
        hint: action.hint.toUpperCase(),
        turn: nextPlayer.id,
        points: resetPoints(state.game.players),
        winner: null,
      },
    };

    return produce(next, (draft) => {
      setAvailablePoints(draft);
    });
  }

  if (
    action.type === "guessLetter" &&
    state.step === "playing" &&
    state.round.guessMode === "letter"
  ) {
    const result = produce(state, (draft) => {
      const letter = action.letter.toUpperCase();

      if (state.round.lettersGuessed[letter]) {
        playSound("wrong", "[letterGuess] letter already guessed");
        return;
      }

      if (state.round.playerGuesses[state.round.turn].letters <= 0) {
        playSound("wrong", "[letterGuess] no more letter guesses");
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
        playSound("wrong", "[letterGuess] no more guesses");
      }

      if (checkRoundOver(draft)) {
        return;
      }

      setNextPlayer(draft);
    });

    const next = produce(result, (draft) => {
      setAvailableModes(draft);
      setAvailablePoints(draft);
    });

    lastUndoableState = state;

    return next;
  }

  if (
    action.type === "backspace" &&
    state.step === "playing" &&
    state.round.guessMode === "word"
  ) {
    return produce(state, (draft) => {
      const nextEmpty = draft.round.wordGuess.findIndex(
        (value) => value === ""
      );

      let index = nextEmpty;

      do {
        index = Math.max(0, index - 1);

        const letter = draft.round.wordGuess[index];

        if (!draft.round.lettersGuessed[letter]) {
          break;
        }
      } while (index > -1);

      draft.round.wordGuess[Math.max(index, 0)] = "";
      playSound("erase");
    });
  }

  if (
    action.type === "guessLetter" &&
    state.step === "playing" &&
    state.round.guessMode === "word"
  ) {
    const nextEmpty = state.round.wordGuess.findIndex((value) => value === "");

    const next = produce(state, (draft) => {
      if (nextEmpty > -1) {
        draft.round.wordGuess[nextEmpty] = action.letter;
        playSound("select");
      }

      setAvailableModes(draft);
      setAvailablePoints(draft);
    });

    lastUndoableState = structuredClone(state) as PlayingState;
    lastUndoableState.round.wordGuess = Array.from(
      {
        length: state.round.word.length,
      },
      () => ""
    );

    return next;
  }

  if (action.type === "guessWord" && state.step === "playing") {
    const word = removeAccents(action.word.toUpperCase());
    const remainingLetters = getRemainingLetters(state);

    const result = produce(state, (draft) => {
      if (draft.round.wordsGuessed[word]) {
        playSound("wrong", "[wordGuess] word already guessed");
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
          playSound("wrong", "[wordGuess] no more guesses");
        }
      }
    });

    return produce(result, (draft) => {
      const points = getGuessWordPoints(draft);

      if (word === draft.round.word) {
        draft.round.points[draft.round.turn] += points;

        if (points > 1) {
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
      setAvailablePoints(draft);
    });
  }

  if (action.type === "setGuessMode" && state.step === "playing") {
    return produce(state, (draft) => {
      draft.round.guessMode = action.mode;

      if (action.mode === "word") {
        const guess = Array.from({ length: draft.round.word.length }, () => "");

        for (let i in guess) {
          const letter = state.round.word[i];

          if (state.round.lettersGuessed[letter]) {
            guess[i] = letter;
          }
        }

        draft.round.wordGuess = guess;
      }
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

  if (action.type === "skip" && state.step === "playing") {
    const next = produce(state, (draft) => {
      playSound("skip");
      setNextPlayer(draft);
    });

    lastUndoableState = state;

    return next;
  }

  if (action.type === "restart" && state.step === "playing") {
    return {
      step: "creatingGame",
      type: state.type,
    };
  }

  return state;
}

export const GameStateContext = createContext<State>({
  step: "selectingScreenType",
});
const ActionContext = createContext<Dispatch<Action>>(() => {});

function StateProvider({
  state,
  children,
}: PropsWithChildren<{ state: State }>) {
  return (
    <GameStateContext.Provider value={state}>
      {children}
    </GameStateContext.Provider>
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
  return `game-${type ?? "game"}`;
}

export function GameProvider({
  children,
}: {
  children: (state: State) => JSX.Element;
}) {
  const screenType = new URLSearchParams(window.location.search).get(
    "screen_type"
  ) as ScreenType;

  const [state, send] = useReducer(reducer, screenType, (screenType) => {
    try {
      const local = window.localStorage.getItem(getStorageKey(screenType));

      if (!local) {
        throw new Error("No local game");
      }

      const game = JSON.parse(local);

      if (game.step === "selectingScreenType" && screenType) {
        return {
          step: "creatingGame",
          type: screenType,
        };
      }

      return game;
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

  useEffect(() => {
    if (state.step === "playing" && state.round.guessMode === "word") {
      const guessLength = state.round.wordGuess.filter(Boolean).length;

      if (
        guessLength === state.round.word.length &&
        state.round.winner == null
      ) {
        send({ type: "guessWord", word: state.round.wordGuess.join("") });
      }
    }
  }, [state]);

  return (
    <StateProvider state={state}>
      <ActionProvider send={sendWithBroadcast}>
        {children(state)}
      </ActionProvider>
    </StateProvider>
  );
}

export function useGameState<S extends State["step"]>(step: S) {
  const state = useContext(GameStateContext);

  if (state.step === step) {
    return state as Extract<State, { step: S }>;
  }

  throw new Error(`Invalid state step: ${step}`);
}

export function useGameAction() {
  return useContext(ActionContext);
}

export const SOUNDS = [
  "correct",
  "start",
  "lost",
  "wrong",
  "winner",
  "select",
  "erase",
  "skip",
] as const;

export type GameSound = (typeof SOUNDS)[number];

export function getGuessWordPoints(state: {
  round: Pick<Round, "word" | "lettersGuessed">;
}) {
  const remaining = getRemainingLetters({
    round: {
      word: state.round.word,
      lettersGuessed: state.round.lettersGuessed,
    },
  });

  return remaining > state.round.word.length / 2 ? remaining * 2 : remaining;
}
