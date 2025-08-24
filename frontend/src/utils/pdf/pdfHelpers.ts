import jsPDF from 'jspdf';
import { HOSTEL_CONFIG, COLORS, MARGINS } from './pdfStyles';
import { SummaryData } from '../types/exportTypes';

// Add watermark to PDF
export const addWatermark = (doc: jsPDF) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Save current state
  doc.saveGraphicsState();
  
  // Set watermark properties with proper opacity
  const gState = new (doc as any).GState({ opacity: 0.1 });
  doc.setGState(gState);
  doc.setTextColor(...COLORS.ELITE_BLUE);
  doc.setFontSize(60);
  doc.setFont('helvetica', 'bold');
  
  // Rotate and center the watermark
  const centerX = pageWidth / 2;
  const centerY = pageHeight / 2;
  
  doc.text('ELITE HOSTEL', centerX, centerY, {
    align: 'center',
    angle: 45
  });
  
  // Restore state
  doc.restoreGraphicsState();
};

// Enhanced PDF Header with modern design
export const addPDFHeader = (doc: jsPDF, title: string): number => {
  const pageWidth = doc.internal.pageSize.width;
  
  // Add watermark first
  addWatermark(doc);
  
  // Gradient background effect (simulated with multiple rectangles)
  const gradientSteps = 20;
  for (let i = 0; i < gradientSteps; i++) {
    const blue = Math.floor(30 + (i / gradientSteps) * 40);
    doc.setFillColor(blue, 64 + i, 175 + i * 0.5);
    doc.rect(0, i * 2, pageWidth, 2, 'F');
  }
  
  // Main header background
  doc.setFillColor(...COLORS.ELITE_BLUE);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // Decorative border
  doc.setFillColor(...COLORS.GOLD_ACCENT);
  doc.rect(0, 47, pageWidth, 3, 'F');
  
  // Elite Hostel logo placeholder (circular)
  doc.setFillColor(...COLORS.WHITE);
  doc.circle(30, 25, 12, 'F');
  doc.setFillColor(...COLORS.ELITE_BLUE);
  doc.circle(30, 25, 10, 'F');
  
  // Logo text
  doc.setTextColor(...COLORS.WHITE);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('EH', 30, 28, { align: 'center' });
  
  // Hostel name with enhanced typography
  doc.setTextColor(...COLORS.WHITE);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(HOSTEL_CONFIG.name, 50, 20);
  
  // Tagline
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(HOSTEL_CONFIG.tagline, 50, 28);
  
  // Document title with modern styling
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 50, 38);
  
  // Contact info section (right aligned with icons)
  const rightX = pageWidth - 15;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  // Phone with icon
  doc.text('📞 ' + HOSTEL_CONFIG.phone, rightX, 15, { align: 'right' });
  // Email with icon
  doc.text('✉️ ' + HOSTEL_CONFIG.email, rightX, 23, { align: 'right' });
  // Website with icon
  doc.text('🌐 ' + HOSTEL_CONFIG.website, rightX, 31, { align: 'right' });
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  return 65; // Return Y position for content start
};

// Enhanced PDF Footer with modern design
export const addPDFFooter = (doc: jsPDF) => {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  
  // Footer background
  doc.setFillColor(...COLORS.LIGHT_GRAY);
  doc.rect(0, pageHeight - 25, pageWidth, 25, 'F');
  
  // Decorative line
  doc.setFillColor(...COLORS.ELITE_BLUE);
  doc.rect(0, pageHeight - 25, pageWidth, 2, 'F');
  
  // Footer content
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.DARK_GRAY);
  doc.setFont('helvetica', 'normal');
  
  // Left side - Generation info
  const generatedText = `Generated on ${new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })} at ${new Date().toLocaleTimeString()}`;
  doc.text(generatedText, 15, pageHeight - 15);
  
  // Center - Elite Hostel branding
  doc.setFont('helvetica', 'bold');
  doc.text(`© ${new Date().getFullYear()} ${HOSTEL_CONFIG.name} - Confidential Document`, pageWidth / 2, pageHeight - 15, { align: 'center' });
  
  // Right side - Page number
  doc.setFont('helvetica', 'normal');
  const pageNum = (doc as any).internal.getCurrentPageInfo().pageNumber;
  doc.text(`Page ${pageNum}`, pageWidth - 15, pageHeight - 15, { align: 'right' });
  
  // Security notice
  doc.setFontSize(6);
  doc.setTextColor(156, 163, 175);
  doc.text('This document contains confidential information. Unauthorized distribution is prohibited.', pageWidth / 2, pageHeight - 8, { align: 'center' });
};

// Enhanced summary section with visual elements
export const addSummarySection = (doc: jsPDF, startY: number, summaryData: SummaryData): number => {
  const pageWidth = doc.internal.pageSize.width;
  
  // Summary section background
  doc.setFillColor(...COLORS.LIGHT_GRAY);
  doc.roundedRect(15, startY, pageWidth - 30, 60, 5, 5, 'F');
  
  // Summary section border
  doc.setDrawColor(...COLORS.ELITE_BLUE);
  doc.setLineWidth(1);
  doc.roundedRect(15, startY, pageWidth - 30, 60, 5, 5, 'S');
  
  // Summary title with icon
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.ELITE_BLUE);
  doc.text('📊 Summary Statistics', 25, startY + 15);
  
  // Summary content in cards
  const cardWidth = (pageWidth - 60) / 3;
  let cardX = 25;
  
  Object.entries(summaryData).forEach(([key, value], index) => {
    if (index < 6) { // Limit to 6 items
      const cardY = startY + 25 + Math.floor(index / 3) * 20;
      const currentCardX = cardX + (index % 3) * (cardWidth + 10);
      
      // Card background
      doc.setFillColor(...COLORS.WHITE);
      doc.roundedRect(currentCardX, cardY, cardWidth - 5, 15, 2, 2, 'F');
      
      // Card content
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 85, 99);
      doc.text(key, currentCardX + 3, cardY + 6);
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.ELITE_BLUE);
      doc.text(String(value), currentCardX + 3, cardY + 12);
    }
  });
  
  return startY + 70;
};
