import { EntityInstanceKey, FeatureType, FeatureTypeKey, type MapIndex } from "@endfieldmap/map-core/const/map";
import { MAP_EVENT } from "@endfieldmap/map-core/const/event";
import type { EntityData } from "@endfieldmap/map-core/types/entity";
import mapEventEmitter from "@endfieldmap/map-core/event/emitter";
import { xyz2crd } from "@endfieldmap/tools";
import { Feature } from "ol";
import { Point } from "ol/geom";
import { action, observable } from 'mobx';

export interface MapFeatureConfig {
    data: EntityData;
    mapIndex: MapIndex;
}

export class MapFeature {
    public feature: Feature;
    @observable accessor data: EntityData;
    @observable accessor marked: boolean = false;
    @observable accessor isSelected: boolean = false;
    @observable accessor active: boolean = false;
    private _onChange?: () => void;
    
    constructor(config: MapFeatureConfig) {
        this.data = config.data;
        const coordinates = xyz2crd(config.data.position, config.mapIndex);
        this.feature = new Feature({
            geometry: new Point(coordinates),
        });
        this.feature.set(FeatureTypeKey, FeatureType.ENTITY);
        this.feature.set(EntityInstanceKey, this);
    }

    /**
     * 设置onChange回调，当状态改变时触发
     * @param callback 回调函数
     */
    public setOnChange(callback: () => void) {
        this._onChange = callback;
    }

    /**
     * 设置marked状态
     * @param marked 是否标记
     */
    @action
    public setMarked(marked: boolean) {
        if (this.marked !== marked) {
            const oldValue = this.marked;
            this.marked = marked;
            this._onChange?.();

            // 触发状态变化事件
            mapEventEmitter.fire(MAP_EVENT.FEATURE_STATE_CHANGE, {
                feature: this,
                property: 'marked',
                oldValue,
                newValue: marked,
            });
        }
    }

    /**
     * 切换marked状态
     */
    public toggleMarked() {
        const marked = !this.marked;
        this.setMarked(marked);
        return marked;
    }

    /**
     * 设置isSelected状态
     * @param isSelected 是否选中
     */
    @action
    public setIsSelected(isSelected: boolean) {
        if (this.isSelected !== isSelected) {
            const oldValue = this.isSelected;
            this.isSelected = isSelected;
            this._onChange?.();

            // 触发状态变化事件
            mapEventEmitter.fire(MAP_EVENT.FEATURE_STATE_CHANGE, {
                feature: this,
                property: 'isSelected',
                oldValue,
                newValue: isSelected,
            });
        }
    }

    /**
     * 设置active状态
     * @param active 是否激活
     */
    @action
    public setActive(active: boolean) {
        if (this.active !== active) {
            const oldValue = this.active;
            this.active = active;
            this._onChange?.();

            // 触发状态变化事件
            mapEventEmitter.fire(MAP_EVENT.FEATURE_STATE_CHANGE, {
                feature: this,
                property: 'active',
                oldValue,
                newValue: active,
            });
        }
    }
}