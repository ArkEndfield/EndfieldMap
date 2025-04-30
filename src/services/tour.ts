import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import i18n from '@/i18n';
import { showCultivationMaterial } from '@/data/entity';
import settings from '@/data/settings';
import { MarkerManager } from './markerManager';
import { popupManager } from './map';
import { LOCAL_STORAGE_KEY } from '@/constants/db_key';
import { rafTimeout } from '@/utils/animationTimer';
import '@/styles/tour.scss';

const KEY = LOCAL_STORAGE_KEY.SHOW_TOUR_ALERT;

export const tour = driver({
  showProgress: true,
  nextBtnText: i18n.global.t('tour.next'),
  prevBtnText: i18n.global.t('tour.prev'),
  doneBtnText: i18n.global.t('tour.done'),
  allowClose: false,
  showButtons: ['next', 'previous', 'close'],
  popoverClass: 'arknights-tour',
  animate: true,
  onNextClick() {
    if (showCultivationMaterial.value) showCultivationMaterial.value = false;
    tour.moveNext();
  },
  onCloseClick() {
    localStorage.setItem(KEY, 'true');
  },
  steps: [
    {
      element: '#sidebar',
      popover: {
        title: i18n.global.t('tour.sidebar.title'),
        description: i18n.global.t('tour.sidebar.description'),
        side: 'right',
        align: 'center',
      },
      onHighlightStarted() {
        if (!settings.value.sidebarExpanded)
          settings.value.sidebarExpanded = true;
      },
    },
    {
      element: '#select-item',
      popover: {
        title: i18n.global.t('tour.select_item.title'),
        description: i18n.global.t('tour.select_item.description'),
      },
    },
    {
      element: '#select-item-title',
      popover: {
        title: i18n.global.t('tour.select_item_title.title'),
        description: i18n.global.t('tour.select_item_title.description'),
      },
    },
    {
      element: '#select-item-icon',
      popover: {
        title: i18n.global.t('tour.select_item_icon_button.title'),
        description: i18n.global.t('tour.select_item_icon_button.description'),
      },
    },
    {
      element: '#sidebar-operate-buttons',
      popover: {
        title: i18n.global.t('tour.sidebar_operate_buttons.title'),
        description: i18n.global.t('tour.sidebar_operate_buttons.description'),
      },
    },
    {
      element: '#character-filter',
      popover: {
        title: i18n.global.t('tour.character_filter.title'),
        description: i18n.global.t('tour.character_filter.description'),
      },
    },
    {
      element: '#mark-filter-buttons',
      popover: {
        title: i18n.global.t('tour.mark_filter.title'),
        description: i18n.global.t('tour.mark_filter.description'),
      },
    },
    {
      element: '#fold-arrow',
      popover: {
        title: i18n.global.t('tour.folder_button.title'),
        description: i18n.global.t('tour.folder_button.description'),
        onNextClick() {
          if (settings.value.sidebarExpanded)
            settings.value.sidebarExpanded = false;
          tour.moveNext();
        },
        onPrevClick() {
          if (!settings.value.sidebarExpanded)
            settings.value.sidebarExpanded = true;
          tour.movePrevious();
        },
      },
    },
    {
      element: '#change-map',
      popover: {
        title: i18n.global.t('tour.change_map.title'),
        description: i18n.global.t('tour.change_map.description'),
      },
    },
    {
      element: '#map',
      popover: {
        title: i18n.global.t('tour.popup.title'),
        description: i18n.global.t('tour.popup.description'),
        side: 'left',
        align: 'center',
      },
      onHighlightStarted() {
        console.log('开始处理弹窗展示');
        const chestFeatures = MarkerManager.getMarkersByCategory('chest');
        console.log('找到的宝箱标点数量:', chestFeatures.length);

        if (chestFeatures.length === 0) {
          console.warn('未找到任何宝箱标点');
          return;
        }

        const chestFeature = chestFeatures[0]; // 使用第一个宝箱标点
        if (chestFeature && popupManager.value) {
          popupManager.value.openPopupForMarker(chestFeature);
        } else {
          console.log('没有找到宝箱标点或弹窗管理器未初始化');
        }
      },
    },
    {
      element: '#popup-content',
      popover: {
        title: i18n.global.t('tour.popup_content.title'),
        description: i18n.global.t('tour.popup_content.description'),
        side: 'left',
        align: 'center',
      },
    },
    {
      element: '#mark-obtained-switch',
      popover: {
        title: i18n.global.t('tour.mark_obtained.title'),
        description: i18n.global.t('tour.mark_obtained.description'),
        side: 'left',
        align: 'center',
      },
    },
    {
      element: '#sub-popup-button',
      popover: {
        title: i18n.global.t('tour.sub_popup.title'),
        description: i18n.global.t('tour.sub_popup.description'),
        side: 'left',
        align: 'center',
        onNextClick() {
          popupManager.value?.toggleSubPopup();
          localStorage.setItem(KEY, 'true');
          tour.moveNext();
        },
      },
      onHighlightStarted() {
        // 确保主弹窗已经打开
        if (popupManager.value && !popupManager.value.isPopupVisible.value) {
          const chestFeatures = MarkerManager.getMarkersByCategory('chest');
          if (chestFeatures.length > 0) {
            popupManager.value.openPopupForMarker(chestFeatures[0]);
          }
        }
      },
    },
    {
      element: '#map',
      popover: {
        title: i18n.global.t('tour.custom_point.title'),
        description: i18n.global.t('tour.custom_point.description'),
        side: 'over',
        align: 'center',
      },
    },
  ],
});

export async function showTour() {
  if (!settings.value.sidebarExpanded) settings.value.sidebarExpanded = true;
  // 关闭手机弹窗
  settings.value.showMenuMenu = false;
  await new Promise(resolve => rafTimeout(resolve, 300));
  tour.drive();
}
