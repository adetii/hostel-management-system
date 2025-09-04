
// ======================================================
// Server-side PDF generation using @react-pdf/renderer
// ======================================================

// Top-of-file imports
const {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  renderToBuffer,
  Image
} = require('@react-pdf/renderer');

// Styles block: center the header and add watermark/footer styles
const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 16, borderBottom: 1, paddingBottom: 8, alignItems: 'center', textAlign: 'center' },
  title: { fontSize: 16, marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#555' },
  table: { display: 'table', width: 'auto', marginTop: 12 },
  tableRow: { flexDirection: 'row', borderBottom: 1, borderColor: '#ddd' },
  th: { padding: 6, fontSize: 10, fontWeight: 'bold' },
  td: { padding: 6, fontSize: 10 },
  columns: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  col: { width: '48%', marginBottom: 4 },
  label: { fontSize: 9, color: '#555' },
  value: { fontSize: 10, marginTop: 2 },
  sectionTitle: { fontSize: 12, marginTop: 12, marginBottom: 6, fontWeight: 'bold' },
});
// Add vertical card styles without changing the original object shape
// Styles extensions
styles.bookingCard = { borderWidth: 1, borderStyle: 'solid', borderColor: '#ddd', borderRadius: 4, padding: 8, marginTop: 8 };
styles.divider = { height: 1, backgroundColor: '#eee', marginTop: 6, marginBottom: 6 };
// Watermark + footer (grayscale)
styles.watermarkContainer = {
  position: 'absolute',
  top: 0, left: 0, right: 0, bottom: 0,
  justifyContent: 'center',
  alignItems: 'center',
  pointerEvents: 'none'
};
styles.watermarkContent = {
  transform: 'rotate(-45deg)', // diagonal bottom-left -> top-right
  opacity: 0.06
};
styles.watermarkText = { fontSize: 64, color: '#000', textAlign: 'center' };
styles.footer = { position: 'absolute', left: 24, right: 24, bottom: 16, textAlign: 'center' };
styles.footerText = { fontSize: 9, color: '#000' };
styles.orgName = { fontSize: 14, fontWeight: 'bold', marginBottom: 2, textAlign: 'center', color: '#000' };
styles.footer = { position: 'absolute', left: 24, right: 24, bottom: 16, textAlign: 'center' };
styles.footerText = { fontSize: 9, color: '#000' };
// Helpers/components
const React = require('react');
const h = React.createElement;

// Generic diagonal watermark (logo if provided, else text)
function Watermark({ branding = {} }) {
  const wm = branding?.watermark || {};
  const enabled = wm.enabled !== false; // default: enabled
  if (!enabled) return null;

  const orgName = branding?.organizationName || 'Elite Hostel';
  const text = wm.text || orgName.toUpperCase();
  const logoUrl = wm.logoUrl || branding?.logoUrl;

  return h(
    View,
    { style: styles.watermarkContainer },
    logoUrl
      ? h(Image, { src: logoUrl, style: [styles.watermarkContent, { width: 260, height: 260 }] })
      : h(Text, { style: [styles.watermarkText, styles.watermarkContent] }, text)
  );
}

// Centered header: Organization + title + generated timestamp
function PdfHeader({ title = '', branding = {} }) {
  const orgName = branding?.organizationName || 'Elite Hostel';
  return h(
    View,
    { style: styles.header },
    h(Text, { style: styles.orgName }, orgName),
    h(Text, { style: styles.title }, title || '')
  );
}

// Fixed footer: website | support email | Page X of Y | Generated on {date}
function Watermark({ branding = {} }) {
  const wm = branding?.watermark || {};
  const enabled = wm.enabled !== false;
  if (!enabled) return null;

  const orgName = branding?.organizationName || 'Elite Hostel';
  const text = wm.text || orgName.toUpperCase();
  const logoUrl = wm.logoUrl || branding?.logoUrl;

  return h(
    View,
    { style: styles.watermarkContainer },
    logoUrl
      ? h(Image, { src: logoUrl, style: [styles.watermarkContent, { width: 260, height: 260 }] })
      : h(Text, { style: [styles.watermarkText, styles.watermarkContent] }, text)
  );
}

