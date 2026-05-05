import { FiDownload } from "react-icons/fi";
import { useTranslation } from 'react-i18next';
import { Button } from "../../../shared/components";

interface ReportsHeaderProps {
  dark?: boolean;
}

const ReportsHeader = ({ dark = false }: ReportsHeaderProps) => {
  const { t } = useTranslation();
  const exportPDF = async () => {
    const element = document.getElementById("pdf-content");

    if (!element) return;

    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    pdf.save("report.pdf");
  };
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 sm:gap-8">
      <div className="space-y-2">
        <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
          {t('reports.section_label')}
        </p>
        <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
          {t('reports.title')}
        </h1>
        <p className={`text-sm sm:text-base leading-relaxed max-w-xl ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
          {t('reports.subtitle')}
        </p>
      </div>
      <Button onClick={() => exportPDF()} className="rounded-xl shrink-0">
        <FiDownload className="mr-2" />
        {t('reports.export_pdf')}
      </Button>
    </div>
  );
};

export default ReportsHeader;
