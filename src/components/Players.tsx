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
    <header className="p-3 flex w-full justify-between">
      <PlayerCard player={host} />

      <div className="flex gap-1">
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
        "flex min-w-[10em] flex-col rounded-lg overflow-hidden relative border-inside p-2 gap-2 text-white/90",
        isWinner
          ? "bg-green-700 animate-bounce"
          : isTurn
          ? "bg-primary"
          : isOut
          ? "bg-neutral-800 opacity-50"
          : "bg-neutral-800"
      )}
    >
      <div className="flex gap-2">
        <div className="flex items-center text-xl uppercase font-black tracking-wider flex-1 bg-white/20 rounded px-1">
          <span>{player.name}</span>
        </div>

        <div className="text-2xl font-extrabold bg-white/20 px-1 rounded min-w-[2.5ch] text-center">
          {game.playerPoints[player.id]}
        </div>
      </div>

      <div className="flex-1 flex justify-between font-bold uppercase gap-1">
        {isHost ? null : (
          <div className="flex justify-around flex-[2]">
            <div className="flex-1 text-center">
              <div className="text-[.6em]">Letras</div>
              <div className="text-2xl">{letterGuesses}</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-[.6em]">Chutes</div>
              <div className="text-2xl">{wordGuesses}</div>
            </div>
          </div>
        )}

        <div className="h-full text-center flex-1">
          <div className="text-[.6em]">Rodada</div>
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
