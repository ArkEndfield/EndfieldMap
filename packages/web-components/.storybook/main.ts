import type { StorybookConfig } from '@storybook/react-vite';

import { generateMetaTags } from './seo-config';

const config: StorybookConfig = {
  stories: [
    {
      directory: '../src',
      files: '**/*.stories.@(ts|tsx)',
      titlePrefix: 'EndfieldMap | ZMDMAP',
    },
  ],
  framework: '@storybook/react-vite',
  // SEO meta tags for Storybook manager
  managerHead: () => generateMetaTags(),
};

export default config;
