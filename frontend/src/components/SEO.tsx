// function SEO() in SEO.tsx
import React from 'react';
import { Helmet } from 'react-helmet-async';

type SEOProps = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article' | 'profile' | 'product';
  noindex?: boolean;
  children?: React.ReactNode;
};

const getSiteUrl = () => {
  const fromEnv = import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }
  return '';
};

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  path,
  image,
  type = 'website',
  noindex = false,
  children
}) => {
  const brand = (import.meta.env.VITE_PUBLIC_BUSINESS_NAME as string) || 'Elite Hostel';
  const siteUrl = getSiteUrl();

  const normalizedPath =
    path?.startsWith('/') ? path : path ? `/${path}` : (typeof window !== 'undefined' ? window.location.pathname : '/');
  const url = `${siteUrl}${normalizedPath}`;

  const fullTitle = title ? `${title} | ${brand}` : brand;

  // Normalize image to absolute URL if provided
  const normalizedImage = image
    ? (image.startsWith('http://') || image.startsWith('https://'))
      ? image
      : `${siteUrl}${image.startsWith('/') ? image : `/${image}`}`
    : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <meta name="robots" content={noindex ? 'noindex,nofollow' : 'index,follow'} />
      {siteUrl && <link rel="canonical" href={url} />}

      {/* Open Graph (general social preview; platform-agnostic) */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={brand} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {siteUrl && <meta property="og:url" content={url} />}
      {normalizedImage && <meta property="og:image" content={normalizedImage} />}
      {children}
    </Helmet>
  );
};

export default SEO;