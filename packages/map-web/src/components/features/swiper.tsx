import { observer } from 'mobx-react-lite';

import { Swiper } from '@/components/common/swiper';
import uiManager from '@/services/ui_manager';
import { service } from '@/services';

const ZmdSwiper = observer(() => {
  const expanded = uiManager.swiperOpen.value;
  const swiperConfig = service.dataService.swiperDataService.swiperConfig;
  return (
    <Swiper config={swiperConfig} expanded={expanded} className="fixed right-0 h-28 md:h-36 bottom-11 md:bottom-12" />
  );
});

export default ZmdSwiper;
