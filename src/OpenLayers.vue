<template>
  <div
    id="map"
    class="absolute top-0 left-0 right-0 bottom-0 bg-[url('/assets/deco_map_bg.png')] bg-repeat"
  ></div>
  <Transition
    @enter="onEnterPopup"
    @leave="onLeavePopup"
  >
    <div
      class="ol-popup"
      ref="popupContainer"
      v-show="isPopupVisible"
    >
      <button
        class="ol-popup-closer"
        @click="closeToast"
      ></button>
      {{ entityInfo[entity.entityDataIdKey]?.name || '未知名称' }}
      <NDivider
        class="!my-2 !text-sm"
        title-placement="right"
      >
        id: {{ entity.entityDataIdKey }}
      </NDivider>
      坐标 ({{ entity.position.x }}, {{ entity.position.y }},
      {{ entity.position.z }})
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Map, View } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';

import { XYZ, Vector as VectorSource } from 'ol/source';
import { Projection } from 'ol/proj';
import Point from 'ol/geom/Point';

import { Feature } from 'ol';
import { Icon, Style } from 'ol/style';
import { Select } from 'ol/interaction';
import { click } from 'ol/events/condition';
import Overlay from 'ol/Overlay';

import { NDivider } from 'naive-ui';
import { animate, spring } from 'motion';

// @ts-ignore
import points from './assets/output.json';
import { entityInfo, entityData } from './data/entity';
import { areaNameLayer } from './data/locations';

const popupContainer = ref<HTMLElement>();
const isPopupVisible = ref(false);

const marker = (entry: entityData) => {
  const info = entityInfo[entry.entityDataIdKey];
  if (info?.pass) return;
  // const pos = [entry.position.x * 16 / 128 + 80, entry.position.z * 16 / 128 + 224]
  const pos = [
    (entry.position.x * 16) / 128 + 96 + 32,
    (entry.position.z * 16) / 128 + 128 + 32,
  ];
  const feature = new Feature({
    geometry: new Point(pos),
    payload: entry,
  });
  feature.setStyle(
    new Style({
      image: new Icon({
        src: `/assets/${
          entityInfo[entry.entityDataIdKey]?.point || 'default'
        }.png`,
        scale: entityInfo[entry.entityDataIdKey]?.scale,
      }),
    })
  );
  return feature;
};
// const pointFeature = new Feature(new Point([0, 0]));
const simpleProjection = new Projection({
  code: 'SIMPLE',
  units: 'pixels',
  extent: [0, 0, 256, 256],
});

const transparentBase64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/2+L6n0AAAAASUVORK5CYII=';

const features: Feature<Point>[] = []
const itemMap: any = {}
for (const m in points) {
  if (!m.includes('map01')) continue;
  for (const point of points[m]) {
    if (!point.entityDataIdKey.includes('collection_coin')) continue
    itemMap[point.entityDataIdKey] = (itemMap[point.entityDataIdKey] || 0) + 1
    // if (!point.entityDataIdKey.includes('int_trchest')) continue
    // console.log(point)
    const feature = marker(point);
    if (feature) features.push(feature);
  }
}
console.log('醚质总数:', features.length, itemMap)
const entity = ref<entityData>({
  sceneId: '',
  entityDataIdKey: '',
  position: { x: 0, y: 0, z: 0 },
});

let overlay: Overlay;
let currentPosition: number[] | undefined;
const closeToast = () => {
  isPopupVisible.value = false;
  currentPosition = undefined;
};

// 添加动画效果函数
async function onEnterPopup(el: Element, onComplete: () => void) {
  el.setAttribute('style', 'transform: scaleY(0.5); opacity: 0;');
  await animate(
    el,
    {
      scaleY: 1,
      opacity: 1,
    },
    { duration: 0.4, type: spring, bounce: 0.25 }
  );
  onComplete();
}

