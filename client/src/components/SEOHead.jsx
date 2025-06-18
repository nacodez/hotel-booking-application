import React from 'react'
import { Helmet } from 'react-helmet-async'

const SEOHead = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  noIndex = false,
  noFollow = false,
  canonicalUrl,
  alternateUrls = [],
  breadcrumbs = [],
  structuredData = null
}) => {
  // Get environment variables for site configuration
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://hotelbooking.com'
  const siteName = import.meta.env.VITE_APP_NAME || 'Hotel Booking System'
  const defaultDescription = import.meta.env.VITE_SITE_DESCRIPTION || 'Find and book your perfect hotel room with ease'
  const defaultKeywords = import.meta.env.VITE_SITE_KEYWORDS || 'hotel,booking,reservation,travel,accommodation'

  // Construct full URL
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl
  const fullCanonicalUrl = canonicalUrl ? `${siteUrl}${canonicalUrl}` : fullUrl

  // Construct full title
  const fullTitle = title ? `${title} - ${siteName}` : siteName

  // Default image
  const defaultImage = `${siteUrl}/og-image.jpg`
  const fullImageUrl = image ? (image.startsWith('http') ? image : `${siteUrl}${image}`) : defaultImage

  // Robots meta content
  const robotsContent = [
    noIndex ? 'noindex' : 'index',
    noFollow ? 'nofollow' : 'follow'
  ].join(', ')

  // Generate JSON-LD structured data for hotels
  const generateHotelStructuredData = () => {
    if (type === 'hotel' && structuredData) {
      return {
        '@context': 'https://schema.org',
        '@type': 'Hotel',
        'name': structuredData.name || title,
        'description': description || defaultDescription,
        'url': fullUrl,
        'image': fullImageUrl,
        'address': structuredData.address && {
          '@type': 'PostalAddress',
          'streetAddress': structuredData.address.street,
          'addressLocality': structuredData.address.city,
          'addressRegion': structuredData.address.state,
          'postalCode': structuredData.address.zipCode,
          'addressCountry': structuredData.address.country
        },
        'telephone': structuredData.phone,
        'email': structuredData.email,
        'priceRange': structuredData.priceRange,
        'starRating': structuredData.rating && {
          '@type': 'Rating',
          'ratingValue': structuredData.rating.value,
          'bestRating': structuredData.rating.max || 5
        },
        'amenityFeature': structuredData.amenities?.map(amenity => ({
          '@type': 'LocationFeatureSpecification',
          'name': amenity
        })),
        'availableService': structuredData.services?.map(service => ({
          '@type': 'Service',
          'name': service
        }))
      }
    }
    return null
  }

  // Generate breadcrumb structured data
  const generateBreadcrumbData = () => {
    if (breadcrumbs.length > 0) {
      return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': breadcrumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          'position': index + 1,
          'name': crumb.name,
          'item': `${siteUrl}${crumb.url}`
        }))
      }
    }
    return null
  }

  // Generate organization structured data
  const generateOrganizationData = () => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': siteName,
    'url': siteUrl,
    'logo': `${siteUrl}/logo.png`,
    'description': defaultDescription,
    'contactPoint': {
      '@type': 'ContactPoint',
      'telephone': '+1-800-HOTELS',
      'contactType': 'customer service',
      'availableLanguage': ['English']
    },
    'sameAs': [
      'https://facebook.com/hotelbooking',
      'https://twitter.com/hotelbooking',
      'https://instagram.com/hotelbooking'
    ]
  })

  // Generate website structured data
  const generateWebsiteData = () => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': siteName,
    'url': siteUrl,
    'description': defaultDescription,
    'potentialAction': {
      '@type': 'SearchAction',
      'target': {
        '@type': 'EntryPoint',
        'urlTemplate': `${siteUrl}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  })

  // Combine all structured data
  const allStructuredData = [
    generateOrganizationData(),
    generateWebsiteData(),
    generateHotelStructuredData(),
    generateBreadcrumbData(),
    structuredData && !['hotel'].includes(type) ? structuredData : null
  ].filter(Boolean)

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      <meta name="keywords" content={keywords || defaultKeywords} />
      <meta name="author" content={author || siteName} />
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={fullCanonicalUrl} />

      {/* Open Graph Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:site" content="@hotelbooking" />
      <meta name="twitter:creator" content="@hotelbooking" />

      {/* Article specific tags */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}

      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#1a1a1a" />
      <meta name="msapplication-TileColor" content="#1a1a1a" />
      <meta name="application-name" content={siteName} />
      <meta name="apple-mobile-web-app-title" content={siteName} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="mobile-web-app-capable" content="yes" />

      {/* Viewport */}
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

      {/* DNS Prefetch */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      <link rel="dns-prefetch" href="//www.google-analytics.com" />

      {/* Preconnect for critical resources */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

      {/* Alternate URLs for different languages/regions */}
      {alternateUrls.map(({ url: altUrl, hreflang }) => (
        <link
          key={hreflang}
          rel="alternate"
          hrefLang={hreflang}
          href={`${siteUrl}${altUrl}`}
        />
      ))}

      {/* Structured Data */}
      {allStructuredData.map((data, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}

      {/* Google Analytics */}
      {import.meta.env.VITE_GOOGLE_ANALYTICS_ID && import.meta.env.VITE_ENABLE_ANALYTICS === 'true' && (
        <>
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${import.meta.env.VITE_GOOGLE_ANALYTICS_ID}`}
          />
          <script>
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${import.meta.env.VITE_GOOGLE_ANALYTICS_ID}', {
                page_title: '${fullTitle}',
                page_location: '${fullUrl}'
              });
            `}
          </script>
        </>
      )}
    </Helmet>
  )
}

// Higher-order component for pages that need SEO
export const withSEO = (Component, defaultSEOProps = {}) => {
  return function SEOWrappedComponent(props) {
    const seoProps = { ...defaultSEOProps, ...props.seo }
    
    return (
      <>
        <SEOHead {...seoProps} />
        <Component {...props} />
      </>
    )
  }
}

// Hook for updating SEO dynamically
export const useSEO = (seoData) => {
  return <SEOHead {...seoData} />
}

// Common SEO configurations for different page types
export const seoConfigs = {
  home: {
    title: 'Find Your Perfect Hotel',
    description: 'Discover and book amazing hotels worldwide with our comprehensive booking platform. Best rates guaranteed.',
    keywords: 'hotel booking, accommodation, travel, vacation rentals, business travel',
    type: 'website'
  },
  
  search: {
    title: 'Search Hotels',
    description: 'Search through thousands of hotels and find the perfect accommodation for your trip.',
    keywords: 'hotel search, find hotels, accommodation search, book hotels',
    type: 'website'
  },
  
  roomDetails: {
    title: 'Room Details',
    description: 'View detailed information about this hotel room including amenities, photos, and booking options.',
    keywords: 'hotel room, accommodation details, room booking, hotel amenities',
    type: 'product'
  },
  
  booking: {
    title: 'Book Your Stay',
    description: 'Complete your hotel booking with our secure and easy booking process.',
    keywords: 'hotel booking, reservation, secure booking, confirm stay',
    type: 'website',
    noIndex: true // Don't index booking pages
  },
  
  dashboard: {
    title: 'My Bookings',
    description: 'Manage your hotel bookings, view upcoming stays, and access your booking history.',
    keywords: 'booking management, my reservations, booking history',
    type: 'website',
    noIndex: true // Private user content
  },
  
  auth: {
    title: 'Sign In',
    description: 'Sign in to your account to manage bookings and access exclusive member benefits.',
    keywords: 'login, sign in, account access, member login',
    type: 'website',
    noIndex: true // Don't index auth pages
  }
}

export default SEOHead