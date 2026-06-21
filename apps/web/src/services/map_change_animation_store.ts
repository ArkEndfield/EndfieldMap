import { action, observable } from 'mobx';

/** Drives the full-screen map-change transition so any switch source can play it. */
export class MapChangeAnimationStore {
  @observable accessor visible: boolean = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  @action
  show(): void {
    this.visible = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.hide(), 1500);
  }

  @action
  hide(): void {
    this.visible = false;
    this.timer = null;
  }
}

export const mapChangeAnimationStore = new MapChangeAnimationStore();
