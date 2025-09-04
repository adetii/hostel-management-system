import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import { Student, Booking, Room } from '@/types';
import { Booking as SliceBooking } from '@/store/slices/bookingSlice';
import { Room as RoomType } from '@/types/room';
import api from '@/api/config';
import { addPDFHeader, addPDFFooter, addSummarySection } from '@/utils/pdf/pdfHelpers';
import { current } from '@reduxjs/toolkit';
export interface StudentWithNumber extends Student {
  serialNumber?: number;
}

// Helper: safe booking property extraction across types
const getBookingProperty = (booking: Booking | SliceBooking, prop: string): any => {
  if ('User' in booking) {
    const b = booking as SliceBooking;
    switch (prop) {
      case 'studentName':
        return b.User?.full_name || 'N/A';
      case 'roomNumber':
        return b.Room?.roomNumber || b.roomId || 'N/A';
      case 'roomType':
        return b.Room?.roomType || b.Room?.type || 'N/A';
      case 'bookingDate':
        return b.bookingDate;
      default:
        return (b as any)[prop] || 'N/A';
    }
  } else {
    const b = booking as Booking;
    switch (prop) {
      case 'studentName':
        return b.studentId?.full_name || 'N/A';
      case 'roomNumber':
        return b.roomId?.roomNumber || b.roomId || 'N/A';
      case 'roomType':
        return b.roomId?.roomType || b.Room?.type || 'N/A';
      case 'bookingDate':
        return b.bookingDate;
      default:
        return (b as any)[prop] || 'N/A';
    }
  }
};

// Module: exportUtils helpers and functions
// Helper: download a PDF blob returned by the server
function downloadPdfBlob(data: Blob, fallbackFilename: string, contentDisposition?: string | null) {
  let filename = fallbackFilename;
  if (contentDisposition) {
    const match = /filename="?([^"]+)"?/i.exec(contentDisposition);
    if (match && match[1]) {
      filename = match[1];
    }
  }
  const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

// Add: ensure we really received a PDF; if not, surface server error
async function handlePdfResponse(res: any, fallbackFilename: string) {
  const contentType: string | undefined = res?.headers?.['content-type'];
  if (!contentType || !contentType.includes('application/pdf')) {
    try {
      // Try to read error JSON from blob
      const text = await new Response(res?.data).text();
      const asJson = JSON.parse(text);
      throw new Error(asJson?.message || 'Server returned a non-PDF response');
    } catch (e: any) {
      throw new Error(e?.message || 'Server returned a non-PDF response');
    }
  }
  downloadPdfBlob(res.data, fallbackFilename, res.headers?.['content-disposition']);
}

// ========== PDF: Server-side (Students) ==========
export const exportStudentsToPDF = async (
  students: StudentWithNumber[],
  title: string = 'Students Report'
) => {
  const toastId = toast.loading('Downloading student profile...');
  try {
    const res = await api.post(
      '/export/students/pdf',
      { title, students },
      { responseType: 'blob', headers: { Accept: 'application/pdf' } }
    );
    await handlePdfResponse(res, 'Students_Report.pdf');
    toast.success('Student profile downloaded', { id: toastId });
  } catch (error: any) {
    console.error('Export students PDF failed:', error);
    toast.error(error?.message || error?.response?.data?.message || 'Failed to generate students PDF', { id: toastId });
  }
};

// ========== PDF: Server-side (Bookings) ==========
export const exportBookingsToPDF = async (
  bookings: (Booking | SliceBooking)[],
  title: string = 'Bookings Report'
) => {
  const toastId = toast.loading('Downloading student booking...');
  try {
    // Normalize bookings into a detailed payload for the server
    const detailed = bookings.map((b: any) => {
      const studentName =
        b?.User?.full_name || b?.user?.full_name || b?.studentName || 'N/A';

      const roomNumber =
        b?.Room?.roomNumber ||
        b?.room?.roomNumber ||
        b?.roomNumber ||
        (b?.roomId && typeof b.roomId === 'object' ? b.roomId.roomNumber : undefined) ||
        'N/A';

      const roomType = 
        b?.Room?.roomType ||
        b?.Room?.type ||
        b?.room?.roomType ||
        b?.room?.type ||
        b?.roomType ||
        (b?.roomId && typeof b.roomId === 'object' ? (b.roomId.roomType || b.roomId.type) : undefined) ||
        'N/A';

      const bookingDate = b?.bookingDate || b?.startDate || null;
      const academicYear = b?.academicYear || 'N/A';
      const semester = (b?.semester ?? 'N/A');
      const status = b?.status || 'N/A';

      return {
        studentName,
        roomNumber,
        roomType,
        bookingDate,    // send raw; server formats date
        academicYear,
        semester,
        status,
      };
    });

    const res = await api.post(
      '/export/bookings/pdf',
      { title, bookings: detailed },
      { responseType: 'blob', headers: { Accept: 'application/pdf' } }
    );
    await handlePdfResponse(res, 'Bookings_Report.pdf');
    toast.success('Download successful!', { id: toastId });
  } catch (error: any) {
    console.error('Export bookings PDF failed:', error);
    toast.error(error?.message || error?.response?.data?.message || 'Failed to generate bookings PDF', { id: toastId });
  }
};

