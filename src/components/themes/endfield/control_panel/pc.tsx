// import TitleArrow from '@themes/endfield/control_panel/controllers/arrow';
// import { Operations } from '@themes/endfield/control_panel/controllers/operations';
import { CurrentOperatePanel } from '@themes/endfield/const/ui';
import { FoldButton } from '@themes/endfield/control_panel/components/fold_button';
import { Panel } from '@themes/endfield/control_panel/components/panel';
import { FilterAndEntityPanelPC } from '@themes/endfield/control_panel/controllers/filter_and_entity_panel.pc';
// import { useRef } from 'react';
// import { HeaderLogo } from '@/components/common/header_logo';
import { useEndfieldUIManager } from '@themes/endfield/hooks/ui_manager';
import { observer } from 'mobx-react-lite';

import { cn } from '@/utils/style';
// import uiManager from '@/services/ui_manager';

// const PCControlPanel = observer(() => {
//   const portalRef = useRef<HTMLDivElement>(null);
//   const isOpen = uiManager.sidebarCollapsed.value;

//   return (
//     <motion.div
//       initial={{ x: '-100%' }}
//       animate={{ x: isOpen ? 0 : '-100%' }}
//       transition={{ type: 'tween', bounce: 0.25, duration: 0.1 }}
//       className="fixed left-0 top-14 bottom-0 w-86 flex flex-col text-white"
//     >
//       <TopDeco />

//       <div className="absolute left-0 top-6 z-0">
//         <TitleArrow
//           open={isOpen}
//           onToggle={() => (uiManager.sidebarCollapsed.value = !uiManager.sidebarCollapsed.value)}
//         />
//       </div>
//       <div className="absolute pl-8 pr-8 shrink-0 grow-0 w-full top-3 z-1">
//         <HeaderLogo className="z-1 relative" />
//       </div>
//       <div className="bg-[#272727] border-r-[0.45em] border-r-[#5a5b5a] flex-1 flex flex-col overflow-y-hidden">
//         <div className="px-3 overflow-hidden shrink-0 grow-0 mt-1 space-y-1 pt-28">
//           <Filters />
//           <Operations portalRef={portalRef} />
//         </div>
//         <div className="flex-1 relative overflow-hidden" ref={portalRef}>
//           <ScrollArea className="w-full h-full">
//             <EntityPanel />
//           </ScrollArea>
//         </div>

//         <div className="shrink-0 grow-0 p-2 text-sm text-center text-[#b9b9b9]">
//           <a href="https://beian.miit.gov.cn/" target="_blank">
//             黑ICP备2025036958号-1
//           </a>
//         </div>
//       </div>
//     </motion.div>
//   );
// });

// export default PCControlPanel;

const PCControlPanel = observer(() => {
  const uiManager = useEndfieldUIManager();
  const currentOperatePanel = uiManager.currentOperatePanel.value;
  const isNoneCurrentPanel = currentOperatePanel === CurrentOperatePanel.NONE;
  const isOpen = uiManager.operatePanelOpen.value && !isNoneCurrentPanel;
  const shouldPanelOpen = (panel: CurrentOperatePanel) => {
    return isOpen && currentOperatePanel === panel;
  };
  return (
    <>
      <FoldButton
        className={cn('fixed top-18 left-0 transition-transform', isNoneCurrentPanel && '-translate-x-full delay-250')}
        open={isOpen}
        onToggle={() => (uiManager.operatePanelOpen.value = !isOpen)}
      />
      <div className={cn('fixed top-23 left-4 text-white')}>
        <div
          className={cn(
            'relative grid',
            'before:absolute before:left-0 before:top-0 before:w-0.5 before:h-full before:bg-[#eee]/20'
          )}
        >
          <Panel open={shouldPanelOpen(CurrentOperatePanel.FILTER)}>
            <FilterAndEntityPanelPC />
          </Panel>
          <Panel open={shouldPanelOpen(CurrentOperatePanel.CUSTOM_POINT)}>234</Panel>
        </div>
      </div>
    </>
  );
});

export default PCControlPanel;
