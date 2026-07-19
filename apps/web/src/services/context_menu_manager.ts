import type { DataInstance, MapCoordinate } from '@endfieldmap/map-core';
import { action, makeObservable, observable } from 'mobx';

export interface ContextMenuContext {
  /** group：侧边栏标点分组/区域条目（entities 为该组全部点位实例） */
  type: 'entity' | 'connection' | 'map' | 'group';
  entities?: DataInstance[];
  pixel: [number, number];
  coordinate?: MapCoordinate;
  originalEvent: MouseEvent;
}

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ComponentType;
  order: number;
  visible?: (context: ContextMenuContext) => boolean;
  action: (context: ContextMenuContext) => void;
}

export class ContextMenuManager {
  @observable accessor isOpen = false;
  @observable accessor context: ContextMenuContext | null = null;

  private items = new Map<string, ContextMenuItem>();

  constructor() {
    makeObservable(this);
  }

  register(item: ContextMenuItem): () => void {
    this.items.set(item.id, item);
    return () => {
      this.items.delete(item.id);
    };
  }

  getVisibleItems(context: ContextMenuContext): ContextMenuItem[] {
    return Array.from(this.items.values())
      .filter((item) => !item.visible || item.visible(context))
      .sort((a, b) => a.order - b.order);
  }

  @action
  open(context: ContextMenuContext): void {
    context.originalEvent.preventDefault();
    this.context = context;
    this.isOpen = true;
  }

  @action
  close(): void {
    this.isOpen = false;
    this.context = null;
  }
}

export const contextMenuManager = new ContextMenuManager();
