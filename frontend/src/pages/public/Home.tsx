import SEO from '../../components/SEO';
import React from 'react';
const Hero = React.lazy(() => import('@/components/public/home/Hero'));
const Stats = React.lazy(() => import('@/components/public/home/Stats'));
const Amenities = React.lazy(() => import('@/components/public/home/Amenities'));
const Testimonials = React.lazy(() => import('@/components/public/home/Testimonials'));
const CTA = React.lazy(() => import('@/components/public/home/CTA'));
import { Helmet } from 'react-helmet-async';

function Home() {
  const siteUrl = import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin;
  const businessName = import.meta.env.VITE_PUBLIC_BUSINESS_NAME || 'Hostel';
  const ogImage = (import.meta.env.VITE_PUBLIC_OG_IMAGE as string) || `${siteUrl}/apple-touch-icon.png`;
  const title = `${businessName} | Affordable Student Hostel`;
  const description = 'Comfortable, secure, and affordable student accommodation with modern amenities. Book your room today.';

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: businessName,
    url: siteUrl,
    image: ogImage,
  };

  return (
    <>
      <Helmet>
        {/* Speed up hero image fetch */}
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        {/* Preload the first hero image in multiple sizes */}
        <link
          rel="preload"
          as="image"
          href="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1280&q=70"
          imagesrcset="
            https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=640&q=70 640w,
            https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1280&q=70 1280w,
            https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=70 1920w"
          imagesizes="(max-width: 640px) 640px, (max-width: 1280px) 1280px, 1920px"
          fetchpriority="high"
        />
      </Helmet>
      <SEO
        title="Comfortable Student Accommodation in Koforidua"
        description="Elite Hostel offers secure, comfortable, and convenient student accommodation near Koforidua Technical University. Explore rooms, amenities, and student-friendly services."
        path="/"
        image={ogImage}
      />
      {/* Keep JSON-LD only. Canonical/OG/Twitter handled by <SEO /> */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(orgJsonLd)}
        </script>
      </Helmet>

      <React.Suspense fallback={
        <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      }>
        <Hero />
        <Stats />
        <Amenities />
        <Testimonials />
        <CTA />
      </React.Suspense>
    </>
  );
};

export default Home;