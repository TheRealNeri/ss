"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { resultToTarget, searchEntities, targetLabel } from "@/lib/services/search";
import { searchEntityLabel, t } from "@/lib/services/i18n";
import { Language, SearchTarget } from "@/lib/types/model";
import { clsx } from "clsx";

type SearchComboboxProps = {
  value: SearchTarget | null;
  language: Language;
  placeholder: string;
  onSelect: (target: SearchTarget | null) => void;
};

export function SearchCombobox({ value, language, placeholder, onSelect }: SearchComboboxProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (value) {
      setQuery(targetLabel(value, language));
      return;
    }

    setQuery("");
  }, [value, language]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, []);

  const results = useMemo(() => searchEntities(query, language), [query, language]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, language]);

  const selectIndex = (index: number) => {
    const result = results[index];
    if (!result) return;
    onSelect(resultToTarget(result));
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <div className="flex items-center rounded-2xl border border-slate-200 bg-white shadow-sm transition focus-within:border-slate-900 focus-within:shadow-md">
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            if (!event.target.value) onSelect(null);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
              setOpen(true);
              return;
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((current) => Math.min(current + 1, Math.max(0, results.length - 1)));
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((current) => Math.max(current - 1, 0));
            }

            if (event.key === "Enter" && open) {
              event.preventDefault();
              selectIndex(activeIndex);
            }

            if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          className="w-full rounded-2xl bg-transparent px-4 py-3 text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              onSelect(null);
              setOpen(false);
            }}
            className="mr-2 rounded-full px-2 py-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Clear"
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.16)]">
          {results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500">{t(language, "noSearchResults")}</div>
          ) : (
            <ul className="max-h-72 overflow-y-auto scrollbar-thin" role="listbox">
              {results.map((result, index) => (
                <li key={`${result.type}-${result.id}`}>
                  <button
                    type="button"
                    onClick={() => selectIndex(index)}
                    className={clsx(
                      "flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition",
                      activeIndex === index ? "bg-slate-50" : "hover:bg-slate-50"
                    )}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">{result.label}</div>
                      <div className="mt-1 truncate text-xs text-slate-500">{result.secondaryLabel}</div>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      {searchEntityLabel(language, result.type)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
