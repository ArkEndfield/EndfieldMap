import { EntityInstanceKey, type EndfieldMapAdapter, type MapFeature } from '@endfieldmap/map-core';
import { OperationButton } from './_button';
import { observer } from 'mobx-react-lite';
import { createPortal } from 'react-dom';

const SelectOperator = observer(({ adapter }: { adapter: EndfieldMapAdapter }) => {
  const selectedFeatures = adapter.mapController.selection.selectedFeatures;

  const markFeatures = (marked: boolean) => {
    selectedFeatures.forEach((feature) => {
      const instance = feature.get(EntityInstanceKey) as MapFeature;
      instance.setMarked(marked);
    });
  };

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-lg p-4">
      <div className="text-sm text-gray-600">已选中: {selectedFeatures.length} 个对象</div>
      {selectedFeatures.length > 0 && (
        <div className="flex gap-2 mt-2">
          <button className="bg-blue-500 text-white px-2 py-1 rounded" onClick={() => markFeatures(true)}>
            标记
          </button>
          <button className="bg-red-500 text-white px-2 py-1 rounded" onClick={() => markFeatures(false)}>
            取消标记
          </button>
        </div>
      )}
      <button onClick={() => adapter.mapController.selection.stopSelecting()}>取消</button>
    </div>
  );
});

export const SelectModeOperation = observer(({ adapter }: { adapter: EndfieldMapAdapter }) => {
  const isSelecting = adapter.mapController.selection.isSelecting;
  const toggleSelectMode = () => {
    adapter.mapController.selection.toggleSelecting();
    adapter.activeFeatureController.clearActiveFeature();
  };
  return (
    <>
      <OperationButton
        title={isSelecting ? '取消操作' : '批量操作'}
        subtitle="MULTI OPERATION"
        onClick={toggleSelectMode}
      />
      {isSelecting && createPortal(<SelectOperator adapter={adapter} />, document.body)}
    </>
  );
});
