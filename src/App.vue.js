import { onMounted, ref } from 'vue';
import L from 'leaflet'; // 导入 Leaflet
const mapConfig = {
    map001: {
        bounds: [-128, 144],
        minZoom: 4,
        maxZoom: 6
    },
    map002: {
        bounds: [-160, 160],
        minZoom: 3,
        maxZoom: 5
    }
};
const selectMap = ref('map002');
const func = (data) => {
    // 二维仿射变换参数（通过解线性方程组得出）
    const a = 0.0151;
    const b = 0.1575;
    const c = -35.155;
    const d = 0.1482;
    const e = 0.0004574;
    const f = 93.66;
    // 应用变换公式
    const xPrime = a * data.x + b * data.y + c;
    const yPrime = d * data.x + e * data.y + f;
    return [Number(xPrime), Number(yPrime)];
};
onMounted(() => {
    console.log(L);
    const map = L.map('map', {
        crs: L.CRS.Simple,
        center: [100, -200],
        zoom: 4,
        minZoom: mapConfig[selectMap.value].minZoom,
        maxZoom: mapConfig[selectMap.value].maxZoom,
        attributionControl: false,
        maxBounds: [
            [0, 0],
            mapConfig[selectMap.value].bounds
        ]
    }).fitWorld();
    const tdtLayer = L.tileLayer(`/map/${selectMap.value}/{z}/{y}/{x}.png`);
    tdtLayer.on('add', () => {
        const gridLayer = new L.GridLayer({
            attribution: 'Grid Layer',
            tileSize: new L.Point(256, 256)
        });
        // @ts-ignore
        gridLayer.createTile = (coords) => {
            const tile = L.DomUtil.create('div', 'grid');
            const indexStr = [coords.x, coords.y, coords.z].join(', ');
            tile.style.outline = '1px solid red';
            tile.style.color = 'white';
            tile.innerHTML = indexStr;
            return tile;
        };
        gridLayer.addTo(map);
    });
    tdtLayer.addTo(map);
    L.marker([0, 0]).addTo(map)
        .openPopup();
    L.marker(mapConfig[selectMap.value].bounds).addTo(map)
        .openPopup();
    // L.marker(func({"x": 136.47, "y": -536.7})).addTo(map).openPopup();
    // L.marker(func({"x": 293.07, "y": -620.74})).addTo(map).openPopup();
    // L.marker(func({"x": -233.96, "y": -155.49})).addTo(map).openPopup();
    // L.marker(func({"x": 2.29, "y": -246.0})).addTo(map).openPopup();
    // L.marker(func({"x": -225.67, "y": -334.52})).addTo(map).openPopup();
    L.marker([-117.625, 113.625]).addTo(map).openPopup();
    L.marker([-128.5, 136.8]).addTo(map).openPopup();
    L.marker([-73.875, 93.875]).addTo(map).openPopup();
    L.marker([-60, 59]).addTo(map).openPopup();
    L.marker([-87.125, 60.875]).addTo(map).openPopup();
    map.on('click', (e) => {
        const latlng = e.latlng;
        console.log(latlng);
        const popupContent = `坐标: (${latlng.lat}, ${latlng.lng})`;
        L.popup()
            .setLatLng(latlng)
            .setContent(popupContent)
            .openOn(map);
    });
    // -127.53125, 136.8125
    //     {"x": 136.47, "y": -536.7},
    //     {"x": 293.07, "y": -620.74},
    //     {"x": -233.96, "y": -155.49},
    //     {"x": 2.29, "y": -246.0},
    //     {"x": -225.67, "y": -334.52}
});
; /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    // CSS variable injection 
    // CSS variable injection end 
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        id: ("map"),
        ...{ class: ("map-container") },
    });
    ['map-container',];
    var __VLS_slots;
    var $slots;
    let __VLS_inheritedAttrs;
    var $attrs;
    const __VLS_refs = {};
    var $refs;
    var $el;
    return {
        attrs: {},
        slots: __VLS_slots,
        refs: $refs,
        rootEl: $el,
    };
}
;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEl: {},
});
; /* PartiallyEnd: #4569/main.vue */
