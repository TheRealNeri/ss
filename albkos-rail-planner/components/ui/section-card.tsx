import { ReactNode } from "react";
import { clsx } from "clsx";

type SectionCardProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function SectionCard({
  title,
  subtitle,
  actions,
  children,
  className
}: SectionCardProps) {
  return (
    <section
      className={clsx(
        "surface rounded-[1.65rem] p-4",
        className
      )}
    >
      {(title || subtitle || actions) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h3 className="truncate text-sm font-semibold text-slate-900">{title}</h3>}
            {subtitle && <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
