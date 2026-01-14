import { SelectModeTip } from '@/components/themes/endfield/operation_tip/select_mode';
import { ElectricPoleOperationTip } from '@/components/themes/endfield/operation_tip/electric_pole';
import { CustomPointOperationTip } from '@/components/themes/endfield/operation_tip/custom_point';

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
