import { FiDownload } from "react-icons/fi";
import { Button } from "../../../shared/components";
import { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const ReportsHeader = () => {
  const exportPDF = async () => {
    const element = document.getElementById("pdf-content");

    if (!element) return;

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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">View fleet analytics and reports</p>
      </div>
      <Button onClick={() => exportPDF()}>
        <FiDownload className="mr-2" />
        Export Report
      </Button>
    </div>
  );
};

export default ReportsHeader;
