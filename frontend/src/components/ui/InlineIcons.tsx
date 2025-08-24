import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement> & { className?: string };

export const ArrowUpIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="1em" height="1em" {...props}>
    <path d="M12 4l-7 7h4v7h6v-7h4z" />
  </svg>
);

export const UsersIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="1em" height="1em" {...props}>
    <path d="M16 11c1.66 0 3-1.57 3-3.5S17.66 4 16 4s-3 1.57-3 3.5S14.34 11 16 11zM8 11c1.66 0 3-1.57 3-3.5S9.66 4 8 4 5 5.57 5 7.5 6.34 11 8 11zM8 13c-2.67 0-8 1.34-8 4v2h8v-2c0-.7.18-1.36.5-1.95C7.4 13.73 6 13 8 13zm8 0c.88 0 1.67.09 2.36.24C17.51 13.74 16 14.5 16 16v3h8v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
);

export const BedIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="1em" height="1em" {...props}>
    <path d="M21 10H3V6H1v12h2v-4h18v4h2v-7a3 3 0 0 0-2-1zM5 8h6v2H5V8z" />
  </svg>
);

export const ShieldIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="1em" height="1em" {...props}>
    <path d="M12 2l8 4v6c0 5-3.5 9.74-8 10-4.5-.26-8-5-8-10V6l8-4z" />
  </svg>
);

export const GraduationCapIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="1em" height="1em" {...props}>
    <path d="M12 3l10 5-10 5L2 8l10-5zm0 12l6-3v4c0 2.21-2.69 4-6 4s-6-1.79-6-4v-4l6 3z" />
  </svg>
);

export const EyeIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="1em" height="1em" {...props}>
    <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/>
  </svg>
);

export const WifiIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="1em" height="1em" {...props}>
    <path d="M12 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-6.5-3.5l1.42 1.42A7 7 0 0 1 12 14a7 7 0 0 1 5.08 2.1l1.42-1.42A9 9 0 0 0 12 12a9 9 0 0 0-6.5 2.5zM3 11l1.41 1.41A12 12 0 0 1 12 9c3.31 0 6.31 1.34 8.49 3.51L22 11C19.33 8.34 15.88 7 12 7S4.67 8.34 3 11z"/>
  </svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="1em" height="1em" {...props}>
    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
  </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="1em" height="1em" {...props}>
    <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
  </svg>
);

export const CloseIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="1em" height="1em" {...props}>
    <path d="M18.3 5.71L12 12l6.3 6.29-1.41 1.42L10.59 13.41 4.29 19.71 2.88 18.3 9.17 12 2.88 5.71 4.29 4.3 10.59 10.59 16.89 4.29z"/>
  </svg>
);

export const StarIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="1em" height="1em" {...props}>
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z"/>
  </svg>
);

export const MapMarkerIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="1em" height="1em" {...props}>
    <path d="M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/>
  </svg>
);

export const HeartIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="1em" height="1em" {...props}>
    <path d="M12 21s-8-5.33-8-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 4.67-8 10-8 10z"/>
  </svg>
);