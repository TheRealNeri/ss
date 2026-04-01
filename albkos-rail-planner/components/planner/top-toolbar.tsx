import { Language } from "@/lib/types/model";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { ModeToggle } from "@/components/ui/mode-toggle";

type TopToolbarProps = {
  language: Language;
  onLanguageChange: (language: Language) => void;
  mode3d: boolean;
  onToggleMode3d: () => void;
};

export function TopToolbar({ language, onLanguageChange, mode3d, onToggleMode3d }: TopToolbarProps) {
  return (
    <div className="glass flex items-center justify-between gap-3 rounded-[1.4rem] px-3 py-2.5 md:rounded-full">
      <div className="min-w-0 px-2">
        <div className="truncate text-sm font-bold text-slate-900">Albania–Kosovo Integrated Rail</div>
        <div className="truncate text-xs text-slate-500">Interactive conceptual trip planning</div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <ModeToggle enabled={mode3d} onToggle={onToggleMode3d} />
        <LanguageToggle language={language} onChange={onLanguageChange} />
      </div>
    </div>
  );
}
