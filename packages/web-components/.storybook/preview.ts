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
};

export default preview;
