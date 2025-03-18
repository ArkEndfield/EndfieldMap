<template>
  <div
    id="map"
    class="absolute top-0 left-0 right-0 bottom-0 bg-cover bg-center"
  ></div>
  <div
    ref="controls"
    class="fixed bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/20 p-1 rounded-full backdrop-blur-md select-none text-white flex items-center gap-2"
  >
    <div class="zoom flex items-center gap-2">
      <button
        id="zoomOut"
        class="w-8 h-8 flex justify-center items-center bg-black/30 rounded-full hover:bg-black/40 transition-colors active:bg-black/50"
      >
        <MinusIcon class="pointer-events-none" />
      </button>
      <input
        type="range"
        min="1.8"
        max="5"
        step="0.1"
        v-model="zoomLevel"
        class="w-24 h-2 bg-black/30 rounded-full appearance-none"
        ref="sliderRef"
      />
      <button
        id="zoomIn"
        class="w-8 h-8 flex justify-center items-center bg-black/30 rounded-full hover:bg-black/40 transition-colors active:bg-black/50"
      >
        <PlusIcon class="pointer-events-none" />
      </button>
    </div>
  </div>
  <Transition
    @enter="onEnterPopup"
    @leave="onLeavePopup"
  >
    <div
      :class="
        cn(
          'ol-popup',
          'border-b-6 border-[#656465]',
          'absolute drop-shadow-md bottom-4 -left-[50px] min-w-32 origin-bottom-center will-change-transform will-change-opacity opacity-100 text-white origin-bottom',
          'before:absolute before:top-full before:border-solid before:border-transparent before:border-t-[#272727] before:border-12 before:left-11.5 before:-ml-2 before:pointer-events-none'
        )
      "
      ref="popupContainer"
      v-show="isPopupVisible"
    >
      <div
        class="w-full h-4 flex-shrink-0 flex-grow-0 bg-[#272727] top-bar"
      ></div>
      <div class="bg-[#272727] popup-content-container overflow-hidden">
        <div
          class="popup-slider"
          :class="{ 'slide-to-video': showVideoInfo }"
          @transitionend="onTransitionEnd"
        >
          <!-- 基本信息页面 -->
          <div class="popup-page">
            <div class="p-4 pt-2">
              <button
                class="no-underline absolute top-0 right-5 text-3xl text-[#ece065]"
                @click="closeToast"
              >
                <PowerIcon />
              </button>
              <div>
                {{
                  entityInfo[entity.entityDataIdKey]?.name ||
                  $t('popover.unknow_name')
                }}
              </div>
              <div class="!my-2 !text-sm">
                <span>id: {{ entity.entityDataIdKey }}</span>
                <span class="float-right opacity-75">#{{ entity.seq }}</span>
              </div>
              <div class="w-full h-32 rounded-md bg-[#9C9B9C]"></div>
              <div class="border-t border-[#404140] mt-2 pt-2 text-sm mx-1">
                坐标 ({{ entity.position.x }}, {{ entity.position.y }},
                {{ entity.position.z }})
              </div>
              <div class="flex items-center justify-between gap-2 mt-4">
                <button
                  class="text-[#ece065] text-sm px-3 py-1 bg-black/20 rounded-md hover:bg-black/30 transition-colors"
                  @click="toggleVideoInfo(true)"
                >
                  {{ $t('popover.video_link') }}
                </button>
                <div class="flex items-center justify-end gap-2">
                  <label
                    :for="`get-${entity.entityDataIdKey}`"
                    class="text-sm"
                  >
                    {{ $t('popover.obtained') }}
                  </label>
                  <ZmdSwitch :id="`get-${entity.entityDataIdKey}`" />
                </div>
              </div>
            </div>
          </div>

          <!-- 视频信息页面 -->
          <div class="popup-page">
            <div class="p-4 pt-2">
              <button
                class="no-underline absolute top-3 right-5 text-3xl text-[#ece065]"
                @click="closeToast"
              >
                <PowerIcon />
              </button>
              <div class="flex items-center mb-3 gap-2">
                <button
                  class="text-[#ece065] text-sm px-3 py-1 bg-black/20 rounded-md hover:bg-black/30 transition-colors flex items-center"
                  @click="toggleVideoInfo(false)"
                >
                  <span class="inline-block mr-1">
                    <ForwardLeftIcon />
                  </span>
                  {{ $t('back') }}
                </button>
                <div>{{ $t('popover.video_info') }}</div>
              </div>
              <div class="border-b border-[#404140] pb-2 mb-3">
                <div class="font-bold">
                  {{
                    entityInfo[entity.entityDataIdKey]?.name ||
                    $t('popover.unknow_name')
                  }}
                </div>
              </div>
              <div class="mb-3">
                <div class="text-sm text-gray-400">{{ $t('popover.bv') }}</div>
                <div class="text-[#ece065] mt-1">
                  {{
                    entityInfo[entity.entityDataIdKey]?.bvid ||
                    $t('popover.unknown_bv')
                  }}
                </div>
              </div>
              <div class="mb-3">
                <div class="text-sm text-gray-400">
                  {{ $t('popover.video_link') }}
                </div>
                <a
                  :href="`https://www.bilibili.com/video/${
                    entityInfo[entity.entityDataIdKey]?.bvid || ''
                  }`"
                  target="_blank"
                  class="text-[#ece065] mt-1 block break-all hover:underline"
                >
                  https://www.bilibili.com/video/{{
                    entityInfo[entity.entityDataIdKey]?.bvid ||
                    $t('popover.unknown_bv')
                  }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Map, View } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { cn } from '@/utils/tailwind';
import { XYZ, Vector as VectorSource } from 'ol/source';
import { Projection } from 'ol/proj';
import Point from 'ol/geom/Point';

import { Feature } from 'ol';
import { Icon, Style } from 'ol/style';
import { Select } from 'ol/interaction';
import { click } from 'ol/events/condition';
import Control from 'ol/control/Control';
import Overlay from 'ol/Overlay';

import { animate, spring } from 'motion';

// @ts-ignore
import points from './assets/output.json';
import { entityInfo, entityData } from './data/entity';
import { areaNameLayer } from './data/locations';
import { defaults as interactionDefaults } from 'ol/interaction';
import { xyz2crd } from './utils/common';

const popupContainer = ref<HTMLElement>();
const isPopupVisible = ref(false);
const controls = ref<HTMLElement>();
const zoomLevel = ref(3);
const showVideoInfo = ref(false);
const sliderRef = ref<HTMLElement>();

let index = 1;
const marker = (entry: entityData) => {
  entry.seq = index++;
  const info = entityInfo[entry.entityDataIdKey];
  if (!info || info?.pass) return;
  const feature = new Feature({
    geometry: new Point(xyz2crd(entry.position)),
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

const features: Feature<Point>[] = [];
const itemMap: any = {};
for (const m in points) {
  if (!m.includes('map01')) continue;
  for (const point of points[m]) {
    // if (!point.entityDataIdKey.includes('collection_coin')) continue;
    itemMap[point.entityDataIdKey] = (itemMap[point.entityDataIdKey] || 0) + 1;
    // if (!point.entityDataIdKey.includes('int_trchest')) continue
    // console.log(point)
    const feature = marker(point);
    if (feature) features.push(feature);
  }
}
console.log('醚质总数:', features.length, itemMap);
const entity = ref<entityData>({
  sceneId: '',
  seq: 1,
  entityDataIdKey: '',
  position: { x: 0, y: 0, z: 0 },
});

let overlay: Overlay;
let currentPosition: number[] | undefined;
const closeToast = () => {
  isPopupVisible.value = false;
  showVideoInfo.value = false; // 重置显示状态
  currentPosition = undefined;
};

let map: Map; // 全局存储地图实例，方便后续访问

// 优化的toggleVideoInfo函数
const toggleVideoInfo = (show: boolean) => {
  showVideoInfo.value = show;

  // 切换内容后立即获取当前位置并标记需要调整
  if (currentPosition) {
    // 在下一个渲染周期执行，确保DOM已更新
    requestAnimationFrame(() => {
      // 再次延迟以确保过渡动画已开始
      setTimeout(() => {
        if (isPopupVisible.value) {
          // 确保调用完成时弹窗可见
          adjustPopupPosition(true); // 传入true表示强制调整
        }
      }, 10);
    });
  }
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

// 监听弹窗内容过渡动画结束
function onTransitionEnd(event: TransitionEvent) {
  // 只在 popup-slider 的 transform 过渡结束后调整位置
  if (
    event.propertyName === 'transform' &&
    event.target &&
    (event.target as HTMLElement).classList.contains('popup-slider') &&
    isPopupVisible.value
  ) {
    // console.log('Transition ended, adjusting position');
    adjustPopupPosition(true); // 传入true表示强制调整
  }
}

// 改进的调整弹窗位置函数 - 用于在内容变化后重新检查位置
function adjustPopupPosition(forceAdjust = false) {
  if (!currentPosition || !popupContainer.value || !map) return;

  // 获取当前弹窗的实际尺寸
  const popupRect = popupContainer.value.getBoundingClientRect();
  const mapRect = map.getTargetElement().getBoundingClientRect();

  // 检查弹窗是否超出视口边界
  let needAdjust = forceAdjust; // 如果强制调整，则始终进行调整
  let adjustX = 0;
  let adjustY = 0;

  // 增大安全边距以确保弹窗完全可见
  const safeMargin = 30;

  // 检查是否超出边界
  if (popupRect.left < mapRect.left + safeMargin) {
    needAdjust = true;
    adjustX = mapRect.left + safeMargin - popupRect.left;
  }

  if (popupRect.right > mapRect.right - safeMargin) {
    needAdjust = true;
    adjustX = mapRect.right - safeMargin - popupRect.right;
  }

  if (popupRect.top < mapRect.top + safeMargin) {
    needAdjust = true;
    adjustY = mapRect.top + safeMargin - popupRect.top;
  }

  if (popupRect.bottom > mapRect.bottom - safeMargin) {
    needAdjust = true;
    adjustY = mapRect.bottom - safeMargin - popupRect.bottom;
  }

  if (needAdjust) {
    // console.log('Adjusting map center');
    const view = map.getView();
    const resolution = view.getResolution() || 1;
    const currentCenter = view.getCenter();

    // 添加检查确保currentCenter不为undefined
    if (!currentCenter) return;

    // 额外偏移以提供更多空间
    const extraOffset = 10;
    const extraY = adjustY !== 0 ? Math.sign(adjustY) * extraOffset : 0;
    const extraX = adjustX !== 0 ? Math.sign(adjustX) * extraOffset : 0;

    // 平滑动画
    view.animate({
      center: [
        currentCenter[0] - (adjustX + extraX) * resolution,
        currentCenter[1] + (adjustY + extraY) * resolution,
      ],
      duration: 250,
    });
  }
}

const tileLoad = (imageTile: any, src: string) => {
  const img = new Image();
  img.onload = () => {
    imageTile.getImage().src = src;
  };
  img.onerror = () => {
    imageTile.getImage().src = transparentBase64;
  };
  img.src = src;
};

onMounted(async () => {
  const feature = new Feature({
    geometry: new Point([96, 128]),
  });
  if (feature) features.push(feature);

  overlay = new Overlay({
    element: popupContainer.value,
    autoPan: false, // 禁用内置的自动平移，完全由我们自定义控制
    offset: [0, 10],
    positioning: 'bottom-center',
  });

  class ZoomControl extends Control {
    element: HTMLElement;

    constructor() {
      super({
        element: controls.value,
      });
      this.element = controls.value as HTMLElement;

      this.element.addEventListener('click', e => {
        const target = e.target as HTMLElement;
        const view = this.getMap()?.getView();
        const zoom = view?.getZoom() || 0;
        if (target.id === 'zoomIn' && view) {
          view.cancelAnimations(); // 取消之前的动画
          const newZoom = zoom + 1 <= 5 ? zoom + 1 : 5;
          view.animate({ zoom: newZoom, duration: 400 });
          zoomLevel.value = newZoom;
        } else if (target.id === 'zoomOut' && view) {
          view.cancelAnimations(); // 取消之前的动画
          const newZoom = zoom - 1 >= 0 ? zoom - 1 : 0;
          view.animate({ zoom: newZoom, duration: 400 });
          zoomLevel.value = newZoom;
        }
      });

      // 添加滑块事件监听器
      const slider = sliderRef.value;
      if (slider) {
        slider.addEventListener('input', () => {
          const view = this.getMap()?.getView();
          view?.cancelAnimations(); // 取消之前的动画
          view?.setZoom(Number(zoomLevel.value));
        });
      }
    }
  }

  const zoomControl = new ZoomControl();

  map = new Map({
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
      center: [100, 152],
      zoom: 3,
      maxZoom: 5,
      minZoom: 0,
      rotation: 0,
      // extent: [-100, 0, 325, 344],
      // constrainResolution: true,
      enableRotation: false
    }),
    interactions: interactionDefaults({
      altShiftDragRotate: false,
      pinchRotate: false,
    }),
    overlays: [overlay],
    controls: [zoomControl],
  });

  map.getView().on('change:resolution', function () {
    const zoom = map.getView().getZoom() || 0;
    zoomLevel.value = zoom
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
  selectInteraction.on('select', async function (event) {
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
            entity.value = data;
            showVideoInfo.value = false;

            // 保存位置
            currentPosition = [...newPosition];

            // 先设置弹窗位置，但不显示
            overlay.setPosition(newPosition);

            // 预先调整地图中心
            adjustMapForPopup(map, newPosition, () => {
              // 动画完成后才显示弹窗
              isPopupVisible.value = true;
            });
          }, 300);
        } else {
          // 首次显示
          entity.value = data;
          showVideoInfo.value = false;
          currentPosition = [...newPosition];

          // 先设置弹窗位置，但不显示
          overlay.setPosition(newPosition);

          // 预先调整地图中心
          await adjustMapForPopup(map, newPosition, () => {
            // 动画完成后才显示弹窗
            isPopupVisible.value = true;
          });
        }
      } else {
        // 如果是同一位置，只更新实体信息
        entity.value = data;
      }
    } else {
      isPopupVisible.value = false;
      showVideoInfo.value = false;
      currentPosition = undefined;
    }
  });

  // 创建一个MutationObserver来监视弹窗内容的变化
  if (popupContainer.value) {
    const observer = new MutationObserver(() => {
      if (isPopupVisible.value && currentPosition) {
        // 当DOM变化时检测弹窗位置
        adjustPopupPosition();
      }
    });

    // 配置观察选项
    observer.observe(popupContainer.value, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
  }

  // 当窗口大小改变时，也需要检查弹窗位置
  window.addEventListener('resize', () => {
    if (isPopupVisible.value && currentPosition) {
      adjustPopupPosition();
    }
  });

  // 重写调整地图位置的函数
  async function adjustMapForPopup(
    map: Map,
    position: number[],
    callback?: () => void
  ) {
    const view = map.getView();
    const mapSize = map.getSize();
    const popupWidth = 300; // 像素
    if (!mapSize || !popupContainer.value) {
      if (callback) callback();
      return;
    }

    // 获取地图容器的边界
    const mapRect = map.getTargetElement().getBoundingClientRect();

    // 增加弹窗的估计高度和宽度，确保有足够空间
    const popupHeight = 320; // 像素
    const safeMargin = 60; // 安全边距

    // 将点位置转换为屏幕像素坐标
    const pixel = map.getPixelFromCoordinate(position);
    if (!pixel) {
      if (callback) callback();
      return;
    }

    // 估计弹窗在屏幕上的位置
    const popupTop = pixel[1] - popupHeight - 15; // 顶部额外安全空间
    const popupBottom = pixel[1] + 35; // 底部箭头高度估算
    const popupLeft = pixel[0] - popupWidth / 2;
    const popupRight = pixel[0] + popupWidth / 2;

    const viewportWidth = mapRect.width;
    const viewportHeight = mapRect.height;

    let needToMove = false;
    let panX = 0;
    let panY = 0;

    // 顶部检查 - 使用更大的安全距离
    if (popupTop < safeMargin) {
      needToMove = true;
      panY = safeMargin - popupTop;
    }

    // 底部检查
    if (popupBottom > viewportHeight - safeMargin) {
      needToMove = true;
      panY = viewportHeight - safeMargin - popupBottom;
    }

    // 左侧检查 - 使用更大的安全距离
    if (popupLeft < safeMargin) {
      needToMove = true;
      panX = safeMargin - popupLeft;
    }

    // 右侧检查
    if (popupRight > viewportWidth - safeMargin) {
      needToMove = true;
      panX = viewportWidth - safeMargin - popupRight;
    }

    if (needToMove) {
      const resolution = view.getResolution() || 1;

      // 添加额外偏移以确保弹窗完全可见
      const extraOffsetY = panY !== 0 ? Math.sign(panY) * 30 : 0;
      const extraOffsetX = panX !== 0 ? Math.sign(panX) * 30 : 0;
      const currentCenter = view.getCenter();

      // 添加检查确保currentCenter不为undefined
      if (!currentCenter) {
        if (callback) callback();
        return;
      }

      const newCenter = [
        currentCenter[0] - (panX + extraOffsetX) * resolution,
        currentCenter[1] + (panY + extraOffsetY) * resolution,
      ];

      // 使用动画，完成后调用回调
      await new Promise<void>(resolve => {
        view.animate(
          {
            center: newCenter,
            duration: 300,
          },
          () => {
            // 动画完成后稍微延迟，确保地图渲染完成
            setTimeout(() => resolve(), 50);
          }
        );
      });

      if (callback) callback();
    } else {
      // 如果不需要移动地图，直接调用回调
      if (callback) callback();
    }
  }
});

// 在script标签开始处添加类型定义
declare global {
  interface HTMLElement {
    _hasPositionMonitor?: boolean;
  }
}
</script>

<style lang="scss">
#map {
  background-image: url('/assets/map_bg.png');
}
.ol-popup {
  &.v-enter-from,
  &.v-leave-to {
    opacity: 0;
    transform: scaleY(0.5);
  }

  .top-bar {
    $height: 1rem;
    $clip: polygon(0% 0%, calc(100% - $height) 0%, 100% 100%, 0% 100%);
    -webkit-clip-path: $clip;
    clip-path: $clip;
  }

  .popup-content-container {
    position: relative;
    width: 100%;
    overflow: hidden;
  }

  .popup-slider {
    display: flex;
    width: 200%;
    transition: transform 0.3s ease-in-out;

    &.slide-to-video {
      transform: translateX(-50%);
    }
  }

  .popup-page {
    width: 50%;
    flex-shrink: 0;
    position: relative;
  }
}

/* 自定义滑块样式 */
input[type='range'] {
  -webkit-appearance: none;
  appearance: none;
  height: 2px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 5px;
  background-image: linear-gradient(#ece065, #ece065);
  background-repeat: no-repeat;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 14px;
    width: 14px;
    border-radius: 50%;
    background: #ece065;
    box-shadow: 0 0 2px 0 rgba(0, 0, 0, 0.5);
  }

  &::-moz-range-thumb {
    height: 14px;
    width: 14px;
    border-radius: 50%;
    background: #ece065;
    box-shadow: 0 0 2px 0 rgba(0, 0, 0, 0.5);
    border: none;
  }

  &:focus {
    outline: none;
  }
}
</style>
