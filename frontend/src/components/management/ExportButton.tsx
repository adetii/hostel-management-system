import React from 'react';
import { 
  exportStudentsToPDF, 
  exportBookingsToPDF, 
  exportRoomsToPDF,
  exportStudentsToExcel,
  exportBookingsToExcel,
  exportRoomsToExcel
} from '../utils/exportUtils';

interface ExportButtonProps {
  data: any[];
  type: 'students' | 'bookings' | 'rooms';
  title?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({ data, type, title }) => {
  const handlePDFExport = async () => {
    switch (type) {
      case 'students':
        await exportStudentsToPDF(data, title);
        break;
      case 'bookings':
        await exportBookingsToPDF(data, title);
        break;
      case 'rooms':
        await exportRoomsToPDF(data, title);
        break;
    }
  };

  const handleExcelExport = () => {
    switch (type) {
      case 'students':
        exportStudentsToExcel(data);
        break;
      case 'bookings':
        exportBookingsToExcel(data);
        break;
      case 'rooms':
        exportRoomsToExcel(data);
        break;
    }
  };

  return (
    <div className="flex space-x-2">
      <button
        onClick={handlePDFExport}
        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
      >
        <span>📄</span><span>PDF</span>
      </button>
      <button
        onClick={handleExcelExport}
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
      >
        <span>📊</span><span>Excel</span>
      </button>
    </div>
  );
};

export default ExportButton;
