import type { DisposeListener, MapEventEmitter, MapEventListener, MapEventListenerUnion } from '@endfieldmap/map-core/types/event';

export class EndfieldMapEmitter {
    private eventCenter = new EventTarget();
    private listenerMap = new Map<MapEventListenerUnion, EventListener>();

    public on<T extends keyof MapEventEmitter>(event: T, listener: MapEventListener<T>): DisposeListener {
        const handler = (event: Event) => {
            const customEvent = event as CustomEvent<MapEventEmitter[T]>;
            listener(customEvent.detail);
        };
        this.eventCenter.addEventListener(event, handler);
        this.listenerMap.set(listener as MapEventListenerUnion, handler);
        return () => {
            this.eventCenter.removeEventListener(event, handler);
            this.listenerMap.delete(listener as MapEventListenerUnion);
        };
    }

    public fire<T extends keyof MapEventEmitter>(event: T, detail: MapEventEmitter[T]) {
        this.eventCenter.dispatchEvent(new CustomEvent(event, { detail }));
    }

    public off<T extends keyof MapEventEmitter>(event: T, listener: MapEventListener<T>) {
        const handler = this.listenerMap.get(listener as MapEventListenerUnion);
        if (handler) {
            this.eventCenter.removeEventListener(event, handler);
            this.listenerMap.delete(listener as MapEventListenerUnion);
        }
    }
}

const mapEventEmitter = new EndfieldMapEmitter();

export default mapEventEmitter;