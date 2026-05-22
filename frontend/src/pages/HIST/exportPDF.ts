import type { AssessmentHistoryEntry } from '../../db/db';

export async function exportHistoryToPDF(
  user: { name?: string },
  selectedScans: AssessmentHistoryEntry[],
  t: (key: string) => string,
  getRiskMeta: (riskLevel: AssessmentHistoryEntry['riskLevel'], t: (key: string) => string) => { label: string; className: string },
  formatDate: (date: string) => string
) {
  // Dynamically import jsPDF only when needed
  const { jsPDF } = await import('jspdf');
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  doc.setFontSize(16);
  doc.text(t('history_page.pdf_title'), pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  const disclaimerText = `${t('home.warning')}: ${t('home.medical_warning_text')}`;
  const disclaimerLines = doc.splitTextToSize(disclaimerText, pageWidth - 48);
  const disclaimerHeight = Math.max(16, disclaimerLines.length * 5 + 8);

  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(251, 146, 60);
  doc.roundedRect(20, yPos, pageWidth - 40, disclaimerHeight, 3, 3, 'FD');
  doc.setFontSize(9);
  doc.setTextColor(124, 45, 18);
  doc.text(disclaimerLines, 24, yPos + 7);
  doc.setTextColor(0, 0, 0);
  yPos += disclaimerHeight + 10;

  doc.setFontSize(11);
  doc.text(`${t('history_page.pdf_patient')}${user?.name || '---'}`, 20, yPos);
  yPos += 5;
  doc.text(`${t('history_page.pdf_date')}${new Date().toLocaleDateString()}`, 20, yPos);
  yPos += 15;

  doc.setFontSize(12);
  doc.text(t('history_page.pdf_exams'), 20, yPos);
  yPos += 10;

  selectedScans.forEach((scan, index) => {
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(10);
    doc.text(`${t('history_page.pdf_exam')} ${index + 1}`, 20, yPos);
    yPos += 5;

    const riskMeta = getRiskMeta(scan.riskLevel, t);
    const riskText = riskMeta.label;

    doc.setFontSize(9);
    doc.text(`${t('history_page.pdf_exam_date')}${formatDate(scan.createdAt)}`, 20, yPos);
    yPos += 4;
    doc.text(`${t('history_page.pdf_prob')}${scan.probability}% (${riskText})`, 20, yPos);
    yPos += 4;

    if (scan.imageUrl) {
      try {
        doc.addImage(scan.imageUrl, 'JPEG', 20, yPos, 50, 50);
        yPos += 55;
      } catch {
        doc.text(t('history_page.pdf_err_image'), 20, yPos);
        yPos += 10;
      }
    } else {
      doc.text(t('history_page.pdf_no_image'), 20, yPos);
      yPos += 10;
    }

    yPos += 5;
  });

  doc.save('Nevo_Relatorio_Historico.pdf');
}
