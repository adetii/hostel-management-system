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
  website: 'www.elitehostel.edu.gh'
};

// Base HTML template with Tailwind CSS
// Updated base template with improved print styles and header removal
const getBaseTemplate = (title: string, content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        @media print {
            body { 
                margin: 0; 
                padding: 0;
            }
            .no-print { display: none; }
            .print-break { page-break-before: always; }
            .print-avoid-break { page-break-inside: avoid; }
            .footer-bottom {
                position: relative;
                width: 100%;
                background: white;
                border-top: none !important;
                margin-top: 20px; /* Small margin instead of auto */
            }
            @page {
                margin: 1cm;
                size: A4;
                @top-left { content: ""; }
                @top-center { content: ""; }
                @top-right { content: ""; }
                @bottom-left { content: ""; }
                @bottom-center { content: ""; }
                @bottom-right { content: ""; }
            }
        }
        .overflow-x-auto {
            overflow-x: visible !important;
        }
        table {
            table-layout: fixed;
            width: 100%;
        }
        td, th {
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        @media screen {
            .footer-bottom {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: white;
                border-top: 1px solid #e5e7eb;
                z-index: 1000;
            }
            .main-content {
                padding-bottom: 100px;
            }
        }
    </style>
</head>
<body class="bg-gray-50 font-sans">
    <div class="max-w-full mx-auto bg-white shadow-lg print:shadow-none">
        ${content}
    </div>
    
    <!-- Export Scripts -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
    <script>
        function exportToPDF() {
            window.print();
        }
        
        function exportToExcel() {
            const table = document.querySelector('table');
            if (table) {
                const wb = XLSX.utils.table_to_book(table);
                XLSX.writeFile(wb, '${title.replace(/\s+/g, '_')}.xlsx');
            }
        }
    </script>
</body>
</html>
`;

// Header component (without date/time)
const getHeaderHTML = (title: string, subtitle?: string) => `
<div class="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 print:bg-blue-600">
    <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
            <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span class="text-blue-600 font-bold text-lg">EH</span>
            </div>
            <div>
                <h1 class="text-2xl font-bold">${HOSTEL_CONFIG.name}</h1>
                <p class="text-blue-100 text-sm">${HOSTEL_CONFIG.tagline}</p>
            </div>
        </div>
        <div class="text-right text-sm">
            <p class="flex items-center justify-end space-x-1">
                <span>📞</span><span>${HOSTEL_CONFIG.phone}</span>
            </p>
            <p class="flex items-center justify-end space-x-1">
                <span>✉️</span><span>${HOSTEL_CONFIG.email}</span>
            </p>
            <p class="flex items-center justify-end space-x-1">
                <span>🌐</span><span>${HOSTEL_CONFIG.website}</span>
            </p>
        </div>
    </div>
    <div class="mt-4 border-t border-blue-400 pt-4">
        <h2 class="text-xl font-semibold">${title}</h2>
        ${subtitle ? `<p class="text-blue-100">${subtitle}</p>` : ''}
    </div>
</div>
`;

// Summary cards component
const getSummaryHTML = (summaryData: Record<string, string | number>) => {
    const cards = Object.entries(summaryData).map(([key, value]) => `
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div class="text-center">
                <p class="text-2xl font-bold text-blue-600">${value}</p>
                <p class="text-sm text-gray-600 mt-1">${key}</p>
            </div>
        </div>
    `).join('');
    
    return `
    <div class="p-6 bg-gray-50">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            ${cards}
        </div>
    </div>
    `;
};

// Students table component with improved status display
const getStudentsTableHTML = (students: StudentWithNumber[]) => {
    const rows = students.map((student, index) => `
        <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
            <td class="px-3 py-3 text-sm text-center border border-gray-300" style="width: 8%;">${index + 1}</td>
            <td class="px-3 py-3 text-sm font-medium border border-gray-300" style="width: 25%;">${student.full_name}</td>
            <td class="px-3 py-3 text-sm border border-gray-300" style="width: 25%;">${student.email}</td>
            <td class="px-3 py-3 text-sm border border-gray-300" style="width: 20%;">${student.gender}</td>
            <td class="px-3 py-3 text-sm border border-gray-300" style="width: 15%;">${student.programmeOfStudy}</td>
            <td class="px-3 py-3 text-sm text-center border border-gray-300" style="width: 7%;">${student.level}</td>
            <td class="px-3 py-3 text-sm text-center border border-gray-300" style="width: 12%;">
                <span class="inline-flex px-2 py-1 text-xs font-semibold ${
                    student.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }">
                    ${student.isActive ? 'Active' : 'Inactive'}
                </span>
            </td>
        </tr>
    `).join('');
    
    return `
    <div class="p-6">
        <div class="overflow-visible">
            <table id="studentsTable" class="w-full border-collapse border border-gray-300">
                <thead>
                    <tr class="bg-blue-600 text-white">
                        <th class="border border-gray-300 px-3 py-3 text-left text-sm font-semibold" style="width: 8%;">#</th>
                        <th class="border border-gray-300 px-3 py-3 text-left text-sm font-semibold" style="width: 25%;">Full Name</th>
                        <th class="border border-gray-300 px-3 py-3 text-left text-sm font-semibold" style="width: 25%;">Email</th>
                        <th class="border border-gray-300 px-3 py-3 text-left text-sm font-semibold" style="width: 20%;">Gender</th>
                        <th class="border border-gray-300 px-3 py-3 text-left text-sm font-semibold" style="width: 15%;">Programme</th>
                        <th class="border border-gray-300 px-3 py-3 text-left text-sm font-semibold" style="width: 7%;">Level</th>
                        <th class="border border-gray-300 px-3 py-3 text-left text-sm font-semibold" style="width: 12%;">Status</th>
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

// Updated footer component - only appears on last page
const getFooterHTML = () => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    const formattedTime = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
    });
    
    return `
    <div class="footer-last-page p-4 bg-white border-t text-sm">
        <div class="flex justify-between items-center">
            <div class="text-left">
                <p class="text-gray-600">Printed on ${formattedDate} at ${formattedTime}</p>
            </div>
            <div class="text-center flex-1">
                <p class="text-gray-800 font-medium mb-1">© 2025 Elite Hostel Management System</p>
                <p class="text-gray-600">This document contains confidential information. Unauthorized distribution is prohibited.</p>
            </div>
            <div class="w-1/3"></div>
        </div>
    </div>
    `;
};

