import { ReactNode, useState } from "react";
import { useGameAction } from "../core";
import { ContractIcon } from "../icons/ContractIcon";
import { ExpandIcon } from "../icons/ExpandIcon";
import { ResetIcon } from "../icons/ResetIcon";

export function Toolbar() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const send = useGameAction();

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      setIsFullscreen(false);
      document.exitFullscreen();
    } else {
      setIsFullscreen(true);
      document.documentElement.requestFullscreen();
    }
  }

  function reset() {
    if (window.confirm("Tem certeza que deseja começar um novo jogo?")) {
      send({ type: "restart" });
    }
  }

  return (
    <div className="bg-neutral-900 w-full h-8 text-white flex items-center gap-2 px-1">
      <ToolbarAction
        label="Tela cheia"
        onClick={toggleFullscreen}
        icon={
          isFullscreen ? (
            <ContractIcon className="w-4" />
          ) : (
            <ExpandIcon className="w-4" />
          )
        }
      />

      <ToolbarAction
        label="Recomeçar"
        onClick={reset}
        icon={<ResetIcon className="w-4" />}
      />
    </div>
  );
}

function ToolbarAction({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: ReactNode;
  label?: string;
}) {
  return (
    <button
      className="p-1 hover:bg-neutral-700 rounded flex gap-1 text-xs"
      onClick={onClick}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
}
