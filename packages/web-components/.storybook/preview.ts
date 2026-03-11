import type { Preview } from '@storybook/react-vite';

import { setAudioBaseUrl } from '../src/services/audio_config';
import '../src/index.css';

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
};

export default preview;