function PdfFooter({ branding = {} }) {
  return h(
    View,
    { style: styles.footer },
    h(Text, {
      style: styles.footerText,
      render: ({ pageNumber, totalPages }) => {
        const parts = [];
        if (branding.website) parts.push(branding.website);
        if (branding.supportEmail) parts.push(branding.supportEmail);
        parts.push(`Page ${pageNumber} of ${totalPages}`);
        parts.push(`Generated on ${nowString()}`);
        const year = new Date().getFullYear();
        const org = branding.organizationName || 'Elite Hostel';
        const footerLine = parts.join(' | ');
        const copyright = `© ${org} ${year}. All rights reserved.`;
        return `${footerLine}\n${copyright}`;
      }
    })
  );
}

// Students list document
// Students document: inject header, watermark, footer, and accept branding
function StudentsDocument({ title, students = [], branding = {} }) {
  return h(
    Document,
    null,
    h(
      Page,
      { size: 'A4', style: styles.page },
      h(Watermark, { branding }),
      h(PdfHeader, { title: title || 'Students Report', branding }),
      h(
        View,
        { style: styles.header },
        h(Text, { style: styles.title }, title || 'Students Report'),
        h(Text, { style: styles.subtitle }, `Generated at ${nowString()}`)
      ),
      h(
        View,
        { style: styles.table },
        h(
          View,
          { style: styles.tableRow },
          h(Text, { style: [styles.th, { width: '6%' }] }, '#'),
          h(Text, { style: [styles.th, { width: '20%' }] }, 'Full Name'),
          h(Text, { style: [styles.th, { width: '22%' }] }, 'Email'),
          h(Text, { style: [styles.th, { width: '10%' }] }, 'Gender'),
          h(Text, { style: [styles.th, { width: '18%' }] }, 'Programme'),
          h(Text, { style: [styles.th, { width: '8%' }] }, 'Level'),
          h(Text, { style: [styles.th, { width: '16%' }] }, 'Phone')
        ),
        ...students.map((s, idx) =>
          h(
            View,
            { style: styles.tableRow },
            h(Text, { style: [styles.td, { width: '6%' }] }, String(s.serialNumber ?? idx + 1)),
            h(Text, { style: [styles.td, { width: '20%' }] }, s.full_name || ''),
            h(Text, { style: [styles.td, { width: '22%' }] }, s.email || ''),
            h(Text, { style: [styles.td, { width: '10%' }] }, s.gender || ''),
            h(Text, { style: [styles.td, { width: '18%' }] }, s.programmeOfStudy || ''),
            h(Text, { style: [styles.td, { width: '8%' }] }, String(s.level || '')),
            h(Text, { style: [styles.td, { width: '16%' }] }, s.phoneNumber || '')
          )
        )
      )
    )
  );
}