// Export buttons component
const getExportButtonsHTML = () => `
<div class="p-6 bg-gray-50 no-print border-t">
    <div class="flex space-x-4 justify-center">
        <button onclick="exportToPDF()" class="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2">
            <span>📄</span><span>Export to PDF</span>
        </button>
        <button onclick="exportToExcel()" class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
            <span>📊</span><span>Export to Excel</span>
        </button>
    </div>
</div>
`;

// Students HTML generation
export const generateStudentsHTML = (students: StudentWithNumber[], title: string = 'Students Report') => {
    const summaryData = {
        'Total Students': students.length,
        'Active Students': students.filter(s => s.isActive).length,
        'Inactive Students': students.filter(s => !s.isActive).length,
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

// Helper function to safely get booking properties
const getBookingProperty = (booking: Booking | SliceBooking, property: string): any => {
    switch (property) {
        case 'studentName':
            return (booking as SliceBooking).User?.full_name || 'N/A';
        case 'roomDetails':
            const room = (booking as SliceBooking).Room;
            return room ? `Room ${room.roomNumber} (Capacity: ${room.capacity})` : 'N/A';
        case 'bookingDate':
            return booking.bookingDate;
        case 'status':
            return booking.status || 'active';
        default:
            return 'N/A';
    }
};

// Helper function to safely get room properties
const getRoomProperty = (room: Room | RoomType, property: string): any => {
    switch (property) {
        case 'isAvailable':
            return (room as any).isAvailable !== undefined ? (room as any).isAvailable : room.status === 'available';
        case 'roomType':
            return (room as any).roomType || (room as any).type || 'N/A';
        default:
            return (room as any)[property] || 'N/A';
    }
};

// Updated bookings HTML generation with correct fields
export const generateBookingsHTML = (bookings: (Booking | SliceBooking)[], title: string = 'Bookings Report') => {
    const summaryData = {
        'Total Bookings': bookings.length,
        'Active Bookings': bookings.filter(b => getBookingProperty(b, 'status') === 'active').length,
        'Pending Bookings': bookings.filter(b => getBookingProperty(b, 'status') === 'pending').length,
        'Report Date': new Date().toLocaleDateString()
    };
    
    const rows = bookings.map((booking, index) => {
        const studentName = getBookingProperty(booking, 'studentName');
        const roomDetails = getBookingProperty(booking, 'roomDetails');
        const bookingDate = getBookingProperty(booking, 'bookingDate');
        const status = getBookingProperty(booking, 'status');
        
        return `
        <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
            <td class="px-4 py-3 text-sm text-center border border-gray-300">${index + 1}</td>
            <td class="px-4 py-3 text-sm border border-gray-300">${studentName}</td>
            <td class="px-4 py-3 text-sm border border-gray-300">${roomDetails}</td>
            <td class="px-4 py-3 text-sm border border-gray-300">${bookingDate ? new Date(bookingDate).toLocaleDateString() : 'N/A'}</td>
            <td class="px-4 py-3 text-sm text-center border border-gray-300">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    status === 'active' || status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                    status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                }">
                    ${status}
                </span>
            </td>
        </tr>
        `;
    }).join('');
    
    const tableHTML = `
    <div class="p-6">
        <div class="overflow-visible">
            <table id="bookingsTable" class="w-full border-collapse border border-gray-300">
                <thead>
                    <tr class="bg-blue-600 text-white">
                        <th class="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">#</th>
                        <th class="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">Student</th>
                        <th class="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">Room Details</th>
                        <th class="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">Booking Date</th>
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
    
    return getBaseTemplate(title, content);
};

// Updated rooms HTML generation (removed price per semester)
export const generateRoomsHTML = (rooms: (Room | RoomType)[], title: string = 'Rooms Report') => {
    const summaryData = {
        'Total Rooms': rooms.length,
        'Available Rooms': rooms.filter(r => getRoomProperty(r, 'isAvailable')).length,
        'Occupied Rooms': rooms.filter(r => !getRoomProperty(r, 'isAvailable')).length,
        'Report Date': new Date().toLocaleDateString()
    };
    
    const rows = rooms.map((room, index) => {
        const roomType = getRoomProperty(room, 'roomType');
        const isAvailable = getRoomProperty(room, 'isAvailable');
        
        return `
        <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
            <td class="px-4 py-3 text-sm text-center border border-gray-300">${index + 1}</td>
            <td class="px-4 py-3 text-sm font-medium border border-gray-300">${room.roomNumber}</td>
            <td class="px-4 py-3 text-sm border border-gray-300">${roomType}</td>
            <td class="px-4 py-3 text-sm text-center border border-gray-300">${room.capacity}</td>
            <td class="px-4 py-3 text-sm text-center border border-gray-300">
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
        <div class="overflow-visible">
            <table id="roomsTable" class="w-full border-collapse border border-gray-300">
                <thead>
                    <tr class="bg-blue-600 text-white">
                        <th class="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">#</th>
                        <th class="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">Room Number</th>
                        <th class="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">Room Type</th>
                        <th class="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">Capacity</th>
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
    
    return getBaseTemplate(title, content);
};

// Individual student profile HTML generation with improved layout and footer positioning
export const generateIndividualStudentHTML = (student: Student, title?: string) => {
    const reportTitle = title || `Student Profile - ${student.full_name}`;
    
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    const formattedTime = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
    });
    
    const content = `
        ${getHeaderHTML('Student Profile', HOSTEL_CONFIG.tagline)}
        
        <div class="p-8"> <!-- Removed pb-32 padding -->
            <!-- Student Profile Card with Enhanced Layout -->
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 mb-8 border border-blue-200 shadow-sm">
                <div class="flex items-start space-x-8">
                    <!-- Profile Avatar -->
                    <div class="flex-shrink-0">
                        <div class="w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                            <span class="text-white font-bold text-3xl">${student.full_name.charAt(0).toUpperCase()}</span>
                        </div>
                    </div>
                    
                    <!-- Student Information -->
                    <div class="flex-1">
                        <div class="mb-6">
                            <h2 class="text-4xl font-bold text-gray-900 mb-2">${student.full_name}</h2>
                            <div class="flex items-center space-x-4">
                                <span class="inline-flex px-4 py-2 text-sm font-semibold rounded-full ${
                                    student.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }">
                                    ${student.isActive ? 'Active Student' : 'Inactive Student'}
                                </span>
                                <span class="text-gray-500 text-sm">Level ${student.level}</span>
                            </div>
                        </div>
                        
                        <!-- Student Details Grid -->
                        <div class="grid grid-cols-2 gap-8">
                            <div class="space-y-4">
                                <div class="bg-white rounded-lg p-4 border border-gray-200">
                                    <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Email Address</p>
                                    <p class="text-gray-900 font-medium text-lg">${student.email}</p>
                                </div>
                                <div class="bg-white rounded-lg p-4 border border-gray-200">
                                    <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone Number</p>
                                    <p class="text-gray-900 font-medium text-lg">${student.phoneNumber}</p>
                                </div>
                                <div class="bg-white rounded-lg p-4 border border-gray-200">
                                    <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Gender</p>
                                    <p class="text-gray-900 font-medium text-lg capitalize">${student.gender}</p>
                                </div>
                            </div>
                            
                            <div class="space-y-4">
                                <div class="bg-white rounded-lg p-4 border border-gray-200">
                                    <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Programme of Study</p>
                                    <p class="text-gray-900 font-medium text-lg">${student.programmeOfStudy}</p>
                                </div>
                                <div class="bg-white rounded-lg p-4 border border-gray-200">
                                    <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Academic Level</p>
                                    <p class="text-gray-900 font-medium text-lg">${student.level}</p>
                                </div>
                                <div class="bg-white rounded-lg p-4 border border-gray-200">
                                    <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Student ID</p>
                                    <p class="text-gray-900 font-medium text-lg">${student.id || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Guardian Information Section -->
            <div class="bg-gray-50 rounded-xl p-8 border border-gray-200">
                <h3 class="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                    <span class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span class="text-blue-600 text-lg">👤</span>
                    </span>
                    Guardian Information
                </h3>
                <div class="grid grid-cols-2 gap-8">
                    <div class="bg-white rounded-lg p-6 border border-gray-200">
                        <p class="text-xs text-gray-500 uppercase tracking-wide mb-2">Guardian Name</p>
                        <p class="text-gray-900 font-medium text-xl">${student.guardianName}</p>
                    </div>
                    <div class="bg-white rounded-lg p-6 border border-gray-200">
                        <p class="text-xs text-gray-500 uppercase tracking-wide mb-2">Guardian Phone</p>
                        <p class="text-gray-900 font-medium text-xl">${student.guardianPhoneNumber}</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Footer positioned right after content -->
        <div class="footer-bottom p-4 bg-white print:border-t-0 border-t border-gray-200">
            <div class="max-w-full mx-auto">
                <div class="flex justify-between items-center text-sm">
                    <div class="text-left">
                        <p class="text-gray-600">Printed on ${formattedDate} at ${formattedTime}</p>
                    </div>
                    <div class="text-center flex-1">
                        <p class="text-gray-800 font-medium mb-1">© 2025 Elite Hostel Management System</p>
                        <p class="text-gray-600">This document contains confidential information. Unauthorized distribution is prohibited.</p>
                    </div>
                    <div class="w-1/3"></div>
                </div>
            </div>
        </div>
        
        ${getExportButtonsHTML()}
    `;
    
    return getBaseTemplate(reportTitle, content);
};
