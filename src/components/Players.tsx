import { Player, useGameState } from "../core";
import { cn } from "../utils";
import { PencilIcon, ChatIcon, TrophyIcon, BlockIcon } from "./Icons";

type PlayerWithState = Player & {
  state: "host" | "turn" | "waiting" | "winner";
};

export function Players() {
  const { game, round } = useGameState("playing");

  const { host, players } = [...game.players]
    .map((player) => {
      const isHost = round.host === player.id;
      const isTurn = round.turn === player.id && round.winner == null;
      const isWinner = round.winner === player.id;

      return {
        ...player,
        state: isHost
          ? "host"
          : isTurn
          ? "turn"
          : isWinner
          ? "winner"
          : "waiting",
      } satisfies PlayerWithState;
    })
    .reduce(
      (state, player) => {
        if (player.state === "host") {
          state.host = player;
        } else {
          state.players.push(player);
        }

        return state;
      },
      {
        host: {} as any,
        players: [],
      } as {
        host: PlayerWithState;
        players: PlayerWithState[];
      }
    );

  return (
    <header className="p-3 flex w-full justify-between bg-neutral-900">
      <PlayerCard player={host} />

      <div className="flex gap-3">
        {players.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </header>
  );
}
function PlayerCard({ player }: { player: PlayerWithState }) {
  const { round, game } = useGameState("playing");

  const isHost = player.state === "host";
  const isWinner = player.state === "winner";
  const isTurn = player.state === "turn";

  const letterGuesses = round.playerGuesses[player.id].letters;
  const wordGuesses = round.playerGuesses[player.id].words;
  const isOut = wordGuesses > 0 ? false : letterGuesses === 0;
  const roundPoints = round.points[player.id];

  return (
    <div
      key={player.id}
      className={cn(
        "flex min-w-[200px] flex-col text-white rounded-lg overflow-hidden relative",
        isWinner
          ? "bg-green-700 text-black/70 animate-bounce"
          : isHost && round.winner && !isWinner
          ? "bg-red-900"
          : isHost
          ? "bg-info-700"
          : isTurn
          ? "animate--pulse bg-green-600"
          : isOut
          ? "opacity-50"
          : "bg-neutral-800"
      )}
    >
      <div className="flex justify-between p-2 px-4">
        <div
          className={cn(
            "flex items-center justify-center gap-2 text-3xl uppercase font-bold flex-grow-0 tracking-wider"
          )}
        >
          <span>{player.name}</span>
        </div>

        <div className="flex items-center">
          {isHost && round.winner == null && <PencilIcon />}
          {isTurn && (
            <div className="animate-bounce">
              <ChatIcon />
            </div>
          )}
          {isWinner && <TrophyIcon />}
          {isOut && <BlockIcon />}
        </div>

        <div className="text-3xl font-extrabold">
          {game.playerPoints[player.id]}
        </div>
      </div>

      <div
        className={cn(
          "flex-1 flex justify-between font-bold p-2 bg-neutral-800/30 uppercase",
          isOut && "bg-transparent"
        )}
      >
        {isHost ? null : (
          <div className="flex justify-around flex-[2]">
            <div className="flex-1 text-center">
              <div className="text-[10px]">Letras</div>
              <div className="text-2xl">{letterGuesses}</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-[10px]">Chutes</div>
              <div className="text-2xl">{wordGuesses}</div>
            </div>
          </div>
        )}

        <div className="h-full flex items-center justify-end flex-1">
          <div className="flex items-center justify-center">
            <div className="text-xl">
              {roundPoints === 0 ? "" : roundPoints > 0 ? "+" : "-"}
            </div>
            <div className="text-4xl">{Math.abs(roundPoints)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
