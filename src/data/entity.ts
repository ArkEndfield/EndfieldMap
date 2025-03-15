export const entityInfo = {
    int_trchest_common_high: { name: '玛恩纳储藏箱', point: 'int_trchest_common' },
    int_trchest_common: { name: '储藏箱', point: 'int_trchest_common' },
    int_trchest_common_normal: { name: '水陈储藏箱', point: 'int_trchest_common' },
    int_trchest_lock: { name: '锁闭储藏箱', point: 'int_trchest_common' },
    int_collection_common: { name: '采集', point: 'default' },
    int_module_chasingrabbit: { name: '追兔头', point: 'default' },
    int_campfire_v2: { name: '协议传送点', point: 'int_campfire_v2' },
    int_narrative_common: { name: '纸条', point: 'item_read_note', scale: 0.15 },
    int_narrative_common_empty: { name: '字幕', pass: true },
    int_blackbox_entry: { name: '故障机器人', point: 'icon_map_blackbox', scale: 0.7 },
    int_blackbox_entry_hard: { name: '高难故障机器人', point: 'icon_map_blackbox', scale: 0.7 },
    int_dungeon_entry_challenge: { name: '神秘副本', point: 'icon_map_dungeon', scale: 0.7 },
    int_dungeon_entry_resource: { name: '神秘副本', point: 'icon_map_dungeon', scale: 0.7 },
}

export interface entityData {
    sceneId: string,
    position: {
        x: number,
        y: number,
        z: number
    },
    entityDataIdKey: string,
    properties?: any[]
}