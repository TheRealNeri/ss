import { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
  panel: ReactNode;
  toolbar: ReactNode;
};

export function AppShell({ children, panel, toolbar }: AppShellProps) {
  return (
    <div className="relative h-screen w-full overflow-hidden">
      <div className="absolute inset-0">{children}</div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center px-3 py-3 safe-top md:px-5">
        <div className="pointer-events-auto w-full max-w-6xl">{toolbar}</div>
      </div>

      <aside className="pointer-events-none absolute inset-x-3 bottom-3 z-20 mobile-panel-height md:bottom-5 md:left-5 md:right-auto md:top-5 md:max-h-none md:w-[430px] safe-bottom">
        <div className="pointer-events-auto h-full">{panel}</div>
      </aside>
    </div>
  );
}
