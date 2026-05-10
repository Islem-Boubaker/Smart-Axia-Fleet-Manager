import { Children, useMemo, useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface AppDataTableProps {
  columns: string[];
  children: ReactNode;
  totalResults?: number;
  dark?: boolean;
  ariaLabel?: string;
  pageSize?: number;
  title?: string;
}

interface AppTdProps {
  children: ReactNode;
  className?: string;
}

interface AppTrProps {
  children: ReactNode;
}

const THUMB_W = 80;

// ─────────────────────────────────────────────────────────────────────────────
// RTL SCROLL STRATEGY
// The scroll container is always forced to dir="ltr" so that scrollLeft is
// always a plain 0 → maxScroll value regardless of the page language.
// For Arabic, we initialise scrollLeft = maxScroll so the right side (the
// logical start in RTL) is visible without any extra JS tricks.
// The <table> keeps dir="rtl" so column order and text alignment are correct.
// The custom-scrollbar math needs no special RTL branches.
// ─────────────────────────────────────────────────────────────────────────────

const AppDataTable = ({
  columns,
  children,
  totalResults,
  dark = false,
  ariaLabel,
  pageSize = 7,
  title,
}: AppDataTableProps) => {
  const { t, i18n } = useTranslation();
  const isRtl = (i18n.language || "en").split("-")[0] === "ar";

  const rowNodes = useMemo(() => Children.toArray(children), [children]);
  const [currentPage, setCurrentPage] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [thumbLeft, setThumbLeft] = useState(0);
  const [showScrollbar, setShowScrollbar] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const totalPages = Math.max(1, Math.ceil(rowNodes.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return rowNodes.slice(start, start + pageSize);
  }, [rowNodes, safeCurrentPage, pageSize]);

  const resultsCount =
    typeof totalResults === "number" ? totalResults : rowNodes.length;

  void title;
  const resolvedAriaLabel = ariaLabel || t("dataTable.aria");

  const pageButtons = useMemo(() => {
    if (totalPages <= 5)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (safeCurrentPage <= 3) return [1, 2, 3, 4, 5];
    if (safeCurrentPage >= totalPages - 2)
      return [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ].filter((p) => p > 0);
    return [
      safeCurrentPage - 2,
      safeCurrentPage - 1,
      safeCurrentPage,
      safeCurrentPage + 1,
      safeCurrentPage + 2,
    ];
  }, [safeCurrentPage, totalPages]);

  // ── Sync thumb to scroll position ─────────────────────────────────────────
  const syncThumb = () => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setShowScrollbar(maxScroll > 1);
    if (maxScroll > 1) {
      const maxThumb = clientWidth - THUMB_W;
      setThumbLeft((scrollLeft / maxScroll) * maxThumb);
    }
  };

  // ── Initialise RTL scroll to rightmost position ────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (isRtl) {
      el.scrollLeft = el.scrollWidth - el.clientWidth;
    } else {
      el.scrollLeft = 0;
    }
    syncThumb();
  }, [isRtl, paginatedRows]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", syncThumb);
    window.addEventListener("resize", syncThumb);
    return () => {
      el.removeEventListener("scroll", syncThumb);
      window.removeEventListener("resize", syncThumb);
    };
  }, [paginatedRows]);

  // ── Custom scrollbar drag ──────────────────────────────────────────────────
  const handleThumbDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const el = containerRef.current;
    const track = el.parentElement?.querySelector(
      ".scrollbar-track",
    ) as HTMLElement | null;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const maxThumb = rect.width - THUMB_W;
    const clamped = Math.max(0, Math.min(e.clientX - rect.left, maxThumb));
    el.scrollLeft = (clamped / maxThumb) * (el.scrollWidth - el.clientWidth);
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const maxThumb = rect.width - THUMB_W;
    const clamped = Math.max(0, Math.min(e.clientX - rect.left, maxThumb));
    el.scrollLeft = (clamped / maxThumb) * (el.scrollWidth - el.clientWidth);
  };

  useEffect(() => {
    if (!isDragging) return;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  return (
    <div
      className={`overflow-hidden rounded-[24px] border p-4 shadow-[0_18px_50px_rgba(8,47,73,0.08)] ${
        dark
          ? "border-cyan-200/10 bg-[linear-gradient(115deg,rgba(15,27,45,0.96),rgba(10,22,39,0.94)_52%,rgba(21,33,56,0.96))]"
          : "border-white/80 bg-[linear-gradient(105deg,#eefaff_0%,#f8fdff_48%,#edf7ff_100%)]"
      }`}
    >
      {/*
        Scroll container:
        • Always dir="ltr" → scrollLeft is always 0–maxScroll (no RTL browser
          quirks). scrollLeft=0 means physical left edge, maxScroll=physical right.
        • For RTL, we start scrolled to maxScroll (right edge = logical start).
        • The <table> gets the real dir so column order + alignment are correct.
      */}
      <div
        ref={containerRef}
        dir="ltr"
        className="w-full overflow-x-auto"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <table
          dir={isRtl ? "rtl" : "ltr"}
          className="min-w-[700px] w-full border-separate border-spacing-0 text-sm"
          role="table"
          aria-label={resolvedAriaLabel}
        >
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  scope="col"
                  className={`whitespace-nowrap px-5 py-3 text-start text-[12px] font-bold normal-case tracking-normal ${
                    dark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={dark ? "text-slate-200" : "text-slate-950"}>
            {paginatedRows}
          </tbody>
        </table>
      </div>

      {/* Custom horizontal scrollbar */}
      {showScrollbar && (
        <div
          className={`scrollbar-track relative mt-1 h-3 w-full cursor-pointer rounded-full ${
            dark ? "bg-slate-800/60" : "bg-slate-200/60"
          }`}
          onClick={handleTrackClick}
        >
          <div
            className={`absolute top-0.5 h-2 rounded-full transition-colors ${
              isDragging
                ? "bg-blue-600"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
            style={{ width: THUMB_W, left: thumbLeft }}
            onMouseDown={handleThumbDown}
          />
        </div>
      )}

      {/* Pagination */}
      {resultsCount > 0 && (
        <div
          className={`mt-4 flex items-center justify-between border-t px-1 pt-4 text-xs ${
            dark
              ? "border-cyan-200/10 text-slate-400"
              : "border-white/70 text-slate-500"
          }`}
        >
          <span>{t("common.showing_results", { count: resultsCount })}</span>

          {rowNodes.length > pageSize && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                className={`h-8 px-2 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  dark
                    ? "text-slate-300 hover:bg-cyan-300/10"
                    : "text-slate-600 hover:bg-white/80"
                }`}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
              >
                {t("dataTable.prev")}
              </button>

              {pageButtons.map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`h-8 w-8 rounded-md text-sm font-medium transition-colors ${
                    page === safeCurrentPage
                      ? dark
                        ? "bg-cyan-300/20 text-cyan-100 ring-1 ring-cyan-200/20"
                        : "bg-slate-950 text-white"
                      : dark
                        ? "text-slate-300 hover:bg-cyan-300/10"
                        : "text-slate-600 hover:bg-white/80"
                  }`}
                  onClick={() => setCurrentPage(page)}
                  aria-label={t("dataTable.page", { page })}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                className={`h-8 px-2 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  dark
                    ? "text-slate-300 hover:bg-cyan-300/10"
                    : "text-slate-600 hover:bg-white/80"
                }`}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={safeCurrentPage === totalPages}
              >
                {t("dataTable.next")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const AppTd = ({ children, className = "" }: AppTdProps) => (
  <td className={`whitespace-nowrap px-5 py-4 align-middle ${className}`}>
    {children}
  </td>
);

export const AppTr = ({ children }: AppTrProps) => (
  <tr className="group rounded-2xl transition-colors hover:bg-white/45 dark:hover:bg-cyan-300/[0.045]">
    {children}
  </tr>
);

export default AppDataTable;
