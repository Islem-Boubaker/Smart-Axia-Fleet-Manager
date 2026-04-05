/** Shared shell classes to match Trips / glass aesthetic in light & dark mode */

export function pageShellClasses(dark: boolean): string {
  return dark
    ? 'rounded-[24px] border border-slate-700/80 bg-slate-900/35 backdrop-blur-sm'
    : 'rounded-[24px] border border-slate-200/90 bg-white/70 backdrop-blur-md shadow-soft';
}

export const pageShellInnerSpacing = 'p-6 sm:p-8 lg:p-10 space-y-8 lg:space-y-10';
