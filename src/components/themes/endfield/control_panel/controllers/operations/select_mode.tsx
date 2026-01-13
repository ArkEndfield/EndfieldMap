import { SideButton } from '@themes/endfield/control_panel/controllers/mobile/side_button';
import ToggleButton from '@/components/themes/endfield/control_panel/components/toggle_button';
import Tooltip from '@themes/endfield/components/tooltip';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { alert } from '@/components/common/alert/alert_api';
import { useAdapter } from '@/hooks/use_adapter';
import { useIsMobile } from '@/hooks/use_is_mobile';
import uiManager from '@/services/ui_manager';

const MultiOperationIcon = ({ children }: { children?: React.ReactNode }) => (
  <svg width="100%" viewBox="0 0 100 92" fill="none" xmlns="http://www.w3.org/2000/svg">
    <mask
      id="path-1-outside-1_390_28"
      maskUnits="userSpaceOnUse"
      x="1.43511"
      y="-0.962779"
      width="73"
      height="53"
      fill="black"
    >
      <rect fill="white" x="1.43511" y="-0.962779" width="73" height="53" />
      <path d="M67.2984 11.5655L31.8121 40.6954L27.4068 44.4103L9.43511 23.09L13.9146 19.3136L28.1099 36.1544L63.5816 7.03722L67.2984 11.5655Z" />
    </mask>
    <path
      d="M67.2984 11.5655L70.4708 15.4302L74.3353 12.258L71.1632 8.39332L67.2984 11.5655ZM31.8121 40.6954L28.6396 36.8307L28.6141 36.8517L28.5888 36.8731L31.8121 40.6954ZM27.4068 44.4103L23.5838 47.6328L26.807 51.4565L30.6301 48.2326L27.4068 44.4103ZM9.43511 23.09L6.21235 19.2672L2.38976 22.4897L5.61212 26.3125L9.43511 23.09ZM13.9146 19.3136L17.7376 16.0911L14.5149 12.2678L10.6918 15.4908L13.9146 19.3136ZM28.1099 36.1544L24.2869 39.3769L27.4676 43.1504L31.2823 40.0191L28.1099 36.1544ZM63.5816 7.03722L67.4464 3.865L64.2741 -3.88973e-08L60.4092 3.17251L63.5816 7.03722ZM67.2984 11.5655L64.126 7.70086L28.6396 36.8307L31.8121 40.6954L34.9845 44.5601L70.4708 15.4302L67.2984 11.5655ZM31.8121 40.6954L28.5888 36.8731L24.1835 40.5879L27.4068 44.4103L30.6301 48.2326L35.0353 44.5178L31.8121 40.6954ZM27.4068 44.4103L31.2298 41.1877L13.2581 19.8674L9.43511 23.09L5.61212 26.3125L23.5838 47.6328L27.4068 44.4103ZM9.43511 23.09L12.6579 26.9128L17.1374 23.1364L13.9146 19.3136L10.6918 15.4908L6.21235 19.2672L9.43511 23.09ZM13.9146 19.3136L10.0916 22.5361L24.2869 39.3769L28.1099 36.1544L31.933 32.9319L17.7376 16.0911L13.9146 19.3136ZM28.1099 36.1544L31.2823 40.0191L66.754 10.9019L63.5816 7.03722L60.4092 3.17251L24.9375 32.2897L28.1099 36.1544ZM63.5816 7.03722L59.7167 10.2094L63.4335 14.7378L67.2984 11.5655L71.1632 8.39332L67.4464 3.865L63.5816 7.03722Z"
      fill="currentColor"
      mask="url(#path-1-outside-1_390_28)"
    />
    <mask
      id="path-3-outside-2_390_28"
      maskUnits="userSpaceOnUse"
      x="24.202"
      y="8.87076"
      width="73"
      height="53"
      fill="black"
    >
      <rect fill="white" x="24.202" y="8.87076" width="73" height="53" />
      <path d="M90.0652 21.3991L54.5789 50.529L50.1736 54.2438L32.202 32.9235L36.6815 29.1471L50.8768 45.988L86.3484 16.8708L90.0652 21.3991Z" />
    </mask>
    <path
      d="M90.0652 21.3991L93.2377 25.2638L97.1021 22.0915L93.9301 18.2269L90.0652 21.3991ZM54.5789 50.529L51.4065 46.6643L51.3809 46.6853L51.3556 46.7066L54.5789 50.529ZM50.1736 54.2438L46.3507 57.4663L49.5738 61.2901L53.3969 58.0662L50.1736 54.2438ZM32.202 32.9235L28.9792 29.1007L25.1566 32.3233L28.379 36.146L32.202 32.9235ZM36.6815 29.1471L40.5045 25.9246L37.2818 22.1013L33.4587 25.3243L36.6815 29.1471ZM50.8768 45.988L47.0537 49.2104L50.2345 52.984L54.0491 49.8527L50.8768 45.988ZM86.3484 16.8708L90.2133 13.6985L87.0409 9.83354L83.1761 13.006L86.3484 16.8708ZM90.0652 21.3991L86.8928 17.5344L51.4065 46.6643L54.5789 50.529L57.7513 54.3936L93.2377 25.2638L90.0652 21.3991ZM54.5789 50.529L51.3556 46.7066L46.9504 50.4215L50.1736 54.2438L53.3969 58.0662L57.8022 54.3513L54.5789 50.529ZM50.1736 54.2438L53.9966 51.0213L36.025 29.701L32.202 32.9235L28.379 36.146L46.3507 57.4663L50.1736 54.2438ZM32.202 32.9235L35.4247 36.7463L39.9042 32.9699L36.6815 29.1471L33.4587 25.3243L28.9792 29.1007L32.202 32.9235ZM36.6815 29.1471L32.8584 32.3696L47.0537 49.2104L50.8768 45.988L54.6998 42.7655L40.5045 25.9246L36.6815 29.1471ZM50.8768 45.988L54.0491 49.8527L89.5208 20.7355L86.3484 16.8708L83.1761 13.006L47.7044 42.1232L50.8768 45.988ZM86.3484 16.8708L82.4836 20.043L86.2004 24.5713L90.0652 21.3991L93.9301 18.2269L90.2133 13.6985L86.3484 16.8708Z"
      fill="currentColor"
      fillOpacity="0.58"
      mask="url(#path-3-outside-2_390_28)"
    />
    <text
      fill="currentColor"
      xmlSpace="preserve"
      className="whitespace-pre"
      fontSize="22"
      fontWeight="900"
      letterSpacing="0em"
    >
      <tspan x="6" y="85.9835">
        {children}
      </tspan>
    </text>
  </svg>
);

