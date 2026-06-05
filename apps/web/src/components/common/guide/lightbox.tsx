import 'yet-another-react-lightbox/styles.css';
import '@/components/common/guide/captions.css';
import '@/components/common/guide/thumbnails.css';

import { type ComponentProps } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';

const plugins = [Captions, Fullscreen, Thumbnails, Zoom];

const GuideLightbox = (props: ComponentProps<typeof Lightbox>) => <Lightbox plugins={plugins} {...props} />;

export default GuideLightbox;
