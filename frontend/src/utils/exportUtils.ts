import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { toast } from 'react-hot-toast';
import { Student, Booking, Room } from '@/types';
import { Booking as SliceBooking } from '@/store/slices/bookingSlice';
import { Room as RoomType } from '@/types/room';

// Extended Student interface with numbering
interface StudentWithNumber extends Student {
  serialNumber?: number;
}

// Hostel configuration
const HOSTEL_CONFIG = {
  name: 'Elite Hostel Management System',
  tagline: 'Excellence in Student Accommodation',
  address: 'University Campus, Academic City',
  phone: '+233 XX XXX XXXX',
  email: 'info@elitehostel.edu.gh',
  website: 'www.elitehostel.edu.gh',
  primaryColor: '#1e40af',
  secondaryColor: '#059669',
  accentColor: '#f59e0b'
};

// Base HTML template with normal CSS
const getBaseTemplate = (title: string, content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f9fafb;
            color: #111827;
            line-height: 1.6;
        }
        
        .container {
            max-width: 100%;
            margin: 0 auto;
            background: white;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(to right, #2563eb, #1e40af);
            color: white;
            padding: 24px;
        }
        
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header-left {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        
        .logo {
            width: 48px;
            height: 48px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 18px;
            color: #2563eb;
        }
        
        .header-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 4px;
        }
        
        .header-subtitle {
            color: #bfdbfe;
            font-size: 14px;
        }
        
        .header-contact {
            text-align: right;
            font-size: 14px;
        }
        
        .header-contact p {
            margin-bottom: 4px;
        }
        
        .header-divider {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #60a5fa;
        }
        
        .page-title {
            font-size: 20px;
            font-weight: 600;
        }
        
        .summary-section {
            padding: 24px;
            background: #f9fafb;
        }
        
        .summary-title {
            font-size: 18px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
        }
        
        .summary-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .summary-label {
            color: #6b7280;
            font-size: 14px;
            font-weight: 500;
        }
        
        .summary-value {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-top: 4px;
        }
        
        .table-section {
            padding: 24px;
        }
        
        .table-container {
            overflow-x: auto;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #d1d5db;
        }
        
        th {
            background: #2563eb;
            color: white;
            padding: 12px 16px;
            text-align: left;
            font-size: 14px;
            font-weight: 600;
            border: 1px solid #d1d5db;
        }
        
        td {
            padding: 12px 16px;
            font-size: 14px;
            border: 1px solid #d1d5db;
        }
        
        tr:nth-child(even) {
            background: #f9fafb;
        }
        
        tr:hover {
            background: #eff6ff;
        }
        
        .status-badge {
            padding: 4px 8px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
        }
        
        .status-active {
            background: #dcfce7;
            color: #166534;
        }
        
        .status-inactive {
            background: #fef2f2;
            color: #991b1b;
        }
        
        .status-available {
            background: #dcfce7;
            color: #166534;
        }
        
        .status-occupied {
            background: #fef2f2;
            color: #991b1b;
        }
        
        .gender-male {
            background: #dbeafe;
            color: #1e40af;
        }
        
        .gender-female {
            background: #fce7f3;
            color: #be185d;
        }
        
        .footer {
            background: #f3f4f6;
            padding: 16px;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
        }
        
        .footer-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .footer-copyright {
            font-weight: 600;
        }
        
        .footer-disclaimer {
            font-size: 12px;
            color: #9ca3af;
            margin-top: 8px;
        }
        
        .export-buttons {
            padding: 24px;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
            text-align: center;
        }
        
        .button-group {
            display: flex;
            gap: 16px;
            justify-content: center;
        }
        
        .export-btn {
            padding: 8px 24px;
            border-radius: 8px;
            border: none;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: background-color 0.2s;
        }
        
        .btn-pdf {
            background: #dc2626;
            color: white;
        }
        
        .btn-pdf:hover {
            background: #b91c1c;
        }
        
        .btn-excel {
            background: #16a34a;
            color: white;
        }
        
        .btn-excel:hover {
            background: #15803d;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 0;
                background: white;
            }
            
            .container {
                box-shadow: none;
            }
            
            .export-buttons {
                display: none;
            }
            
            tr:hover {
                background: transparent;
            }
            
            @page {
                margin: 1cm;
                size: A4;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        ${content}
    </div>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
    <script>
        function exportToPDF() {
            window.print();
        }
        
        function exportToExcel() {
            const table = document.querySelector('table');
            if (table) {
                const wb = XLSX.utils.table_to_book(table);
                XLSX.writeFile(wb, '${title.replace(/\\s+/g, '_')}.xlsx');
            }
        }
    </script>
</body>
</html>
`;

// Header component
const getHeaderHTML = (title: string, subtitle?: string) => `
<div class="header">
    <div class="header-content">
        <div class="header-left">
            <div class="logo">EH</div>
            <div>
                <div class="header-title">${HOSTEL_CONFIG.name}</div>
                <div class="header-subtitle">${HOSTEL_CONFIG.tagline}</div>
            </div>
        </div>
        <div class="header-contact">
            <p>📞 ${HOSTEL_CONFIG.phone}</p>
            <p>✉️ ${HOSTEL_CONFIG.email}</p>
            <p>🌐 ${HOSTEL_CONFIG.website}</p>
        </div>
    </div>
    <div class="header-divider">
        <div class="page-title">${title}</div>
        ${subtitle ? `<div class="header-subtitle">${subtitle}</div>` : ''}
    </div>
</div>
`;

// Summary cards component
const getSummaryHTML = (summaryData: Record<string, string | number>) => {
    const cards = Object.entries(summaryData).map(([key, value]) => `
        <div class="summary-card">
            <div class="summary-label">${key}</div>
            <div class="summary-value">${value}</div>
        </div>
    `).join('');
    
    return `
    <div class="summary-section">
        <div class="summary-title">
            <span style="margin-right: 8px;">📊</span>Summary Statistics
        </div>
        <div class="summary-grid">
            ${cards}
        </div>
    </div>
    `;
};

// Students table component
const getStudentsTableHTML = (students: StudentWithNumber[]) => {
    const rows = students.map((student, index) => `
        <tr>
            <td style="text-align: center;">${student.serialNumber || index + 1}</td>
            <td style="font-weight: 500;">${student.full_name}</td>
            <td>${student.email}</td>
            <td style="text-align: center;">
                <span class="status-badge ${student.gender === 'male' ? 'gender-male' : 'gender-female'}">
                    ${student.gender}
                </span>
            </td>
            <td>${student.programmeOfStudy}</td>
            <td style="text-align: center;">${student.level}</td>
            <td>${student.phoneNumber}</td>
            <td style="text-align: center;">
                <span class="status-badge ${student.isActive ? 'status-active' : 'status-inactive'}">
                    ${student.isActive ? '✅ Active' : '❌ Inactive'}
                </span>
            </td>
        </tr>
    `).join('');
    
    return `
    <div class="table-section">
        <div class="table-container">
            <table id="studentsTable">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Full Name</th>
                        <th>Email</th>
                        <th>Gender</th>
                        <th>Programme</th>
                        <th>Level</th>
                        <th>Phone</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    </div>
    `;
};

// Footer component
const getFooterHTML = () => {
    const currentDate = new Date();
    return `
    <div class="footer">
        <div class="footer-content">
            <span>Generated on ${currentDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })} at ${currentDate.toLocaleTimeString()}</span>
            <span class="footer-copyright">© ${currentDate.getFullYear()} ${HOSTEL_CONFIG.name}</span>
            <span style="font-size: 12px;">Confidential Document</span>
        </div>
        <div class="footer-disclaimer">This document contains confidential information. Unauthorized distribution is prohibited.</div>
    </div>
    `;
};

// Export buttons component
const getExportButtonsHTML = () => `
<div class="export-buttons">
    <div class="button-group">
        <button onclick="exportToPDF()" class="export-btn btn-pdf">
            <span>📄</span><span>Export to PDF</span>
        </button>
        <button onclick="exportToExcel()" class="export-btn btn-excel">
            <span>📊</span><span>Export to Excel</span>
        </button>
    </div>
