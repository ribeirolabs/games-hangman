import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../utils";

export function ActionButton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
}) {
  return (
    <button
      className={cn(
        "uppercase text-sm h-24 w-24 rounded-full font-bold flex items-center justify-center border-inside",
        props.disabled
          ? "bg-neutral-300 text-neutral-400"
          : "bg-primary text-white active:animate-ping"
      )}
      {...props}
    >
      {children}
    </button>
  );
}
