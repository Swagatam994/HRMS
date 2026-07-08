import { formatDate, formatScore } from './formatters.js';

export const downloadInterviewPdf = async (interview) => {
  const jspdfModule = await import('jspdf');
  const jsPDF = jspdfModule.jsPDF || jspdfModule.default;
  const doc = new jsPDF();
  const report = interview.finalReport || {};
  let y = 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('AI Interview Report', 14, y);
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Role: ${interview.role}`, 14, y);
  y += 7;
  doc.text(`Date: ${formatDate(interview.createdAt)}`, 14, y);
  y += 7;
  doc.text(`Overall Score: ${formatScore(report.overallScore)}`, 14, y);
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 14, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize(report.summary || 'No summary available.', 180), 14, y);
  y += 20;

  (interview.answers || []).forEach((answer, index) => {
    if (y > 260) {
      doc.addPage();
      y = 18;
    }
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${answer.question}`, 14, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Score: ${formatScore(answer.feedback?.score?.overall)}`, 14, y);
    y += 7;
    doc.text(doc.splitTextToSize(`Feedback: ${(answer.feedback?.suggestions || []).join('; ')}`, 180), 14, y);
    y += 16;
  });

  doc.save(`interview-report-${interview._id || interview.id}.pdf`);
};
