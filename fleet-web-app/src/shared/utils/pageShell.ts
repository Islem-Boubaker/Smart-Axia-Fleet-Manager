/** Shared shell classes for the rounded workspace used across protected pages. */

export function pageShellClasses(dark: boolean): string {
  return dark
    ? "relative overflow-hidden rounded-[30px] border border-cyan-200/10 bg-[#081220]/92 shadow-soft ring-1 ring-cyan-100/[0.045] before:pointer-events-none before:absolute before:inset-x-8 before:-top-20 before:h-36 before:rounded-full before:bg-gradient-to-r before:from-cyan-400/16 before:via-sky-400/10 before:to-teal-300/8 before:blur-3xl"
    : "relative overflow-hidden rounded-[30px] border border-white/90 bg-white/94 shadow-soft ring-1 ring-sky-100/80 before:pointer-events-none before:absolute before:inset-x-8 before:-top-20 before:h-36 before:rounded-full before:bg-gradient-to-r before:from-sky-100/95 before:via-cyan-50/90 before:to-amber-50/90 before:blur-3xl";
}

export const pageShellInnerSpacing = 'p-5 sm:p-7 lg:p-8 space-y-6 lg:space-y-7';
