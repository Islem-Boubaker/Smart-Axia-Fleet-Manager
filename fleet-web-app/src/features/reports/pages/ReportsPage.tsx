import { useEffect, useMemo, useRef, useState } from 'react';
import { FiExternalLink, FiRefreshCw } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import { Button } from '../../../shared/components';

interface ThemeContext {
  dark: boolean;
}

const DEFAULT_REPORT_TITLE = 'Tableau Fleet Reports';
const DEFAULT_REPORT_SUBTITLE = 'Live business intelligence embedded from Tableau.';
const DEFAULT_REPORT_HEIGHT = 1100;
const DEFAULT_REPORT_WIDTH = 1300;

const normalizeEmbedUrl = (value?: string) => {
  if (!value) return '';
  const trimmed = value.trim();

  try {
    const url = new URL(trimmed);
    const profileMatch = url.pathname.match(/^\/app\/profile\/[^/]+\/viz\/([^/]+)\/([^/?#]+)/i);

    if (profileMatch) {
      const [, workbook, view] = profileMatch;
      url.pathname = `/views/${workbook}/${view}`;
      url.search = '';
    }

    if (url.hostname.includes('tableau')) {
      if (!url.searchParams.has(':showVizHome')) {
        url.searchParams.set(':showVizHome', 'no');
      }

      if (!url.searchParams.has(':embed')) {
        url.searchParams.set(':embed', 'yes');
      }
    }

    return url.toString();
  } catch {
    return trimmed;
  }
};

const parseHeight = (value?: string) => {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 480) return DEFAULT_REPORT_HEIGHT;
  return parsed;
};

const parseWidth = (value?: string) => {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 960) return DEFAULT_REPORT_WIDTH;
  return parsed;
};

const ReportsPage = () => {
  const { dark } = useOutletContext<ThemeContext>();
  const { t } = useTranslation();
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const reportFrameRef = useRef<HTMLDivElement | null>(null);
  const tableauContainerRef = useRef<HTMLDivElement | null>(null);
  const [embedScale, setEmbedScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState(DEFAULT_REPORT_HEIGHT);

  const reportTitle =
    import.meta.env.VITE_TABLEAU_REPORT_TITLE?.trim() ||
    import.meta.env.VITE_POWER_BI_REPORT_TITLE?.trim() ||
    t('reports.tableau.defaultTitle', { defaultValue: DEFAULT_REPORT_TITLE });
  const reportSubtitle =
    import.meta.env.VITE_TABLEAU_REPORT_SUBTITLE?.trim() ||
    t('reports.tableau.defaultSubtitle', { defaultValue: DEFAULT_REPORT_SUBTITLE });
  const embedUrl = normalizeEmbedUrl(
    import.meta.env.VITE_TABLEAU_EMBED_URL || import.meta.env.VITE_POWER_BI_EMBED_URL,
  );
  const reportHeight = parseHeight(
    import.meta.env.VITE_TABLEAU_EMBED_HEIGHT || import.meta.env.VITE_POWER_BI_EMBED_HEIGHT,
  );
  const reportWidth = parseWidth(import.meta.env.VITE_TABLEAU_EMBED_WIDTH);
  const scaledWidth = reportWidth * embedScale;
  const isConfigured = embedUrl.length > 0;
  const isTableauEmbed = useMemo(() => {
    if (!embedUrl) return false;

    try {
      return new URL(embedUrl).hostname.includes('tableau');
    } catch {
      return false;
    }
  }, [embedUrl]);

  useEffect(() => {
    const updateScale = () => {
      const frame = reportFrameRef.current;
      const viewer = viewerRef.current;
      if (!frame || !viewer) return;

      const availableWidth = viewer.clientWidth;
      const availableHeight = viewer.clientHeight;
      const nextScale = Math.min(availableWidth / reportWidth, availableHeight / reportHeight, 1);

      setEmbedScale(nextScale);
      setScaledHeight(reportHeight * nextScale);
    };

    updateScale();

    const resizeObserver = new ResizeObserver(() => {
      updateScale();
    });

    if (viewerRef.current) {
      resizeObserver.observe(viewerRef.current);
    }

    window.addEventListener('resize', updateScale);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [reportHeight, reportWidth]);

  useEffect(() => {
    if (!isConfigured || !isTableauEmbed || !tableauContainerRef.current) return;

    const container = tableauContainerRef.current;
    container.innerHTML = '';

    const srcUrl = new URL(embedUrl);
    const scriptSrc = `${srcUrl.origin}/javascripts/api/tableau.embedding.3.latest.min.js`;
    const scriptId = `tableau-embed-api-${srcUrl.host.replaceAll('.', '-')}`;

    const mountViz = () => {
      const viz = document.createElement('tableau-viz');
      viz.setAttribute('src', embedUrl);
      viz.setAttribute('toolbar', 'bottom');
      viz.setAttribute('hide-tabs', '');
      viz.style.width = '100%';
      viz.style.height = `${reportHeight}px`;
      container.replaceChildren(viz);
    };

    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (existingScript?.dataset.loaded === 'true') {
      mountViz();
      return;
    }

    const script = existingScript ?? document.createElement('script');
    script.id = scriptId;
    script.type = 'module';
    script.src = scriptSrc;

    const handleLoad = () => {
      script.dataset.loaded = 'true';
      mountViz();
    };

    script.addEventListener('load', handleLoad);

    if (!existingScript) {
      document.body.appendChild(script);
    }

    return () => {
      script.removeEventListener('load', handleLoad);
    };
  }, [embedUrl, isConfigured, isTableauEmbed, reportHeight]);

  return (
    <div className={`relative h-full min-h-0 overflow-hidden rounded-[30px] border shadow-soft ${
      dark ? 'border-slate-700/70 bg-slate-950/80' : 'border-white/90 bg-white/94'
    }`}>
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          className="rounded-full shadow-lg"
          onClick={() => window.location.reload()}
          title={t('reports.tableau.refreshTitle')}
        >
          <FiRefreshCw className="mr-1.5" />
          {t('reports.tableau.refresh')}
        </Button>
        {isConfigured && (
          <Button
            type="button"
            className="rounded-full shadow-lg"
            onClick={() => window.open(embedUrl, '_blank', 'noopener,noreferrer')}
            title={t('reports.tableau.openTitle')}
          >
            <FiExternalLink className="mr-1.5" />
            {t('reports.tableau.open')}
          </Button>
        )}
      </div>

      {isConfigured ? (
        <div
          ref={viewerRef}
          className="grid h-full w-full place-items-center overflow-hidden"
          aria-label={reportTitle}
        >
          {isTableauEmbed ? (
            <div
              ref={reportFrameRef}
              className="overflow-hidden"
              style={{ width: `${scaledWidth}px`, height: `${scaledHeight}px` }}
            >
              <div
                ref={tableauContainerRef}
                className="origin-top-left"
                style={{
                  width: `${reportWidth}px`,
                  minHeight: `${reportHeight}px`,
                  transform: `scale(${embedScale})`,
                }}
              />
            </div>
          ) : (
            <div
              ref={reportFrameRef}
              className="overflow-hidden"
              style={{ width: `${scaledWidth}px`, height: `${scaledHeight}px` }}
            >
              <iframe
                title={reportTitle}
                src={embedUrl}
                className="origin-top-left border-0"
                style={{
                  width: `${reportWidth}px`,
                  height: `${reportHeight}px`,
                  transform: `scale(${embedScale})`,
                }}
                loading="lazy"
                allowFullScreen
              />
            </div>
          )}
        </div>
      ) : (
        <div className="grid h-full place-items-center px-5">
          <div className={`max-w-2xl rounded-xl border border-dashed px-5 py-6 ${
            dark ? 'border-slate-700 bg-slate-900/60' : 'border-slate-300 bg-white'
          }`}>
            <h2 className={`text-lg font-semibold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>
              {t('reports.tableau.notConfigured')}
            </h2>
            <p className={`mt-2 text-sm leading-6 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
              {reportSubtitle}
            </p>
            <div className={`mt-4 rounded-xl px-4 py-3 font-mono text-xs ${
              dark ? 'bg-slate-950 text-slate-300' : 'bg-slate-900 text-slate-100'
            }`}>
              VITE_TABLEAU_EMBED_URL=https://public.tableau.com/views/your-workbook/your-view?:showVizHome=no
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
