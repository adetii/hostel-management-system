import { COLORS } from './pdfStyles';
import { addPDFFooter } from './pdfHelpers';
import jsPDF from 'jspdf';

// Base table options for consistent styling
export const BASE_TABLE_OPTIONS = {
  styles: {
    fontSize: 8,
    cellPadding: 4,
    lineColor: COLORS.BORDER_GRAY,
    lineWidth: 0.5,
  },
  headStyles: {
    fillColor: COLORS.ELITE_BLUE,
    textColor: COLORS.WHITE,
    fontStyle: 'bold',
    fontSize: 9,
    cellPadding: 5,
  },
  alternateRowStyles: {
    fillColor: COLORS.LIGHT_GRAY,
  },
  didDrawPage: function(data: any, doc: jsPDF) {
    addPDFFooter(doc);
  }
};

// Status coloring hook for tables
export const getStatusColor = (status: string): [number, number, number] => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'available':
      return COLORS.SUCCESS_GREEN;
    case 'inactive':
    case 'cancelled':
    case 'maintenance':
      return COLORS.ERROR_RED;
    default:
      return COLORS.DARK_GRAY;
  }
};
