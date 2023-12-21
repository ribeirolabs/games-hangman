import { ButtonHTMLAttributes, ReactNode } from "react";

export function ActionButton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
}) {
  return (
    <button
      className="uppercase text-sm h-24 w-24 rounded-full bg-primary text-white font-bold flex items-center justify-center border-inside active:animate-ping"
      {...props}
    >
      {children}
    </button>
  );
}
