type ModeToggleProps = {
  enabled: boolean;
  onToggle: () => void;
};

export function ModeToggle({ enabled, onToggle }: ModeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white"
      aria-pressed={enabled}
      aria-label={enabled ? "Switch to 2D map" : "Switch to 3D map"}
    >
      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-slate-900" />
      {enabled ? "3D" : "2D"}
    </button>
  );
}
