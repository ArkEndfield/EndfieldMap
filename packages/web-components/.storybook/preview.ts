import '../src/index.css';

import type { Preview } from '@storybook/react-vite';
import React from 'react';

import { setAudioBaseUrl } from '../src/services/audio_config';

setAudioBaseUrl('https://assets.zmdmap.com/audio');

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  // Global SEO configuration
  globalTypes: {
    seo: {
      title: 'EndfieldMap Components | ZMDMAP 组件库 - React UI Component Library',
      description: 'EndfieldMap Web Components - A reusable React UI component library | ZMDMAP 组件库 - 一个可复用的 React UI 组件库',
      keywords: 'EndfieldMap, ZMDMAP, React, Arknights, Components, UI, Map, TypeScript, Frontend',
      author: 'EndfieldMap Team',
      ogImage: 'https://github.com/ArkEndfield/EndfieldMap/raw/main/packages/web-components/public/og-image.png',
      url: 'https://github.com/ArkEndfield/EndfieldMap',
    },
  },
  // Decorator to inject SEO meta tags
  decorators: [
    (StoryFn: React.FC) => {
      React.useEffect(() => {
        // Update document title
        document.title = 'EndfieldMap Components | ZMDMAP 组件库';

        // Update or create meta description
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
          metaDescription = document.createElement('meta');
          metaDescription.setAttribute('name', 'description');
          document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', 'EndfieldMap Web Components - A reusable React UI component library | ZMDMAP 组件库 - 一个可复用的 React UI 组件库');

        // Update or create meta keywords
        let metaKeywords = document.querySelector('meta[name="keywords"]');
        if (!metaKeywords) {
          metaKeywords = document.createElement('meta');
          metaKeywords.setAttribute('name', 'keywords');
          document.head.appendChild(metaKeywords);
        }
        metaKeywords.setAttribute('content', 'EndfieldMap, ZMDMAP, React, Arknights, Components, UI, Map, TypeScript, Frontend');

        // Update Open Graph tags
        const updateOG = (property: string, content: string) => {
          let meta = document.querySelector(`meta[property="og:${property}"]`);
          if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('property', `og:${property}`);
            document.head.appendChild(meta);
          }
          meta.setAttribute('content', content);
        };

        updateOG('title', 'EndfieldMap Components | ZMDMAP 组件库');
        updateOG('description', 'EndfieldMap Web Components - A reusable React UI component library | ZMDMAP 组件库 - 一个可复用的 React UI 组件库');
        updateOG('image', 'https://github.com/ArkEndfield/EndfieldMap/raw/main/packages/web-components/public/og-image.png');
        updateOG('url', 'https://github.com/ArkEndfield/EndfieldMap');
      }, []);

      return React.createElement(StoryFn);
    },
  ],
};

export default preview;