// ========== PDF: Server-side (Individual Student) ==========
export const exportIndividualStudentToPDF = async (
  student: Student,
  bookings?: (Booking | SliceBooking)[]
) => {
  const toastId = toast.loading('Downloading student profile...');
  try {
    const res = await api.post(
      '/export/student/pdf',
      { student, bookings: bookings || [] },
      { responseType: 'blob', headers: { Accept: 'application/pdf' } }
    );
    const fallback = `Student_Profile_${(student.full_name || 'Profile').replace(/\s+/g, '_')}.pdf`;
    await handlePdfResponse(res, fallback);
    toast.success('Download successful!', { id: toastId });
  } catch (error: any) {
    console.error('Export student profile PDF failed:', error);
    toast.error(error?.message || error?.response?.data?.message || 'Failed to generate student profile PDF', { id: toastId });
  }
}


// ========== Excel Exports ==========
export const exportStudentsToExcel = (students: StudentWithNumber[], filename: string = 'General_Student_Report') => {
  try {
    const workbook = XLSX.utils.book_new();
    const studentsData = students.map((s) => ({
      Name: s.full_name,
      Email: s.email,
      Gender: s.gender,
      Phone: s.phoneNumber,
      Programme: s.programmeOfStudy,
      Level: s.level,
      GuardainName: s.guardianName,
      GuardianPhone: s.guardianPhoneNumber,
      Status: s.isActive ? 'Active' : 'Inactive',
    }));
    const sheet = XLSX.utils.json_to_sheet(studentsData);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Students');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (error) {
    console.error('Export students Excel failed:', error);
    toast.error('Failed to generate students Excel');
  }
};

export const exportBookingsToExcel = (bookings: (Booking | SliceBooking)[], filename: string = 'General_Booking_Report') => {
  try {
    const workbook = XLSX.utils.book_new();
    const bookingsData = bookings.map((b) => {
      // Get booking date and format it properly
      const bookingDate = getBookingProperty(b, 'bookingDate');
      const formattedDate = bookingDate ? new Date(bookingDate).toLocaleDateString() : 'N/A';
      
      return {
        Student: getBookingProperty(b, 'studentName'),
        Room: getBookingProperty(b, 'roomNumber'), // Changed from 'roomId' to 'roomNumber'
        AcademicYear: getBookingProperty(b, 'academicYear'),
        Semester: String(getBookingProperty(b, 'semester') || ''),
        RoomType: getBookingProperty(b, 'roomType'), // Now properly handled in getBookingProperty
        BookingDate: formattedDate, // Fixed: added parentheses and proper date handling
        Status: getBookingProperty(b, 'status')
      };
    });
    const sheet = XLSX.utils.json_to_sheet(bookingsData);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Bookings');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (error) {
    console.error('Export bookings Excel failed:', error);
    toast.error('Failed to generate bookings Excel');
  }
};

export const exportRoomsToExcel = (rooms: (Room | RoomType)[], filename: string = 'Rooms_Report') => {
  try {
    const workbook = XLSX.utils.book_new();
    const roomsData = rooms.map((r: any) => ({
      RoomNumber: r.roomNumber ?? r.Room?.roomNumber ?? 'N/A',
      Type: r.roomType ?? r.type ?? 'N/A',
      Capacity: r.capacity ?? 'N/A',
      CurrentOccupancy: r.currentOccupancy ?? r.occupancy ?? 'N/A',
      Status: ('isAvailable' in r ? (r.isAvailable ? 'Available' : 'Occupied') : ('status' in r ? r.status : 'N/A')),
    }));
    const sheet = XLSX.utils.json_to_sheet(roomsData);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Rooms');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (error) {
    console.error('Export rooms Excel failed:', error);
    toast.error('Failed to generate rooms Excel');
  }
};