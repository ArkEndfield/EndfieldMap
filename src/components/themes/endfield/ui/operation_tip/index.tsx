import { SelectModeTip } from '@themes/endfield/ui/operation_tip/select_mode';
import { ElectricPoleOperationTip } from '@themes/endfield/ui/operation_tip/electric_pole';
import { CustomPointOperationTip } from '@themes/endfield/ui/operation_tip/custom_point';

const OperationTip = () => {
  return (
    <>
      <SelectModeTip />
      <ElectricPoleOperationTip />
      <CustomPointOperationTip />
    </>
  );
};

export default OperationTip;
