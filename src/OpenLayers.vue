<template>
  <div id="map" class="absolute top-0 left-0 right-0 bottom-0 bg-[url('/assets/deco_map_bg.png')] bg-repeat"></div>
  <div class="ol-popup" ref="popupContainer">
    <a href="#" class="ol-popup-closer" @click="closeToast"></a>
    {{ entityInfo[entity.entityDataIdKey]?.name || '未知名称' }}
    <NDivider class="!my-2 !text-sm" title-placement="right"> id: {{ entity.entityDataIdKey }} </NDivider>
    坐标 ({{ entity.position.x }}, {{ entity.position.y }}, {{ entity.position.z }})
  </div>
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
import { click, pointerMove } from 'ol/events/condition';
import Overlay from 'ol/Overlay';

import { NDivider } from 'naive-ui';

// @ts-ignore
import points from './assets/output.json'
import { entityInfo, entityData } from './data/entity';
import { areaNameLayer } from './data/locations';

const popupContainer = ref<HTMLElement>();
const marker = (entry: entityData) => {
  const info = entityInfo[entry.entityDataIdKey]
  if (info?.pass) return 
  // const pos = [entry.position.x * 16 / 128 + 80, entry.position.z * 16 / 128 + 224] 
  const pos = [entry.position.x * 16 / 128 + 96 + 32, entry.position.z * 16 / 128 + 128 + 32] 
  const feature = new Feature({
    geometry: new Point(pos),
    payload: entry,
  })
  feature.setStyle(new Style({
    image: new Icon({
      src: `/assets/${entityInfo[entry.entityDataIdKey]?.point || 'default'}.png`,
      scale: entityInfo[entry.entityDataIdKey]?.scale
    })
  }))
  return feature
}
// const pointFeature = new Feature(new Point([0, 0]));
const simpleProjection = new Projection({
  code: 'SIMPLE',
  units: 'pixels',
  extent: [0, 0, 256, 256]
});

const transparentBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/2+L6n0AAAAASUVORK5CYII=';

const features: Feature<Point>[] = []
for (const m in points) {
  if (!m.includes("map01")) continue
  for (const point of points[m]) {
    // if (point.entityDataIdKey != 'int_campfire_v2') continue
    // if (!point.entityDataIdKey.includes('int_trchest')) continue
    // console.log(point)
    const feature = marker(point)
    if (feature) features.push(feature)
  }
}

const entity = ref<entityData>({
  sceneId: '',
  entityDataIdKey: '',
  position: {x: 0, y: 0, z: 0}
})

let overlay: Overlay
const closeToast = () => {
  overlay.setPosition(undefined);
};

const tileLoad =  (imageTile: any, src) => {
  const img = new Image();
  img.onload = () => {
    imageTile.getImage().src = src;
  };
  img.onerror = () => {
    imageTile.getImage().src = transparentBase64;
  };
  img.src = src;
}

onMounted(() => {
  const feature = new Feature({
    geometry: new Point([96, 128]),
  })
  if (feature) features.push(feature)
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
          tileLoadFunction: tileLoad
        }),
      }),
      new VectorLayer({
        source: new VectorSource({
          features: features
        })
      }),
    ],
    view: new View({
      projection: simpleProjection,
      center: [32, 184],
      extent: [-64, 0, 256, 256],
      zoom: 3,
      maxZoom: 5,
    }),
    overlays: [overlay]
  });
  const selectInteraction = new Select({
    condition: click,
    style: null
  });
  map.addInteraction(selectInteraction);
  map.addLayer(areaNameLayer)
  map.on('click', function(event) {
    console.log(event.coordinate)
  })
  selectInteraction.on('select', function(event) {
    const target = event.selected[0]
    if (target) {
      const data = target.get('payload')
      if (!data) return
      entity.value = data
      const coords = event.mapBrowserEvent.pixel;
      // popupContent.value!.innerHTML = `<p>You clicked here:</p><code>${coords}</code>`;
      overlay.setPosition(event.mapBrowserEvent.coordinate);
    } else {
      overlay.setPosition(undefined);
    }
  });
});
</script>

<style>
.ol-popup {
  position: absolute;
  background-color: white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  padding: 15px;
  border-radius: 10px;
  border: 1px solid #cccccc;
  bottom: 12px;
  left: -50px;
  min-width: 280px;
}
.ol-popup:after, .ol-popup:before {
  top: 100%;
  border: solid transparent;
  content: " ";
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
  content: "✖";
}
</style>
