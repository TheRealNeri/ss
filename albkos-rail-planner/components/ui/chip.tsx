import { ReactNode } from "react";
import { clsx } from "clsx";

type ChipProps = {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
};

export function Chip({ children, active = false, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition",
        active
          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
          : "border-slate-200 bg-white/85 text-slate-700 hover:border-slate-300 hover:bg-white"
      )}
    >
      {children}
    </button>
  );
}
