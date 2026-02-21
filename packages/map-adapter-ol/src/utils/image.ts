import { ImagePool } from '@endfieldmap/tools';
import { ImageTile, type Tile } from 'ol';

export const emptyImageBase64String = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
export const emptyImage = new Image();
emptyImage.src = emptyImageBase64String;

export const tileLoadFunction = (tile: Tile, src: string) => {
  if (tile instanceof ImageTile) {
    if (src === emptyImageBase64String) {
      tile.setImage(emptyImage);
    } else {
      const img = ImagePool.getImage(src);
      if (img.isPool || img.image.complete || img.image.width > 0 || img.image.height > 0) {
        tile.setImage(img.image);
      } else {
        img.image.src = src;
        img.image.onload = () => {
          tile.setImage(img.image);
        };
        img.image.onerror = () => {
          tile.setImage(emptyImage);
        };
      }
    }
  }
};
