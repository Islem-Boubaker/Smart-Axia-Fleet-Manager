const LOGO_SRC = "/images/OFFICIAL%20LOGO.png";

const skeletonBlock = "rounded-2xl bg-slate-200/85 dark:bg-slate-700/55";

const LogoLoadingScreen = () => {
  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,#dff6ff_0%,#f8fdff_45%,#d9eef8_100%)] px-6 text-slate-900 dark:bg-[radial-gradient(circle_at_top_left,#123A5A_0%,#081321_42%,#050A12_100%)] dark:text-slate-100">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-7 flex flex-col items-center">
          <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-[26px] bg-slate-950 shadow-[0_18px_60px_rgba(8,47,73,0.24)] ring-1 ring-sky-200/50 dark:ring-cyan-200/10">
            <img src={LOGO_SRC} alt="AXIA Fleet Manager" className="h-full w-full object-cover" />
          </div>
          <p className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-sky-600 dark:text-cyan-300">
            AXIA Fleet Manager
          </p>
        </div>

        <div className="rounded-[30px] border border-white/80 bg-white/80 p-5 shadow-soft backdrop-blur-xl dark:border-cyan-200/10 dark:bg-[#0F1B2D]/88">
          <div className="animate-pulse space-y-4">
            <div className={`h-5 w-2/5 ${skeletonBlock}`} />
            <div className="grid grid-cols-3 gap-3">
              <div className={`h-20 ${skeletonBlock}`} />
              <div className={`h-20 ${skeletonBlock}`} />
              <div className={`h-20 ${skeletonBlock}`} />
            </div>
            <div className={`h-4 w-full ${skeletonBlock}`} />
            <div className={`h-4 w-5/6 ${skeletonBlock}`} />
            <div className={`h-28 ${skeletonBlock}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoLoadingScreen;
