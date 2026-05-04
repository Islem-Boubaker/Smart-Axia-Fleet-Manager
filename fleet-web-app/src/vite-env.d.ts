/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_TABLEAU_EMBED_URL?: string;
  readonly VITE_TABLEAU_REPORT_TITLE?: string;
  readonly VITE_TABLEAU_REPORT_SUBTITLE?: string;
  readonly VITE_TABLEAU_EMBED_HEIGHT?: string;
  readonly VITE_TABLEAU_EMBED_WIDTH?: string;
  readonly VITE_POWER_BI_EMBED_URL?: string;
  readonly VITE_POWER_BI_REPORT_TITLE?: string;
  readonly VITE_POWER_BI_REPORT_SUBTITLE?: string;
  readonly VITE_POWER_BI_EMBED_HEIGHT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
