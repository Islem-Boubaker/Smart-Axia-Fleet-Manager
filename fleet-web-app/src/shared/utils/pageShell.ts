/** Shared shell classes to match Trips / glass aesthetic in light & dark mode */

export function pageShellClasses(dark: boolean): string {
  return dark
    ? "relative overflow-hidden rounded-[24px] border border-slate-700/80 bg-slate-900/45 backdrop-blur-md ring-1 ring-white/[0.04] shadow-soft before:pointer-events-none before:absolute before:inset-x-8 before:-top-16 before:h-28 before:rounded-full before:bg-gradient-to-r before:from-brand/25 before:via-cyan-400/10 before:to-indigo-400/20 before:blur-2xl"
    : "relative overflow-hidden rounded-[24px] border border-slate-200/90 bg-white/80 backdrop-blur-md shadow-soft before:pointer-events-none before:absolute before:inset-x-8 before:-top-16 before:h-28 before:rounded-full before:bg-gradient-to-r before:from-brand-light/90 before:via-cyan-100/70 before:to-indigo-100/80 before:blur-2xl";
}

export const pageShellInnerSpacing = 'p-6 sm:p-8 lg:p-10 space-y-8 lg:space-y-10';
