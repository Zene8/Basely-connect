import { jsPDF } from "jspdf";
import { SynthesizedPortfolio, CompanyMatch } from "@/types";

// Helper to ASCII-fy text for standard PDF fonts
function cleanForPdf(text: string): string {
  if (!text) return "";
  return text
    .replace(/[^\x20-\x7E\n\r]/g, (char) => {
      // Replace common chars with ASCII equivalents
      const map: Record<string, string> = {
        '—': '-', '–': '-', '“': '"', '”': '"', '‘': "'", '’': "'", '•': '-', '…': '...',
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ñ': 'n',
        'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U', 'Ñ': 'N',
      };
      return map[char] || '';
    });
}

export async function generatePortfolioPDF(portfolio: SynthesizedPortfolio, matches: CompanyMatch[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  // Colors
  const dark = "#010102";
  const gray = "#52525b";

  // Header Background
  doc.setFillColor(15, 23, 42); // Navy
  doc.rect(0, 0, pageWidth, 50, 'F');

  // Name & Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text(cleanForPdf(portfolio.name).toUpperCase(), margin, 32);

  doc.setTextColor(34, 211, 238); // Cyan-400
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(cleanForPdf(portfolio.title).toUpperCase(), margin, 42);

  let y = 70;

  // Summary
  doc.setTextColor(dark);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("EXECUTIVE SUMMARY", margin, y);
  y += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const cleanSummary = cleanForPdf(portfolio.summary.replace(/[#*`]/g, ''));
  const summaryLines = doc.splitTextToSize(cleanSummary, contentWidth);
  doc.text(summaryLines, margin, y);
  y += (summaryLines.length * 5) + 12;

  // Experience Summary
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("CAREER HISTORY & EXPERIENCE", margin, y);
  y += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const cleanExp = cleanForPdf(portfolio.experienceSummary.replace(/[#*`]/g, ''));
  const expLines = doc.splitTextToSize(cleanExp, contentWidth);

  if (y + (expLines.length * 5) > pageHeight - margin) {
    doc.addPage();
    y = margin;
  }

  doc.text(expLines, margin, y);
  y += (expLines.length * 5) + 12;

  // Technical Expertise
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TECHNICAL EXPERTISE", margin, y);
  y += 6;

  portfolio.technicalExpertise.forEach(exp => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const categoryText = `${cleanForPdf(exp.category)}:`;
    
    doc.setFont("helvetica", "normal");
    const skills = cleanForPdf(exp.skills.join(", "));
    const skillLines = doc.splitTextToSize(skills, contentWidth - 40); // indent skills
    
    // Check if both category and skills fit, otherwise move to next page
    const blockHeight = (skillLines.length * 5) + 2;
    if (y + blockHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    doc.setFont("helvetica", "bold");
    doc.text(categoryText, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(skillLines, margin + 35, y);
    y += blockHeight;
  });
  y += 8;

  // Career Goals
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("CAREER GOALS & STRATEGIC OBJECTIVES", margin, y);
  y += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const cleanGoals = cleanForPdf(portfolio.careerGoals.replace(/[#*`]/g, ''));
  const goalLines = doc.splitTextToSize(cleanGoals, contentWidth);

  if (y + (goalLines.length * 5) > pageHeight - margin) {
    doc.addPage();
    y = margin;
  }

  doc.text(goalLines, margin, y);
  y += (goalLines.length * 5) + 12;

  // Project Highlights & Evidence
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("PROJECT HIGHLIGHTS & TECHNICAL EVIDENCE", margin, y);
  y += 8;

  portfolio.projectHighlights.forEach(project => {
    if (y > pageHeight - 40) {
      doc.addPage();
      y = margin;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(dark);
    doc.text(cleanForPdf(project.name) + (project.isPrivate ? " (Private Repository)" : ""), margin, y);
    y += 5;

    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(gray);
    doc.text(`Stack: ${cleanForPdf(project.techStack.join(", "))}`, margin, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(dark);
    const cleanEvidence = cleanForPdf(project.evidence.replace(/[#*`]/g, ''));
    const evidenceLines = doc.splitTextToSize(cleanEvidence, contentWidth);

    // Check if evidence fits
    if (y + (evidenceLines.length * 5) > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    doc.text(evidenceLines, margin, y);
    y += (evidenceLines.length * 5) + 10;
  });

  // Top Strategic Matches
  if (y > pageHeight - 60) {
    doc.addPage();
    y = margin;
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TOP STRATEGIC COMPANY MATCHES", margin, y);
  y += 10;

  matches.slice(0, 3).forEach((match) => {
    // Check space for match block (approx 50-60 units?)
    if (y > pageHeight - 50) {
      doc.addPage();
      y = margin;
    }

    doc.setFillColor(248, 250, 252); // Slate-50
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.rect(margin - 2, y - 5, contentWidth + 4, 30, 'FD'); // Fill and Draw

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(6, 182, 212);
    doc.text(`${cleanForPdf(match.name)}`, margin + 2, y + 2);

    doc.setTextColor(dark);
    doc.setFontSize(10);
    doc.text(`${match.matchScore.toFixed(2)}% Match`, margin + 2, y + 7);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const reasonText = match.matchReason || match.description || "Strong match based on portfolio analysis.";
    const cleanReason = cleanForPdf(reasonText.replace(/[#*`]/g, '')).replace(/\n/g, ' ');
    const reasonLines = doc.splitTextToSize(cleanReason, contentWidth);

    // Recalculate rect height based on text
    const blockHeight = (reasonLines.length * 5) + 25; // Increased buffer
    
    // Check if redrawn rect fits on current page, if not, move to next page
    if (y + blockHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    doc.setFillColor(248, 250, 252); // Slate-50
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.rect(margin - 2, y - 5, contentWidth + 4, blockHeight, 'FD'); // Redraw rect correct size

    // Redraw title over rect
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(6, 182, 212);
    doc.text(`${cleanForPdf(match.name)}`, margin + 2, y + 2);

    doc.setTextColor(dark);
    doc.setFontSize(10);
    doc.text(`${match.matchScore.toFixed(2)}% Match`, margin + 2, y + 7);

    doc.setTextColor(gray);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(reasonLines, margin + 2, y + 14);

    y += blockHeight + 10;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Generated by Basely.Connect | Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: "center" });
  }

  doc.save(`${cleanForPdf(portfolio.name).replace(/\s+/g, '_')}_Strategic_Portfolio.pdf`);
}
