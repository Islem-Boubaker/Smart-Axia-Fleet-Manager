import { Children, useMemo, useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";

interface AppDataTableProps {
  columns: string[];
  children: ReactNode;
  totalResults?: number;
  dark?: boolean;
  ariaLabel?: string;
  pageSize?: number;
}

interface AppTdProps {
  children: ReactNode;
  className?: string;
}

interface AppTrProps {
  children: ReactNode;
}

const AppDataTable = ({
  columns,
  children,
  totalResults,
  dark = false,
  ariaLabel = "Data table",
  pageSize = 7,
}: AppDataTableProps) => {
  const rowNodes = useMemo(() => Children.toArray(children), [children]);
  const [currentPage, setCurrentPage] = useState(1);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [scrollbarLeft, setScrollbarLeft] = useState(0);
  const [showScrollbar, setShowScrollbar] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const SCROLLBAR_THUMB_WIDTH = 80; // Fixed width in pixels

  const totalPages = Math.max(1, Math.ceil(rowNodes.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return rowNodes.slice(start, start + pageSize);
  }, [rowNodes, safeCurrentPage, pageSize]);

  const resultsCount =
    typeof totalResults === "number" ? totalResults : rowNodes.length;

  const pageButtons = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (safeCurrentPage <= 3) return [1, 2, 3, 4, 5];
    if (safeCurrentPage >= totalPages - 2) {
      return [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ].filter((page) => page > 0);
    }

    return [
      safeCurrentPage - 2,
      safeCurrentPage - 1,
      safeCurrentPage,
      safeCurrentPage + 1,
      safeCurrentPage + 2,
    ];
  }, [safeCurrentPage, totalPages]);

  // Update scrollbar on scroll
  const updateScrollbar = () => {
    if (tableContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        tableContainerRef.current;

      // Check if scrollbar is needed
      const needsScroll = scrollWidth > clientWidth;
      setShowScrollbar(needsScroll);

      if (needsScroll) {
        // Calculate maximum scrollbar position (track width - thumb width)
        const trackWidth = clientWidth;
        const maxThumbPosition = trackWidth - SCROLLBAR_THUMB_WIDTH;

        // Calculate scrollbar thumb position
        const maxScroll = scrollWidth - clientWidth;
        const scrollPercentage = scrollLeft / maxScroll;
        setScrollbarLeft(scrollPercentage * maxThumbPosition);
      }
    }
  };

  // Handle scrollbar drag
  const handleScrollbarMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !tableContainerRef.current) return;

    const container = tableContainerRef.current;
    const scrollbarContainer = container.parentElement?.querySelector(
      ".scrollbar-track",
    ) as HTMLElement;

    if (!scrollbarContainer) return;

    const rect = scrollbarContainer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    // Calculate percentage based on track width minus thumb width
    const trackWidth = rect.width;
    const maxThumbPosition = trackWidth - SCROLLBAR_THUMB_WIDTH;
    const clampedMouseX = Math.max(0, Math.min(mouseX, maxThumbPosition));
    const percentage = clampedMouseX / maxThumbPosition;

    const { scrollWidth, clientWidth } = container;
    const maxScroll = scrollWidth - clientWidth;

    container.scrollLeft = percentage * maxScroll;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle scrollbar track click
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tableContainerRef.current) return;

    const container = tableContainerRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    // Calculate percentage based on track width minus thumb width
    const trackWidth = rect.width;
    const maxThumbPosition = trackWidth - SCROLLBAR_THUMB_WIDTH;
    const clampedMouseX = Math.max(0, Math.min(mouseX, maxThumbPosition));
    const percentage = clampedMouseX / maxThumbPosition;

    const { scrollWidth, clientWidth } = container;
    const maxScroll = scrollWidth - clientWidth;

    container.scrollLeft = percentage * maxScroll;
  };

  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const handleScroll = () => updateScrollbar();
    const handleResize = () => updateScrollbar();

    container.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    // Initial update
    updateScrollbar();

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [paginatedRows]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  return (
    <div
      className={`overflow-hidden rounded-2xl border ${
        dark
          ? "border-slate-700/80 bg-slate-900/40"
          : "border-slate-200/90 bg-white/90 shadow-glass"
      }`}
    >
      {/* Table Container with Custom Scrollbar */}
      <div
        ref={tableContainerRef}
        className="overflow-x-auto custom-scrollbar"
        style={{
          scrollbarWidth: "none", // Firefox
          msOverflowStyle: "none", // IE/Edge
        }}
      >
        <table
          className="min-w-full text-sm"
          role="table"
          aria-label={ariaLabel}
        >
          <thead>
            <tr className={dark ? "bg-slate-800/60" : "bg-slate-100/90"}>
              {columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className={`px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider ${
                    dark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            className={
              dark ? "divide-y divide-slate-800" : "divide-y divide-slate-200"
            }
          >
            {paginatedRows}
          </tbody>
        </table>
      </div>

      {/* Custom Horizontal Scrollbar */}
      {showScrollbar && (
        <div
          className={`scrollbar-track relative h-3 px-2 py-1 cursor-pointer ${
            dark ? "bg-slate-900/60" : "bg-slate-100/60"
          }`}
          onClick={handleTrackClick}
        >
          <div
            className={`scrollbar-thumb h-1.5 rounded-full transition-colors ${
              isDragging
                ? "bg-blue-600"
                : dark
                  ? "bg-blue-500 hover:bg-blue-500"
                  : "bg-blue-500 hover:bg-blue-600"
            }`}
            style={{
              width: `${SCROLLBAR_THUMB_WIDTH}px`,
              marginLeft: `${scrollbarLeft}px`,
            }}
            onMouseDown={handleScrollbarMouseDown}
          />
        </div>
      )}

      {/* Pagination Footer */}
      {resultsCount > 0 && (
        <div
          className={`flex items-center justify-between border-t px-5 py-3 text-xs ${
            dark
              ? "border-slate-800 text-slate-400"
              : "border-slate-200 text-slate-500"
          }`}
        >
          <span>
            Showing {resultsCount} result{resultsCount === 1 ? "" : "s"}
          </span>

          {rowNodes.length > pageSize && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                className={`h-8 px-2 rounded-md transition-colors ${
                  dark
                    ? "text-slate-300 hover:bg-slate-800"
                    : "text-slate-600 hover:bg-slate-100"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
              >
                {"‹ Prev"}
              </button>

              {pageButtons.map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`h-8 w-8 rounded-md text-sm font-medium transition-colors ${
                    page === safeCurrentPage
                      ? dark
                        ? "bg-blue-500 text-white"
                        : "bg-blue-600 text-white"
                      : dark
                        ? "text-slate-300 hover:bg-slate-800"
                        : "text-slate-600 hover:bg-slate-100"
                  }`}
                  onClick={() => setCurrentPage(page)}
                  aria-label={`Go to page ${page}`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                className={`h-8 px-2 rounded-md transition-colors ${
                  dark
                    ? "text-slate-300 hover:bg-slate-800"
                    : "text-slate-600 hover:bg-slate-100"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={safeCurrentPage === totalPages}
              >
                {"Next ›"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const AppTd = ({ children, className = "" }: AppTdProps) => (
  <td className={`px-5 py-3.5 align-middle ${className}`}>{children}</td>
);

export const AppTr = ({ children }: AppTrProps) => (
  <tr className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/45">
    {children}
  </tr>
);

export default AppDataTable;