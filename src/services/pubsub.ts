type Callback = (...args: any[]) => void;
type Unsubscribe = () => void;

class PubSub {
  private events: Map<string, Set<Callback>> = new Map();
  private static instance: PubSub;

  private constructor() {}

  public static getInstance(): PubSub {
    if (!PubSub.instance) {
      PubSub.instance = new PubSub();
    }
    return PubSub.instance;
  }

  public subscribe(event: string, callback: Callback): Unsubscribe {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)?.add(callback);

    return () => {
      this.unsubscribe(event, callback);
    };
  }

  public unsubscribe(event: string, callback: Callback): void {
    this.events.get(event)?.delete(callback);
  }

  public publish(event: string, ...args: any[]): void {
    this.events.get(event)?.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in ${event} callback:`, error);
      }
    });
  }

  public clear(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
}

export const pubsub = PubSub.getInstance();

// 定义事件名称常量
export const EVENTS = {
  MARK_CHANGE: 'mark_change',
  MULTI_SELECT_STATE_CHANGE: 'multi_select_state_change',
  MULTI_SELECT_CHANGE: 'multi_select_change',
  SELECT_CHANGE: 'select_change',
  SETTINGS_CHANGE: 'settings_change',
} as const;