async function onLeavePopup(el: Element, onComplete: () => void) {
  await animate(
    el,
    {
      scaleY: 0.5,
      opacity: 0,
    },
    { duration: 0.3, type: spring, bounce: 0.25 }
  );
  onComplete();
}

const tileLoad = (imageTile: any, src) => {
  const img = new Image();
  img.onload = () => {
    imageTile.getImage().src = src;
  };
  img.onerror = () => {
    imageTile.getImage().src = transparentBase64;
  };
  img.src = src;
};

onMounted(() => {
  const feature = new Feature({
    geometry: new Point([96, 128]),
  });
  if (feature) features.push(feature);
  overlay = new Overlay({
    element: popupContainer.value,
    autoPan: {
      animation: {
        duration: 250,
      },
    },
  });

  const map = new Map({
    target: 'map',
    layers: [
      new TileLayer({
        source: new XYZ({
          projection: simpleProjection,
          url: '/map/map001/{z}/{y}/{x}.png',
          tileLoadFunction: tileLoad,
        }),
      }),
      new VectorLayer({
        source: new VectorSource({
          features: features,
        }),
      }),
    ],
    view: new View({
      projection: simpleProjection,
      center: [32, 184],
      extent: [-15, 0, 256, 256],
      zoom: 3,
      maxZoom: 5,
    }),
    overlays: [overlay],
  });
  const selectInteraction = new Select({
    condition: click,
    style: null,
  });
  map.addInteraction(selectInteraction);
  map.addLayer(areaNameLayer);
  map.on('click', function (event) {
    console.log(event.coordinate);
  });
  selectInteraction.on('select', function (event) {
    const target = event.selected[0];
    if (target) {
      const data = target.get('payload');
      if (!data) return;

      const newPosition = event.mapBrowserEvent.coordinate;
      const positionChanged =
        !currentPosition ||
        newPosition[0] !== currentPosition[0] ||
        newPosition[1] !== currentPosition[1];

      if (positionChanged) {
        // 如果是新位置，先隐藏弹出层
        if (isPopupVisible.value) {
          isPopupVisible.value = false;
          // 使用setTimeout确保DOM更新和动画完成
          setTimeout(() => {
            entity.value = data; // 移到这里，在动画完成后才更新实体信息
            overlay.setPosition(newPosition);
            currentPosition = [...newPosition];
            isPopupVisible.value = true;
          }, 300); // 匹配离开动画的持续时间
        } else {
          // 首次显示
          entity.value = data; // 首次显示时直接更新
          overlay.setPosition(newPosition);
          currentPosition = [...newPosition];
          isPopupVisible.value = true;
        }
      } else {
        // 如果是同一位置，只更新实体信息
        entity.value = data;
      }
    } else {
      isPopupVisible.value = false;
      currentPosition = undefined;
    }
  });
});
</script>

<style lang="scss">
.ol-popup {
  position: absolute;
  background-color: white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  padding: 15px;
  border-radius: 10px;
  border: 1px solid #cccccc;
  bottom: 12px;
  left: -50px;
  min-width: 280px;
  transform-origin: bottom center;
  will-change: transform, opacity;
  opacity: 1;
}

.ol-popup:after,
.ol-popup:before {
  top: 100%;
  border: solid transparent;
  content: ' ';
  height: 0;
  width: 0;
  position: absolute;
  pointer-events: none;
}
.ol-popup:after {
  border-top-color: white;
  border-width: 10px;
  left: 48px;
  margin-left: -10px;
}
.ol-popup:before {
  border-top-color: #cccccc;
  border-width: 11px;
  left: 48px;
  margin-left: -11px;
}

.ol-popup-closer {
  text-decoration: none;
  position: absolute;
  top: 2px;
  right: 8px;
}
.ol-popup-closer:after {
  content: '✖';
}
.ol-popup {
  &.v-enter-from,
  &.v-leave-to {
    opacity: 0;
    transform: scaleY(0.5);
  }

  &.v-enter-to,
  &.v-leave-from {
    opacity: 1;
    transform: scaleY(1);
  }
}
</style>
