// PDF styling constants and configurations

// Color palette for Elite Hostel branding
export const COLORS = {
  ELITE_BLUE: [41, 128, 185] as [number, number, number],
  GOLD_ACCENT: [241, 196, 15] as [number, number, number],
  WHITE: [255, 255, 255] as [number, number, number],
  LIGHT_GRAY: [248, 249, 250] as [number, number, number],
  DARK_GRAY: [52, 58, 64] as [number, number, number],
  SUCCESS_GREEN: [40, 167, 69] as [number, number, number],
  WARNING_ORANGE: [255, 193, 7] as [number, number, number],
  DANGER_RED: [220, 53, 69] as [number, number, number],
  INFO_BLUE: [23, 162, 184] as [number, number, number],
  BORDER_GRAY: [206, 212, 218] as [number, number, number],
  ERROR_RED: [220, 53, 69] as [number, number, number]
};

// Layout margins and spacing
export const MARGINS = {
  TOP: 60,
  BOTTOM: 30,
  LEFT: 20,
  RIGHT: 20
};

// Hostel configuration for branding
export const HOSTEL_CONFIG = {
  name: 'Elite Hostel',
  tagline: 'Excellence in Student Accommodation',
  address: '123 University Avenue, Academic District',
  city: 'Education City, State 12345',
  phone: '+1 (555) 123-4567',
  email: 'info@elitehostel.com',
  website: 'www.elitehostel.com'
};

// Font configurations
export const FONTS = {
  HEADER: {
    family: 'helvetica',
    style: 'bold',
    size: 24
  },
  SUBHEADER: {
    family: 'helvetica',
    style: 'bold',
    size: 16
  },
  BODY: {
    family: 'helvetica',
    style: 'normal',
    size: 10
  },
  SMALL: {
    family: 'helvetica',
    style: 'normal',
    size: 8
  }
};

// Table styling configurations
export const TABLE_STYLES = {
  headerStyles: {
    fillColor: COLORS.ELITE_BLUE,
    textColor: COLORS.WHITE,
    fontStyle: 'bold',
    fontSize: 10,
    halign: 'center' as const
  },
  bodyStyles: {
    fontSize: 9,
    cellPadding: 4,
    lineColor: COLORS.LIGHT_GRAY,
    lineWidth: 0.5
  },
  alternateRowStyles: {
    fillColor: [250, 250, 250] as [number, number, number]
  }
};

// Status color mappings
export const STATUS_COLORS = {
  active: COLORS.SUCCESS_GREEN,
  inactive: COLORS.ERROR_RED,
  pending: COLORS.WARNING_ORANGE,
  confirmed: COLORS.SUCCESS_GREEN,
  cancelled: COLORS.ERROR_RED,
  available: COLORS.SUCCESS_GREEN,
  occupied: COLORS.INFO_BLUE,
  maintenance: COLORS.WARNING_ORANGE
};