// Single student + bookings
// Student profile: inject header, watermark, footer, and accept branding
function StudentProfileDocument({ student, bookings = [], branding = {} }) {
  return h(
    Document,
    null,
    h(
      Page,
      { size: 'A4', style: styles.page },
      h(Watermark, { branding }),
      h(
        View,
        { style: styles.header },
        h(Text, { style: styles.title }, 'Elite Hostel Student Profile')
      ),
      h(Text, { style: styles.sectionTitle }, 'Student Details'),
      h(
        View,
        { style: styles.columns },
        h(
          View,
          { style: styles.col },
          h(Text, { style: styles.label }, 'Full Name'),
          h(Text, { style: styles.value }, student?.full_name || '')
        ),
        h(
          View,
          { style: styles.col },
          h(Text, { style: styles.label }, 'Email'),
          h(Text, { style: styles.value }, student?.email || '')
        ),
        h(
          View,
          { style: styles.col },
          h(Text, { style: styles.label }, 'Gender'),
          h(Text, { style: styles.value }, student?.gender || '')
        ),
        h(
          View,
          { style: styles.col },
          h(Text, { style: styles.label }, 'Phone Number'),
          h(Text, { style: styles.value }, student?.phoneNumber || '')
        ),
        h(
          View,
          { style: styles.col },
          h(Text, { style: styles.label }, 'Programme'),
          h(Text, { style: styles.value }, student?.programmeOfStudy || '')
        ),
        h(
          View,
          { style: styles.col },
          h(Text, { style: styles.label }, 'Level'),
          h(Text, { style: styles.value }, String(student?.level || ''))
        ),
        h(
          View,
          { style: styles.col },
          h(Text, { style: styles.label }, 'Guardian Name'),
          h(Text, { style: styles.value }, student?.guardianName || '')
        ),
        h(
          View,
          { style: styles.col },
          h(Text, { style: styles.label }, 'Guardian Phone'),
          h(Text, { style: styles.value }, student?.guardianPhoneNumber || '')
        )
      ),
      h(Text, { style: styles.sectionTitle }, 'Booking Info'),
      h(
        View,
        { style: styles.table },
        h(
          View,
          { style: styles.tableRow },
          h(Text, { style: [styles.th, { width: '10%' }] }, '#'),
          h(Text, { style: [styles.th, { width: '25%' }] }, 'Room Number'),
          h(Text, { style: [styles.th, { width: '25%' }] }, 'Room Type'),
          h(Text, { style: [styles.th, { width: '30%' }] }, 'Booking Date')
        ),
        ...bookings.map((b, idx) =>
          h(
            View,
            { style: styles.tableRow },
            h(Text, { style: [styles.td, { width: '10%' }] }, String(idx + 1)),
            h(
              Text,
              { style: [styles.td, { width: '25%' }] },
              b?.Room?.roomNumber || b?.roomId?.roomNumber || b?.roomId || 'N/A'
            ),
            h(
              Text,
              { style: [styles.td, { width: '25%' }] },
              b?.Room?.roomType || b?.roomId?.roomType || b?.roomId?.type || 'N/A'
            ),
            h(
              Text,
              { style: [styles.td, { width: '30%' }] },
              b?.bookingDate ? new Date(b.bookingDate).toLocaleDateString() : 'N/A'
            )
          )
        )
      ),
      h(PdfFooter, { branding })
    )
  );
}


// Updated BookingsDocument function with proper header, watermark, and footer
function BookingsDocument({ title, bookings = [], branding = {} }) {
  return h(
    Document,
    null,
    h(
      Page,
      { size: 'A4', style: styles.page },
      h(Watermark, { branding }),
      h(PdfHeader, { title: title || 'Bookings Report', branding }),
      h(Text, { style: styles.sectionTitle }, 'Student Booking Details'),

      ...bookings.map((b, idx) => {
        const studentName =
          b.studentName ||
          b?.User?.full_name ||
          b?.user?.full_name ||
          'N/A';

        const roomNumber =
          b.roomNumber ||
          b?.Room?.roomNumber ||
          b?.room?.roomNumber ||
          (b?.roomId && typeof b.roomId === 'object' ? b.roomId.roomNumber : undefined) ||
          'N/A';

        const roomType =
          b.roomType ||
          b?.Room?.roomType ||
          b?.Room?.type ||
          (b?.roomId && typeof b.roomId === 'object' ? (b.roomId.roomType || b.roomId.type) : undefined) ||
          'N/A';

        const bookingDateRaw = b.bookingDate || b.startDate || null;
        const bookingDate = bookingDateRaw
          ? new Date(bookingDateRaw).toLocaleDateString()
          : 'N/A';

        const academicYear = b.academicYear || 'N/A';
        const semester = b.semester ?? 'N/A';
        const status = b.status || 'N/A';

        return h(
          View,
          { key: `bk-${idx}`, style: { marginTop: 10 } },
          h(
            View,
            { style: styles.columns },
            h(
              View,
              { style: styles.col },
              h(Text, { style: styles.label }, 'Student Full Name'),
              h(Text, { style: styles.value }, studentName)
            ),
            h(
              View,
              { style: styles.col },
              h(Text, { style: styles.label }, 'Room Number'),
              h(Text, { style: styles.value }, String(roomNumber))
            ),
            h(
              View,
              { style: styles.col },
              h(Text, { style: styles.label }, 'Room Type'),
              h(Text, { style: styles.value }, String(roomType))
            ),
            h(
              View,
              { style: styles.col },
              h(Text, { style: styles.label }, 'Booking Date'),
              h(Text, { style: styles.value }, bookingDate)
            ),
            h(
              View,
              { style: styles.col },
              h(Text, { style: styles.label }, 'Academic Year'),
              h(Text, { style: styles.value }, String(academicYear))
            ),
            h(
              View,
              { style: styles.col },
              h(Text, { style: styles.label }, 'Semester'),
              h(Text, { style: styles.value }, String(semester))
            ),
            h(
              View,
              { style: styles.col },
              h(Text, { style: styles.label }, 'Status'),
              h(Text, { style: styles.value }, String(status))
            )
          )
        );
      }),
      h(PdfFooter, { branding })
    )
  );
}

