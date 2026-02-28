export interface ImageData {
  isPool: boolean;
  image: HTMLImageElement;
}

export class ImagePool {
  public static imagePool: Map<string, HTMLImageElement> = new Map();
  public static maxPoolSize = 500;
  public static currentPoolSize = 0;

  public static getImage(src: string): ImageData {
    if (!this.imagePool.has(src)) {
      return {
        isPool: false,
        image: this.addImage(src),
      };
    }
    return {
      isPool: true,
      image: this.imagePool.get(src)!,
    };
  }

  public static addImage(src: string): HTMLImageElement {
    if (this.currentPoolSize >= this.maxPoolSize) {
      this.removeImage(this.imagePool.keys().next().value!);
    }
    const img = new Image();
    img.src = src;
    this.imagePool.set(src, img);
    this.currentPoolSize++;
    return img;
  }

  public static removeImage(src: string): void {
    if (this.imagePool.delete(src)) {
      this.currentPoolSize--;
    }
  }
}
