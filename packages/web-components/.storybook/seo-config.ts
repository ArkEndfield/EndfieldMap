/**
 * SEO Configuration for Storybook
 * Centralized location for managing all SEO-related metadata
 */

export const SEO_CONFIG = {
  site: {
    title: 'EndfieldMap Components | ZMDMAP 组件库 - React UI Component Library',
    description: 'EndfieldMap Web Components - A reusable React UI component library | ZMDMAP 组件库 - 一个可复用的 React UI 组件库',
    url: 'https://github.com/ArkEndfield/EndfieldMap',
  },
  meta: {
    keywords: 'EndfieldMap, ZMDMAP, 终末地, Endfield, 明日方舟, Arknights, React, Components, UI, Map, TypeScript, Frontend',
    author: 'EndfieldMap Team',
    image: 'https://github.com/ArkEndfield/EndfieldMap/raw/main/packages/web-components/public/og-image.png',
  },
  openGraph: {
    type: 'website',
    title: 'EndfieldMap Components - React UI Component Library',
    description: 'EndfieldMap Web Components - A reusable React UI component library.',
    image: 'https://github.com/ArkEndfield/EndfieldMap/raw/main/packages/web-components/public/og-image.png',
    url: 'https://github.com/ArkEndfield/EndfieldMap',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EndfieldMap Components - React UI Component Library',
    description: 'EndfieldMap Web Components - A reusable React UI component library.',
    image: 'https://github.com/ArkEndfield/EndfieldMap/raw/main/packages/web-components/public/og-image.png',
  },
} as const;

/**
 * Generate meta tags HTML string
 */
export const generateMetaTags = (): string => `
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${SEO_CONFIG.site.title}</title>
  <meta name="description" content="${SEO_CONFIG.site.description}">
  <meta name="keywords" content="${SEO_CONFIG.meta.keywords}">
  <meta name="author" content="${SEO_CONFIG.meta.author}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${SEO_CONFIG.openGraph.type}">
  <meta property="og:title" content="${SEO_CONFIG.openGraph.title}">
  <meta property="og:description" content="${SEO_CONFIG.openGraph.description}">
  <meta property="og:image" content="${SEO_CONFIG.openGraph.image}">
  <meta property="og:url" content="${SEO_CONFIG.openGraph.url}">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="${SEO_CONFIG.twitter.card}">
  <meta name="twitter:title" content="${SEO_CONFIG.twitter.title}">
  <meta name="twitter:description" content="${SEO_CONFIG.twitter.description}">
  <meta name="twitter:image" content="${SEO_CONFIG.twitter.image}">
  
  <!-- Canonical URL -->
  <link rel="canonical" href="${SEO_CONFIG.site.url}">
`;
