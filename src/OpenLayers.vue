<template>
  <div
    id="map"
    class="absolute top-0 left-0 right-0 bottom-0 bg-cover bg-center"
  ></div>
  <div
    ref="controls"
    class="fixed left-1/2 md:left-[unset] -translate-x-1/2 md:translate-x-0 md:right-4 bottom-5 md:bottom-[unset] md:top-1/2 md:-translate-y-1/2 z-10 select-none text-white flex flex-row-reverse md:flex-col justify-center gap-2"
  >
    <ZoomButton
      id="zoomIn"
      class="w-4 h-4"
    >
      <PlusIcon
        class="pointer-events-none text-4xl drop-shadow-[0_0_0.2em_rgba(253,251,84,0.4)]"
      />
    </ZoomButton>
    <RangeInput
      v-model="zoomLevel"
      :min="1.8"
      :max="5"
      :step="0.1"
      class="w-18 md:w-auto md:h-18"
      :direction="inputDirection"
      @change="onSlideChange"
    />
    <ZoomButton
      id="zoomOut"
      class="w-4 h-4"
    >
      <MinusIcon
        class="pointer-events-none text-4xl drop-shadow-[0_0_0.2em_rgba(253,251,84,0.4)]"
      />
    </ZoomButton>
  </div>
  <Transition
    @enter="onEnterPopup"
    @leave="onLeavePopup"
  >
    <div
      class="ol-popup absolute bottom-4 -left-[50px] will-change-transform will-change-opacity opacity-100 text-white origin-bottom w-[300px]"
      ref="popupContainer"
      v-show="isPopupVisible"
    >
      <!-- 背面的弹出框 -->
      <div
        class="pop-drop absolute -top-3 w-full -right-4 -z-0 h-full flex flex-col"
        :class="{ unfold: openSubPopup }"
      >
        <button
          class="absolute -right-6 top-0 bottom-0 flex flex-col w-6"
          @click="toggleSubPopup"
        >
          <div
            class="w-full flex-shrink-0 flex-grow-0 bg-[#3E3E3E] top-bar"
          ></div>
          <div class="bg-[#3E3E3E] py-1.5">
            <div class="h-1 bg-[#4C4C4C] mr-1"></div>
          </div>
          <div
            class="[writing-mode:vertical-lr] bg-[#3E3E3E] text-[#bfbfbf] font-black pb-6 flex-1 flex items-center justify-center text-2xl"
          >
            <DoubleChevronRight
              class="drop-shadow-[0_0_0.2em_rgba(191,191,191,0.8)] transition-transform"
              :class="{ 'rotate-180': openSubPopup }"
            />
          </div>
        </button>
        <div
          class="flex-1 bg-[#272727] flex justify-stretch items-stretch relative overflow-hidden"
        >
          <div
            class="grid grid-cols-2 gap-4 px-6 py-4 w-full h-full overflow-y-auto"
          >
            <PopContentItem>
              <template #icon>
                <img
                  src="/assets/item_read_bag.png"
                  alt=""
                />
              </template>
              <template #count>123</template>
              行动资历
            </PopContentItem>
            <PopContentItem>
              <template #icon></template>
              行动资历
            </PopContentItem>
            <PopContentItem>
              <template #icon></template>
              行动资历
            </PopContentItem>
            <PopContentItem>
              <template #icon></template>
              行动资历
            </PopContentItem>
            <PopContentItem>
              <template #icon></template>
              行动资历
            </PopContentItem>
          </div>
        </div>
      </div>

      <!-- 前面的弹出框 -->
      <div
        :class="
          cn(
            'pop-content',
            'border-b-6 border-[#656465] relative',
            'before:absolute before:top-full before:border-solid before:border-transparent before:border-t-[#515151] before:border-12 before:left-11.5 before:-ml-2 before:pointer-events-none'
          )
        "
      >
        <div
          class="w-full flex-shrink-0 flex-grow-0 bg-[#272727] top-bar"
        ></div>
        <div
          :class="
            cn(
              'bg-[#272727] popup-content-container overflow-hidden',
              'after:absolute after:-z-0 after:left-0 after:h-32 after:bottom-0 after:w-54 after:bg-gradient-to-tr after:from-white/25 after:via-white/0 after:to-black/0'
            )
          "
        >
          <div
            class="-z-0 absolute -top-12 w-full text-[8rem] font-[Outfit] font-bold text-center text-[rgba(70,70,70,0.4)] tracking-[-0.08em]"
          >
            ZMD
          </div>
          <div
            class="-z-0 absolute top-1/2 -right-0.5 font-[Outfit] font-bold text-center text-[rgba(70,70,70,0.4)] [writing-mode:vertical-lr] transform translate-y-[-50%] text-xs tracking-[0.5em]"
          >
            ZMDMAPS
          </div>
          <div
            class="popup-slider z-1 relative"
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
                    entityInfo[entity.entityDataIdKey]?.entityInfo.name ||
                    $t('popover.unknow_name')
                  }}
                </div>
                <div class="!my-2 !text-sm">
                  <span>id: {{ entity.entityDataIdKey }}</span>
                  <span class="float-right opacity-75">#{{ entity.seq }}</span>
                </div>
                <!-- <div class="w-full h-32 rounded-md bg-[#9C9B9C]"></div> -->
                <GuideNode :nodes="guides[entity.seq].nodes" />
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
                    <ZmdSwitch
                      :id="`get-${entity.entityDataIdKey}`"
                      v-model:checked="marks[entity.seq].finish"
                    />
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
                      guides[entity.seq].video.bv || $t('popover.unknow_name')
                    }}
                  </div>
                </div>
                <div class="mb-3">
                  <div class="text-sm text-gray-400">
                    {{ $t('popover.bv') }}
                  </div>
                  <div class="text-[#ece065] mt-1">
                    {{
                      guides[entity.seq].video.bv || $t('popover.unknown_bv')
                    }}
                  </div>
                </div>
                <div class="mb-3">
                  <div class="text-sm text-gray-400">
                    {{ $t('popover.video_link') }}
                  </div>
                  <a
                    :href="`https://www.bilibili.com/video/${
                      guides[entity.seq].video.bv || ''
                    }`"
                    target="_blank"
                    class="text-[#ece065] mt-1 block break-all hover:underline"
                  >
                    https://www.bilibili.com/video/{{
                      guides[entity.seq].video.bv || $t('popover.unknown_bv')
                    }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount } from 'vue';
import { Map, View } from 'ol';
import { Tile as TileLayer } from 'ol/layer';
import { cn } from '@/utils/tailwind';
import { XYZ } from 'ol/source';
import { Projection } from 'ol/proj';
import { Select } from 'ol/interaction';
import { click } from 'ol/events/condition';
import Control from 'ol/control/Control';
import Overlay from 'ol/Overlay';
import { animate, spring } from 'motion';
import { marks } from './data/marks';
import {
  entityInfo,
  entityClusterLayers,
  updateClusterDistance,
  forceDisperseAtMaxZoom,
  updateCurrentZoom,
  refresh,
} from './data/entity';
import { areaNameLayer, loadTextPoints } from './data/locations';
import { defaults as interactionDefaults } from 'ol/interaction';
import { guides } from './data/guides';
import { type PointData } from './data/points';

const popupContainer = ref<HTMLElement>();
const isPopupVisible = ref(false);
const controls = ref<HTMLElement>();
const zoomLevel = ref(3);
const showVideoInfo = ref(false);
const openSubPopup = ref(false);
const inputDirection = ref<'vertical' | 'horizontal'>('vertical');

// 媒体查询匹配器
let mediaQueryList: MediaQueryList | null = null;

// 媒体查询回调函数
const handleMediaQueryChange = (e: MediaQueryListEvent | MediaQueryList) => {
  // 当媒体查询状态变化时，更新方向
  inputDirection.value = e.matches ? 'vertical' : 'horizontal';
};

onMounted(async () => {
  // 检测当前屏幕是否匹配md断点
  mediaQueryList = window.matchMedia('(min-width: 768px)'); // 768px是md断点

  // 初始化方向
  inputDirection.value = mediaQueryList.matches ? 'vertical' : 'horizontal';

  // 监听屏幕大小变化
  mediaQueryList.addEventListener('change', handleMediaQueryChange);

  overlay = new Overlay({
    element: popupContainer.value,
    autoPan: false,
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

        // 使用closest方法找到最近的按钮元素
        const zoomInButton = target.closest('#zoomIn');
        const zoomOutButton = target.closest('#zoomOut');

        if (zoomInButton && view) {
          view.cancelAnimations(); // 取消之前的动画
          const newZoom = zoom + 1 <= 5 ? zoom + 1 : 5;
          view.animate({ zoom: newZoom, duration: 400 });
          zoomLevel.value = newZoom;
        } else if (zoomOutButton && view) {
          view.cancelAnimations(); // 取消之前的动画
          const newZoom = zoom - 1 >= 0 ? zoom - 1 : 0;
          view.animate({ zoom: newZoom, duration: 400 });
          zoomLevel.value = newZoom;
        }
      });
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
      areaNameLayer,
      // 使用散开的图层代替单一聚合图层
      ...entityClusterLayers,
    ],
    view: new View({
      projection: simpleProjection,
      center: [100, 152], // 修复了多余的0
      zoom: 3,
      maxZoom: 5,
      minZoom: 1,
      rotation: 0,
      // extent: [-100, 0, 325, 344],
      // constrainResolution: true,
      enableRotation: false,
    }),
    interactions: interactionDefaults({
      altShiftDragRotate: false,
      pinchRotate: false,
    }),
    overlays: [overlay],
    controls: [zoomControl],
    // 添加renderBuffer以增加渲染边界,防止移动时标点消失
    pixelRatio: 2, // 提高像素比以提升移动中的渲染质量
  });

  // 监听地图渲染完成事件，确保图层正确添加
  map.once('rendercomplete', () => {
    // 刷新一次实体图层，确保显示状态正确
    refresh();
  });

  map.getView().on('change:resolution', function () {
    const zoom = map.getView().getZoom() || 0;
    zoomLevel.value = zoom;
    loadTextPoints(true, zoom > 3);

    // 更新聚合距离
    updateClusterDistance(zoom);

    // 更新当前缩放级别，这会触发图标大小的更新
    updateCurrentZoom(zoom);

    // 在最大缩放级别时强制禁用聚合
    if (zoom >= 5) {
      forceDisperseAtMaxZoom(zoom);
    }
  });

  const selectInteraction = new Select({
    condition: click,
    style: null,
    layers: () => true,
  });

  map.addInteraction(selectInteraction);

  map.on('click', function (event) {
    console.log(event.coordinate);
  });

  selectInteraction.on('select', async function (event) {
    const target = event.selected[0];
    if (target) {
      // 检查是否是聚合点
      const features = target.get('features');
      if (features && features.length > 1) {
        // 处理聚合点击 - 放大地图或显示聚合列表
        const extent = target.getGeometry()?.getExtent();
        if (extent) {
          // 放大到聚合范围
          map.getView().fit(extent, {
            duration: 500,
            padding: [50, 50, 50, 50],
            maxZoom: 5,
          });
        }
        return;
      }

      // 获取单个点的数据
      let data = target.get('payload');
      // 如果是聚合中的单个点，需要从features中获取
      if (features && features.length === 1) {
        data = features[0].get('payload');
      }

      if (!data) return;
      // ...原来的点击处理逻辑...
      const newPosition = event.mapBrowserEvent.coordinate;
      const positionChanged =
        !currentPosition ||
        newPosition[0] !== currentPosition[0] ||
        newPosition[1] !== currentPosition[1];

      if (positionChanged) {
        if (isPopupVisible.value) {
          // 使用新函数处理弹出层关闭和重新打开
          await closeAndReopenPopup(data, newPosition);
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
});

// 组件卸载前移除事件监听器，防止内存泄漏
onBeforeUnmount(() => {
  if (mediaQueryList) {
    mediaQueryList.removeEventListener('change', handleMediaQueryChange);
  }
});

const simpleProjection = new Projection({
  code: 'SIMPLE',
  units: 'pixels',
  extent: [0, 0, 256, 256],
});

const transparentBase64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/2+L6n0AAAAASUVORK5CYII=';
const entity = ref<PointData>({
  sceneId: '',
  seq: 1,
  entityDataIdKey: '',
  position: { x: 0, y: 0, z: 0 },
});

let overlay: Overlay;
let currentPosition: number[] | undefined;
let isPopupAnimating = false; // 添加标志位跟踪动画状态
const closeToast = () => {
  isPopupVisible.value = false;
  showVideoInfo.value = false; // 重置显示状态
  currentPosition = undefined;
};

// 添加一个函数用于处理弹出层的关闭和重新打开
const closeAndReopenPopup = async (data: PointData, newPosition: number[]) => {
  // 关闭当前弹出层
  isPopupVisible.value = false;

  // 等待关闭动画完成 (大约300ms)
  await new Promise(resolve => setTimeout(resolve, 350));

  // 更新实体数据
  entity.value = data;
  showVideoInfo.value = false;

  // 保存新位置
  currentPosition = [...newPosition];

  // 设置弹出层位置
  overlay.setPosition(newPosition);

  // 调整地图中心位置，然后显示弹出层
  await adjustMapForPopup(map, newPosition, () => {
    isPopupVisible.value = true;
  });
};

let map: Map; // 全局存储地图实例，方便后续访问

// 将 adjustMapForPopup 函数移到这里，使其在整个组件中可用
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

  // 设置标志位，避免同时触发多次调整
  isPopupAnimating = true;

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
      isPopupAnimating = false; // 重置标志位
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
          // 动画完成后使用requestAnimationFrame，确保地图渲染完成
          requestAnimationFrame(() => {
            isPopupAnimating = false; // 重置标志位
            resolve();
          });
        }
      );
    });

    if (callback) callback();
  } else {
    // 如果不需要移动地图，直接重置标志位并调用回调
    isPopupAnimating = false;
    if (callback) callback();
  }
}

// 优化的toggleVideoInfo函数
const toggleVideoInfo = (show: boolean) => {
  showVideoInfo.value = show;

  // 切换内容后不立即调整位置，让过渡动画完成后再调整
  // 内容切换的位置调整将通过onTransitionEnd函数来处理
};

// 添加动画效果函数
async function onEnterPopup(el: Element, onComplete: () => void) {
  isPopupAnimating = true; // 标记动画开始
  el.setAttribute('style', 'transform: scaleY(0.5); opacity: 0;');
  await animate(
    el,
    {
      scaleY: 1,
      opacity: 1,
    },
    { duration: 0.4, type: spring, bounce: 0.25 }
  );
  isPopupAnimating = false; // 标记动画结束

  // 动画完成后才调整位置
  if (isPopupVisible.value && currentPosition) {
    adjustPopupPosition(true);
  }

  onComplete();
}

async function onLeavePopup(el: Element, onComplete: () => void) {
  openSubPopup.value = false; // 关闭子弹窗
  isPopupAnimating = true; // 标记动画开始
  await animate(
    el,
    {
      scaleY: 0.5,
      opacity: 0,
    },
    { duration: 0.3, type: spring, bounce: 0.25 }
  );
  isPopupAnimating = false; // 标记动画结束
  onComplete();
}

// 监听弹窗内容过渡动画结束
function onTransitionEnd(event: TransitionEvent) {
  // 只在 popup-slider 的 transform 过渡结束后调整位置
  if (
    event.propertyName === 'transform' &&
    event.target &&
    (event.target as HTMLElement).classList.contains('popup-slider') &&
    isPopupVisible.value &&
    !isPopupAnimating // 确保不在主动画过程中
  ) {
    // console.log('Transition ended, adjusting position');
    adjustPopupPosition(true); // 传入true表示强制调整
  }
}

function toggleSubPopup() {
  openSubPopup.value = !openSubPopup.value;

  // 在状态改变后等待过渡动画完成，然后调整位置
  setTimeout(() => {
    if (isPopupVisible.value && currentPosition) {
      adjustPopupPosition(true);
    }
  }, 550);
}

// 改进的调整弹窗位置函数 - 用于在内容变化后重新检查位置
function adjustPopupPosition(forceAdjust = false) {
  if (!currentPosition || !popupContainer.value || !map || isPopupAnimating)
    return;

  // 获取当前弹窗的实际尺寸
  const popupRect = popupContainer.value.getBoundingClientRect();
  const mapRect = map.getTargetElement().getBoundingClientRect();

  // 检查弹窗是否超出视口边界
  let needAdjust = forceAdjust; // 如果强制调整，则始终进行调整
  let adjustX = 0;
  let adjustY = 0;

  // 增大安全边距以确保弹窗完全可见
  const safeMargin = 30;

  // 如果子弹窗展开，增加右侧检查的边界
  const extraRightMargin = openSubPopup.value ? 300 : 0; // 子弹窗宽度估计

  // 检查是否超出边界
  if (popupRect.left < mapRect.left + safeMargin) {
    needAdjust = true;
    adjustX = mapRect.left + safeMargin - popupRect.left;
  }

  // 右侧检查时考虑子弹窗宽度
  if (popupRect.right + extraRightMargin > mapRect.right - safeMargin) {
    needAdjust = true;
    adjustX = mapRect.right - safeMargin - (popupRect.right + extraRightMargin);
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
    // 如果子弹窗展开，增加右侧的额外偏移
    const extraX =
      adjustX !== 0
        ? Math.sign(adjustX) *
          (extraOffset + (openSubPopup.value && adjustX < 0 ? 30 : 0))
        : 0;
    const extraY = adjustY !== 0 ? Math.sign(adjustY) * extraOffset : 0;

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

const onSlideChange = (newValue: number) => {
  const view = map.getView();
  view?.cancelAnimations(); // 取消之前的动画
  view?.setZoom(newValue);
};

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
  $border-color: rgba(206, 206, 206, 0.5);
  $border-size: 0.2em;
  // filter: drop-shadow(1.6em -0.5em 0 #f8f753)
  //   drop-shadow(0 $border-size 0 $border-color)
  //   drop-shadow(0 calc(0px - $border-size) 0 $border-color)
  //   drop-shadow($border-size 0 0 $border-color)
  //   drop-shadow(calc(0px - $border-size) 0 0 $border-color);
  // transition: filter 0.5s ease;
  .pop-drop {
    transition: top 0.5s ease, right 0.5s ease, width 0.5s ease;
    filter: drop-shadow(0 $border-size 0 $border-color)
      drop-shadow(0 calc(0px - $border-size) 0 $border-color)
      drop-shadow($border-size 0 0 $border-color)
      drop-shadow(calc(0px - $border-size) 0 0 $border-color);
    &.unfold {
      width: 75%;
      top: 0;
      right: calc(-75% - 0.5em);
    }
  }

  .pop-content {
    transition: top 0.5s ease, right 0.5s ease;
    filter: drop-shadow(0 $border-size 0 $border-color)
      drop-shadow(0 calc(0px - $border-size) 0 $border-color)
      drop-shadow($border-size 0 0 $border-color)
      drop-shadow(calc(0px - $border-size) 0 0 $border-color)
      drop-shadow(0 0 0.4em rgba(0, 0, 0, 0.5));
  }

  &.v-enter-from,
  &.v-leave-to {
    opacity: 0;
    transform: scaleY(0.5);
    .pop-drop {
      right: 0;
      top: 0;
    }
  }
}

.top-bar {
  $height: 0.7rem;
  $clip: polygon(0% 0%, calc(100% - $height) 0%, 100% 100%, 0% 100%);
  height: $height;
  -webkit-clip-path: $clip;
  clip-path: $clip;
  margin-bottom: -0.01em;
}

.popup-content-container {
  position: relative;
  width: 100%;
  overflow: hidden;

  .popup-slider {
    display: flex;
    width: 200%;
    transition: transform 0.3s ease-in-out;
  }

  .slide-to-video {
    transform: translateX(-50%);
  }

  .popup-page {
    width: 50%;
    flex-shrink: 0;
    position: relative;
  }
}

/* 添加聚合点样式 */
.cluster-point {
  transition: transform 0.3s ease;
}

.cluster-point:hover {
  transform: scale(1.1);
}

/* 为所有地图标点添加悬停放大效果 */
.hover-point {
  transition: transform 0.3s ease;
}

.hover-point:hover {
  transform: scale(1.1);
}

/* 为集群容器添加悬停效果 */
.cluster-container .ol-style-icon,
.cluster-container .ol-style-circle {
  transition: transform 0.3s ease;
}

.cluster-container .ol-style-icon:hover,
.cluster-container .ol-style-circle:hover {
  transform: scale(1.1);
}

/* 添加对单点图标的支持 */
.ol-style-icon {
  transition: transform 0.3s ease;
}

.ol-style-icon:hover {
  transform: scale(1.1);
}
</style>