export const SelectModeOperation = observer(() => {
  const { adapter, dataService } = useAdapter();
  const isSelecting = adapter.mapController.selection.isSelecting;
  const { t } = useTranslation('sidebar');
  const isMobile = useIsMobile();

  const toggleSelectMode = () => {
    if (!isSelecting && dataService.electricPoleDataService.isInElectricOperateMode) {
      alert.info(t('operation.electric_pole_operating_tip'));
      return;
    }
    if (!isSelecting && dataService.customPointDataService.isInCustomPointOperateMode) {
      alert.info(t('operation.custom_point_operating_tip'));
      return;
    }
    if (!adapter.mapController.selection.isSelecting) uiManager.closeAllManagers();
    adapter.mapController.selection.toggleSelecting();
    adapter.activeFeatureController.clearActiveFeature();
  };

  return (
    <>
      {isMobile ? (
        <SideButton onClick={toggleSelectMode} position="right">
          <MultiOperationIcon>
            {isSelecting ? t('operation.cancel_operation') : t('operation.multi_operation')}
          </MultiOperationIcon>
        </SideButton>
      ) : (
        <Tooltip tooltip={t('operation.multi_operation')} placement="top">
          <ToggleButton value={isSelecting} className="text-lg w-8 h-8" onChange={toggleSelectMode}>
            <MultiOperationIcon />
          </ToggleButton>
        </Tooltip>
      )}
    </>
  );
});
