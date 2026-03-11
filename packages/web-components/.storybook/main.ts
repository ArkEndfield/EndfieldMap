import type { StorybookConfig } from '@storybook/react-vite';
import { generateMetaTags } from './seo-config';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  framework: '@storybook/react-vite',
  // SEO meta tags for the Storybook iframe
  managerHead: () => generateMetaTags(),
};

export default config;
