<template>
  <div id="map" class="map-container"></div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import L from 'leaflet';
// @ts-ignore
import points from './assets/output.json'
const mapConfig = {
  map001: {
    bounds: [-128, 144],
    minZoom: 4,
    maxZoom: 6
  },
  map002: {
    bounds: [-160, 128],
    minZoom: 3,
    maxZoom: 5
  }
}
const selectMap = ref('map002')

const func = (data: {x: number, z: number}): [number, number] => {
  const temp: any = [data.z * 16 / 128 - 32, data.x * 16 / 128 + 80]
  console.log(temp)
  return temp
}

onMounted(() => {
  console.log(L)
  const map = L.map('map', {
    crs: L.CRS.Simple,
    zoom: 4,
    minZoom: mapConfig[selectMap.value].minZoom,
    maxZoom: mapConfig[selectMap.value].maxZoom, 
    attributionControl: false,
    maxBoundsViscosity: 1,
    maxBounds: [
      [0, 0],
      mapConfig[selectMap.value].bounds
    ]
  }).fitWorld();

  const tdtLayer = L.tileLayer(`/map/${selectMap.value}/{z}/{y}/{x}.png`)
  tdtLayer.on('add', () => {
    const gridLayer = new L.GridLayer({
      attribution: 'map002',
      tileSize: new L.Point(256, 256)
    });

    // @ts-ignore 原始图片 grid
    gridLayer.createTile = (coords) => {
      const tile = L.DomUtil.create('div', 'grid');
      const indexStr = [coords.x, coords.y,, coords.z].join(', ');
      tile.style.outline = '1px solid red';
      tile.style.color = 'white';
      tile.innerHTML = indexStr;
      return tile;
    }
    gridLayer.addTo(map);
  })
  tdtLayer.addTo(map)
  
  L.marker([0, 0]).addTo(map)
  L.marker([-32, 80]).addTo(map)
  L.marker(mapConfig[selectMap.value].bounds).addTo(map)

  const chestIcon = L.icon({
    iconUrl: '/assets/btn_backpack.png',
    iconSize:     [124*126/300, 124*126/300], 
    iconAnchor:   [62*126/300, 62*126/300],
  });
  for (const point of points["map02_lv001"]) {
    // if (point.entityDataIdKey != 'int_campfire_v2') continue
    if (!point.entityDataIdKey.includes('int_trchest')) continue
    console.log(point)
    L.marker(func(point.position), {icon: chestIcon}).addTo(map).openPopup();
  }


  // map.on('click', (e) => {
  //   const latlng = e.latlng;
  //   console.log(latlng)
  //   const popupContent = `坐标: (${latlng.lat}, ${latlng.lng})`;
  //   L.popup()
  //     .setLatLng(latlng) 
  //     .setContent(popupContent)
  //     .openOn(map);
  // });
});
</script>

<style>
.map-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>