</div>
`;



// Enhanced PDF generation using HTML template + jsPDF
const generatePDFFromHTML = async (htmlContent: string, filename: string) => {
  // Create a temporary container
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.width = '210mm'; // A4 width
  document.body.appendChild(tempDiv);
  
  try {
    // Use html2canvas for high-quality PDF generation
    const canvas = await html2canvas(tempDiv, {
      useCORS: true,
      allowTaint: true,
      background: '#ffffff',
      logging: false,
      width: tempDiv.scrollWidth,
      height: tempDiv.scrollHeight
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Fallback: Create a simple text-based PDF using jsPDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.setFontSize(16);
    pdf.text('Report Generated', 20, 20);
    pdf.setFontSize(12);
    pdf.text('There was an error generating the full PDF.', 20, 40);
    pdf.text('Please try again or contact support.', 20, 50);
    pdf.save(filename);
  } finally {
    // Only remove if still attached (prevents NotFoundError in StrictMode)
    if (tempDiv.parentNode) {
      tempDiv.parentNode.removeChild(tempDiv);
    }
  }
};

// Main export functions
export const generateStudentsHTML = (students: StudentWithNumber[], title: string = 'Students Report') => {
    const summaryData = {
        'Total Students': students.length,
        'Active Students': students.filter(s => s.isActive).length,
        'Inactive Students': students.filter(s => !s.isActive).length,
        'Male Students': students.filter(s => s.gender === 'male').length,
        'Female Students': students.filter(s => s.gender === 'female').length,
        'Report Date': new Date().toLocaleDateString()
    };
    
    const content = `
        ${getHeaderHTML(title, `Total of ${students.length} students`)}
        ${getSummaryHTML(summaryData)}
        ${getStudentsTableHTML(students)}
        ${getFooterHTML()}
        ${getExportButtonsHTML()}
    `;
    
    return getBaseTemplate(title, content);
};

// Export Students with HTML Template
export const exportStudentsToPDF = async (students: StudentWithNumber[], title: string = 'Students Report') => {
  const htmlContent = generateStudentsHTML(students, title);
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `${HOSTEL_CONFIG.name}_${title.replace(/\\s+/g, '_')}_${timestamp}.pdf`;
  
  await generatePDFFromHTML(htmlContent, filename);
};



// Helper function to get booking property safely
const getBookingProperty = (booking: Booking | SliceBooking, prop: string): any => {
  // Handle different property naming conventions
  if ('User' in booking) {
    // SliceBooking format
    const sliceBooking = booking as SliceBooking;
    switch (prop) {
      case 'studentName':
        return sliceBooking.User?.full_name || 'N/A';
      case 'roomId':
        return sliceBooking.roomId || sliceBooking.Room?.roomNumber || 'N/A';
      case 'startDate':
        return sliceBooking.bookingDate || new Date().toISOString();
      case 'endDate':
        // Calculate end date (assuming 1 semester = 6 months)
        const startDate = new Date(sliceBooking.bookingDate);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 6);
        return endDate.toISOString();
      default:
        return (sliceBooking as any)[prop] || 'N/A';
    }
  } else {
    // Regular Booking format
    const regularBooking = booking as Booking;
    switch (prop) {
      case 'studentName':
        return 'N/A'; // Regular booking doesn't have student name directly
      case 'roomId':
        return regularBooking.roomId || 'N/A';
      case 'startDate':
        return regularBooking.bookingDate || new Date().toISOString();
      case 'endDate':
        // Calculate end date (assuming 1 semester = 6 months)
        const startDate = new Date(regularBooking.bookingDate);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 6);
        return endDate.toISOString();
      default:
        return (regularBooking as any)[prop] || 'N/A';
    }
  }
};

// Export Bookings with HTML Template
export const exportBookingsToPDF = async (bookings: (Booking | SliceBooking)[], title: string = 'Bookings Report') => {
  const summaryData = {
    'Total Bookings': bookings.length,
    'Active Bookings': bookings.filter(b => {
      const endDate = new Date(getBookingProperty(b, 'endDate'));
      return endDate > new Date();
    }).length,
    'Expired Bookings': bookings.filter(b => {
      const endDate = new Date(getBookingProperty(b, 'endDate'));
      return endDate <= new Date();
    }).length,
    'Report Date': new Date().toLocaleDateString()
  };
  
  const rows = bookings.map((booking, index) => {
    const studentName = getBookingProperty(booking, 'studentName');
    const roomId = getBookingProperty(booking, 'roomId');
    const startDate = new Date(getBookingProperty(booking, 'startDate')).toLocaleDateString();
    const endDate = new Date(getBookingProperty(booking, 'endDate')).toLocaleDateString();
    const isActive = new Date(getBookingProperty(booking, 'endDate')) > new Date();
    
    return `
        <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
            <td class="px-4 py-3 text-sm text-center">${index + 1}</td>
            <td class="px-4 py-3 text-sm">${studentName}</td>
            <td class="px-4 py-3 text-sm">${roomId}</td>
            <td class="px-4 py-3 text-sm">${startDate}</td>
            <td class="px-4 py-3 text-sm">${endDate}</td>
            <td class="px-4 py-3 text-sm text-center">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }">
                    ${isActive ? 'Active' : 'Expired'}
                </span>
            </td>
        </tr>
    `;
  }).join('');
  
  const tableHTML = `
  <div class="p-6">
      <div class="overflow-x-auto">
          <table id="bookingsTable" class="w-full border-collapse border border-gray-300">
              <thead>
                  <tr class="bg-blue-600 text-white">
                      <th class="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">#</th>
                      <th class="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">Student Name</th>
                      <th class="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">Room ID</th>
                      <th class="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">Start Date</th>
                      <th class="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">End Date</th>
                      <th class="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">Status</th>
                  </tr>
              </thead>
              <tbody>
                  ${rows}
              </tbody>
          </table>
      </div>
  </div>
  `;
  
  const content = `
      ${getHeaderHTML(title, `Total of ${bookings.length} bookings`)}
      ${getSummaryHTML(summaryData)}
      ${tableHTML}
      ${getFooterHTML()}
      ${getExportButtonsHTML()}
  `;
  
  const htmlContent = getBaseTemplate(title, content);
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `${HOSTEL_CONFIG.name}_${title.replace(/\\s+/g, '_')}_${timestamp}.pdf`;
  
  await generatePDFFromHTML(htmlContent, filename);
};

// Export Rooms with HTML Template
export const exportRoomsToPDF = async (rooms: (Room | RoomType)[], title: string = 'Rooms Report') => {
  const summaryData = {
    'Total Rooms': rooms.length,
    'Available Rooms': rooms.filter(r => {
      return ('isAvailable' in r && r.isAvailable) || ('status' in r && r.status === 'available');
    }).length,
    'Occupied Rooms': rooms.filter(r => {
      return ('isAvailable' in r && !r.isAvailable) || ('status' in r && r.status === 'occupied');
    }).length,
    'Report Date': new Date().toLocaleDateString()
  };
  
  const rows = rooms.map((room, index) => {
    const roomNumber = ('roomNumber' in room) ? room.roomNumber : 'N/A';
    const roomType = ('roomType' in room) ? room.roomType : ('type' in room) ? room.type : 'N/A';
    const capacity = room.capacity || 0;
    const price = ('pricePerSemester' in room) ? room.pricePerSemester : 'N/A';
    const isAvailable = ('isAvailable' in room) ? room.isAvailable : ('status' in room) ? room.status === 'available' : false;
    
    return `
        <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
            <td class="px-4 py-3 text-sm text-center">${index + 1}</td>
            <td class="px-4 py-3 text-sm font-medium">${roomNumber}</td>
            <td class="px-4 py-3 text-sm">${roomType}</td>
            <td class="px-4 py-3 text-sm text-center">${capacity}</td>
            <td class="px-4 py-3 text-sm">${price}</td>
            <td class="px-4 py-3 text-sm text-center">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }">
                    ${isAvailable ? 'Available' : 'Occupied'}
                </span>
            </td>
        </tr>
    `;
  }).join('');
  
  const tableHTML = `
  <div class="p-6">
      <div class="overflow-x-auto">
          <table id="roomsTable" class="w-full border-collapse border border-gray-300">
              <thead>
                  <tr class="bg-blue-600 text-white">
                      <th class="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">#</th>
                      <th class="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">Room Number</th>
                      <th class="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">Room Type</th>
                      <th class="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">Capacity</th>
                      <th class="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">Price/Semester</th>
                      <th class="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">Status</th>
                  </tr>
              </thead>
              <tbody>
                  ${rows}
              </tbody>
          </table>
      </div>
  </div>
  `;
  
  const content = `
      ${getHeaderHTML(title, `Total of ${rooms.length} rooms`)}
      ${getSummaryHTML(summaryData)}
      ${tableHTML}
      ${getFooterHTML()}
      ${getExportButtonsHTML()}
  `;
  
  const htmlContent = getBaseTemplate(title, content);
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `${HOSTEL_CONFIG.name}_${title.replace(/\\s+/g, '_')}_${timestamp}.pdf`;
  
  await generatePDFFromHTML(htmlContent, filename);
};

// Individual Student Profile with enhanced HTML
export const exportIndividualStudentToPDF = async (student: Student, bookings?: (Booking | SliceBooking)[]) => {
  const currentDate = new Date().toLocaleDateString();
  const studentBookings = bookings || [];
  
  const totalBookings = studentBookings.length;
  const activeBookings = studentBookings.filter(booking => {
    const endDate = new Date(getBookingProperty(booking, 'endDate'));
    return endDate > new Date();
  }).length;
  
  const profileHTML = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Student Profile - ${student.full_name}</title>
      <style>
          * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
          }
          
          body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f8fafc;
              color: #1e293b;
              line-height: 1.4;
              font-size: 12px;
          }
          
          .container {
              max-width: 210mm;
              margin: 0 auto;
              background: white;
              height: 297mm;
              overflow: hidden;
          }
          
          .header {
              background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%);
              color: white;
              padding: 16px;
              position: relative;
          }
          
          .header-content {
              display: flex;
              justify-content: space-between;
              align-items: center;
          }
          
          .header-left {
              display: flex;
              align-items: center;
              gap: 12px;
          }
          
          .logo {
              width: 40px;
              height: 40px;
              background: rgba(255, 255, 255, 0.95);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 16px;
              color: #1e40af;
          }
          
          .header-title {
              font-size: 18px;
              font-weight: 700;
              margin-bottom: 2px;
          }
          
          .header-subtitle {
              color: #bfdbfe;
              font-size: 12px;
          }
          
          .header-contact {
              text-align: right;
              font-size: 10px;
              background: rgba(255, 255, 255, 0.1);
              padding: 8px;
              border-radius: 8px;
          }
          
          .header-contact p {
              margin-bottom: 2px;
              display: flex;
              align-items: center;
              justify-content: flex-end;
              gap: 4px;
          }
          
          .student-profile {
              padding: 16px;
              height: calc(297mm - 120px);
              overflow: hidden;
          }
          
          .profile-card {
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              border-radius: 12px;
              padding: 16px;
              margin-bottom: 16px;
              border: 1px solid #e2e8f0;
          }
          
          .profile-header {
              display: flex;
              align-items: center;
              gap: 16px;
              margin-bottom: 16px;
          }

          .profile-info h2 {
              font-size: 20px;
              font-weight: 700;
              color: #1e293b;
              margin-bottom: 4px;
          }
          
          .student-id {
              background: #3b82f6;
              color: white;
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 10px;
              font-weight: 600;
              display: inline-block;
              margin-bottom: 8px;
          }
          
         
          
          .content-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              height: calc(100% - 120px);
          }
          
          .left-column {
              display: flex;
              flex-direction: column;
              gap: 12px;
          }
          
          .right-column {
              display: flex;
              flex-direction: column;
              gap: 12px;
          }
          
          .info-grid {
              display: grid;
              grid-template-columns: 1fr;
              gap: 8px;
          }
          
          .info-item {
              background: white;
              padding: 8px;
              border-radius: 6px;
              border-left: 3px solid #3b82f6;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          
          .info-label {
              color: #64748b;
              font-size: 9px;
              font-weight: 500;
              margin-bottom: 2px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
          }
          
          .info-value {
              font-size: 11px;
              font-weight: 600;
              color: #1e293b;
          }
          
          .section {
              background: white;
              border-radius: 8px;
              padding: 12px;
              border: 1px solid #e2e8f0;
              flex: 1;
              overflow: hidden;
          }
          
          .section-title {
              font-size: 14px;
              font-weight: 700;
              color: #1e293b;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
              gap: 6px;
          }
          
          .section-title::before {
              content: '';
              width: 3px;
              height: 14px;
              background: linear-gradient(135deg, #3b82f6, #06b6d4);
              border-radius: 2px;
          }
          

          
          .footer {
              background: #f1f5f9;
              padding: 8px 16px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
          }
          
          .footer-content {
            color: #64748b;
            font-size: 9px;
            font-weight: 700;
            margin-bottom: 2px;
          }

          
                  * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; line-height: 1.4; font-size: 12px; }
        .container { position: relative; max-width: 210mm; margin: 0 auto; background: white; height: 297mm; overflow: hidden; }
        /* ... other existing styles ... */
        .footer {
            background: #f1f5f9;
            padding: 8px 16px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            font-weight: 700;
            page-break-after: always;
        }
        @media print {
            body { margin: 0; padding: 0; background: white; }
            .container { box-shadow: none; max-width: none; height: 100vh; }
            @page { margin: 0.5cm; size: A4; }
        }
          }
      </style>
  </head>
  <body>
      <div class="container">
          <!-- Header -->
          <div class="header">
              <div class="header-content">
                  <div class="header-left">
                      <div class="logo">EH</div>
                      <div>
                          <div class="header-title">Student Profile</div>
                          <div class="header-subtitle">${HOSTEL_CONFIG.name}</div>
                      </div>
                  </div>
                  <div class="header-contact">
                      <p><span>📞</span> ${HOSTEL_CONFIG.phone}</p>
                      <p><span>✉️</span> ${HOSTEL_CONFIG.email}</p>
                      <p><span>🌐</span> ${HOSTEL_CONFIG.website}</p>
                  </div>
              </div>
          </div>
          
          <!-- Student Profile -->
         <div class="student-profile">
            <!-- Student Info Card -->
            <div class="profile-card">
                <div class="profile-header">
                <div class="profile-info">
                    <h2>Student Info</h2>
                </div>
                </div>
                <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Full Name</div>
                    <div class="info-value">${student.full_name}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Email</div>
                    <div class="info-value">${student.email}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Phone</div>
                    <div class="info-value">${student.phoneNumber}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Gender</div>
                    <div class="info-value">${student.gender}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Level</div>
                    <div class="info-value">${student.level}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Programme</div>
                    <div class="info-value">${student.programmeOfStudy}</div>
                </div>
                </div>
            </div>

            <!-- Guardian & Other Sections -->
            
            <div class="guardian-profile">
            <!-- Guardian Info Card -->
            <div class="profile-card">
                <div class="profile-header">
                <div class="profile-info">
                    <h2>Guardian Info</h2>
                </div>
                </div>
                <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Guadian Full Name</div>
                    <div class="info-value">${student.guardianName}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Guardian Phone Number</div>
                    <div class="info-value">${student.guardianPhoneNumber}</div>
                </div>
            </div>
        </div>
    
         <!-- Footer -->
        <div class="footer">
        <div class="footer-content">
            Generated on ${currentDate} | © ${new Date().getFullYear()} ${HOSTEL_CONFIG.name}
        </div>
        </div>

        </div>
      </div>
  </body>
  </html>
  `;
  
  const filename = `Student_Profile_${student.full_name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  await generatePDFFromHTML(profileHTML, filename);
};

// Excel export functions with enhanced styling
export const exportStudentsToExcel = (students: StudentWithNumber[], filename: string = 'Students_Report') => {
  const workbook = XLSX.utils.book_new();
  
  const studentsData = students.map((student, index) => {
    return {
      'Name': student.full_name,
      'Email': student.email,
      'Gender': student.gender,
      'Phone': student.phoneNumber,
      'Programme': student.programmeOfStudy,
      'Level': student.level,
      'Status': student.isActive ? 'Active' : 'Inactive'
    };
  });
  
  const studentsSheet = XLSX.utils.json_to_sheet(studentsData);
  
  // Apply yellow header styling and borders to students sheet
  const studentsRange = XLSX.utils.decode_range(studentsSheet['!ref'] || 'A1');
  for (let row = studentsRange.s.r; row <= studentsRange.e.r; row++) {
    for (let col = studentsRange.s.c; col <= studentsRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (!studentsSheet[cellAddress]) continue;
      
      // Header row styling (yellow background with thick borders)
      if (row === 0) {
        studentsSheet[cellAddress].s = {
          font: { bold: true, color: { rgb: '000000' } },
          fill: { fgColor: { rgb: 'FFFF00' } }, // Yellow background
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thick', color: { rgb: '000000' } },
            bottom: { style: 'thick', color: { rgb: '000000' } },
            left: { style: 'thick', color: { rgb: '000000' } },
            right: { style: 'thick', color: { rgb: '000000' } }
          }
        };
      } else {
        // Data cells styling (borders only)
        studentsSheet[cellAddress].s = {
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        };
      }
    }
  }
  
  XLSX.utils.book_append_sheet(workbook, studentsSheet, 'Students');
  
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  XLSX.writeFile(workbook, `${filename}_${timestamp}.xlsx`);
};

export const exportBookingsToExcel = (bookings: (Booking | SliceBooking)[], filename: string = 'Bookings_Report') => {
  const workbook = XLSX.utils.book_new();
  
  const bookingsData = bookings.map((booking, index) => {
    // Directly access the properties instead of using getBookingProperty with dot notation
    const studentName = (booking as any).User?.full_name || 'N/A';
    const roomNumber = (booking as any).Room?.roomNumber || 'N/A';
    const bookingDate = booking.bookingDate || 'N/A';
    
    return {
      'Student': studentName,
      'Room Number': roomNumber,
      'Booking Date': bookingDate !== 'N/A' ? new Date(bookingDate).toLocaleDateString() : 'N/A'
    };
  });
  
  const bookingsSheet = XLSX.utils.json_to_sheet(bookingsData);
  
  // Apply yellow header styling and borders to bookings sheet
  const bookingsRange = XLSX.utils.decode_range(bookingsSheet['!ref'] || 'A1');
  for (let row = bookingsRange.s.r; row <= bookingsRange.e.r; row++) {
    for (let col = bookingsRange.s.c; col <= bookingsRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (!bookingsSheet[cellAddress]) continue;
      
      // Header row styling (yellow background with thick borders)
      if (row === 0) {
        bookingsSheet[cellAddress].s = {
          font: { bold: true, color: { rgb: '000000' } },
          fill: { fgColor: { rgb: 'FFFF00' } }, // Yellow background
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thick', color: { rgb: '000000' } },
            bottom: { style: 'thick', color: { rgb: '000000' } },
            left: { style: 'thick', color: { rgb: '000000' } },
            right: { style: 'thick', color: { rgb: '000000' } }
          }
        };
      } else {
        // Data cells styling (borders only)
        bookingsSheet[cellAddress].s = {
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        };
      }
    }
  }
  
  XLSX.utils.book_append_sheet(workbook, bookingsSheet, 'Bookings');
  
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  XLSX.writeFile(workbook, `${filename}_${timestamp}.xlsx`);
};

export const exportRoomsToExcel = (rooms: (Room | RoomType)[], filename: string = 'Rooms_Report') => {
  const workbook = XLSX.utils.book_new();
  
  const roomsData = rooms.map((room, index) => {
    const roomNumber = ('roomNumber' in room) ? room.roomNumber : 'N/A';
    const roomType = ('roomType' in room) ? room.roomType : ('type' in room) ? room.type : 'N/A';
    const capacity = room.capacity || 0;
    const isAvailable = ('isAvailable' in room) ? room.isAvailable : ('status' in room) ? room.status === 'available' : false;
    
    return {
      'Room Number': roomNumber,
      'Room Type': roomType,
      'Capacity': capacity,
      'Status': isAvailable ? 'Available' : 'Occupied'
    };
  });
  
  const roomsSheet = XLSX.utils.json_to_sheet(roomsData);
  
  // Apply yellow header styling and borders to rooms sheet
  const roomsRange = XLSX.utils.decode_range(roomsSheet['!ref'] || 'A1');
  for (let row = roomsRange.s.r; row <= roomsRange.e.r; row++) {
    for (let col = roomsRange.s.c; col <= roomsRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (!roomsSheet[cellAddress]) continue;
      
      // Header row styling (yellow background with thick borders)
      if (row === 0) {
        roomsSheet[cellAddress].s = {
          font: { bold: true, color: { rgb: '000000' } },
          fill: { fgColor: { rgb: 'FFFF00' } }, // Yellow background
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thick', color: { rgb: '000000' } },
            bottom: { style: 'thick', color: { rgb: '000000' } },
            left: { style: 'thick', color: { rgb: '000000' } },
            right: { style: 'thick', color: { rgb: '000000' } }
          }
        };
      } else {
        // Data cells styling (borders only)
        roomsSheet[cellAddress].s = {
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        };
      }
    }
  }
  
  // Removed autofilter functionality
  
  XLSX.utils.book_append_sheet(workbook, roomsSheet, 'Rooms');
  
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  XLSX.writeFile(workbook, `${filename}_${timestamp}.xlsx`);
};
