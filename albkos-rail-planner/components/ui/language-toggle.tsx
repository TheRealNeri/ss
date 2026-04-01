import { Language } from "@/lib/types/model";

type LanguageToggleProps = {
  language: Language;
  onChange: (language: Language) => void;
};

export function LanguageToggle({ language, onChange }: LanguageToggleProps) {
  return (
    <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/90 p-1 shadow-sm">
      {(["sq", "en"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={[
            "rounded-full px-3 py-1.5 text-sm font-semibold transition",
            language === option ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
          ].join(" ")}
          aria-pressed={language === option}
        >
          {option === "sq" ? "Shqip" : "English"}
        </button>
      ))}
    </div>
  );
}