// In exportController.js (helper function)
// streamPdf helper
// Function: streamPdf
async function streamPdf(res, element, filename = 'export.pdf') {
  try {
    let buffer;

    if (typeof renderToBuffer === 'function') {
      // Preferred API in newer versions
      buffer = await renderToBuffer(element);
    } else {
      // Fallback for older versions: callback-style toBuffer
      const instance = pdf(element);
      buffer = await new Promise((resolve, reject) => {
        try {
          instance.toBuffer((data) => {
            if (!data || !Buffer.isBuffer(data)) {
              return reject(new Error('Failed to render PDF buffer'));
            }
            resolve(data);
          });
        } catch (e) {
          reject(e);
        }
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).end(buffer);
  } catch (err) {
    console.error('streamPdf error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Failed to generate PDF' });
    }
    res.end();
  }
}

// Pass branding through controller endpoints
exports.exportStudentsPdf = async (req, res) => {
  try {
    const { title = 'Students Report', students = [], branding = {} } = req.body || {};
    const element = React.createElement(StudentsDocument, { title, students, branding });
    await streamPdf(res, element, 'students.pdf');
  } catch (error) {
    console.error('exportStudentsPdf error:', error);
    res.status(500).json({ message: 'Failed to export students PDF' });
  }
};

// In exportController.js, inside exports.exportSingleStudentPdf
exports.exportSingleStudentPdf = async (req, res) => {
  try {
    const { title = 'Student Profile', student = null, bookings = [], branding = {} } = req.body || {};
    const element = React.createElement(StudentProfileDocument, { title, student, bookings, branding });
    await streamPdf(res, element, 'student.pdf');
  } catch (error) {
    console.error('exportSingleStudentPdf error:', error);
    res.status(500).json({ message: 'Failed to export student PDF' });
  }
};

// In exportController.js, inside exports.exportBookingsPdf
// Pass branding through controller endpoints
exports.exportBookingsPdf = async (req, res) => {
  try {
    const { title = 'Bookings Report', bookings = [], branding = {} } = req.body || {};
    const element = React.createElement(BookingsDocument, { title, bookings, branding });
    await streamPdf(res, element, 'bookings.pdf');
  } catch (error) {
    console.error('exportBookingsPdf error:', error);
    res.status(500).json({ message: 'Failed to export bookings PDF' });
  }
};

function nowString() {
  const d = new Date();
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
}

function filenameFromTitle(title) {
  const safeTitle = String(title || 'Report').replace(/\s+/g, '_');
  const ts = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  return `${safeTitle}_${ts}.pdf`;
}