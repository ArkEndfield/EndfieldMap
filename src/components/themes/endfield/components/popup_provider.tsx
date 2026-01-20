import { useState } from 'react';
import { PopupContext } from '@themes/endfield/context/popup';

const PopupProvider = ({ children }: { children: React.ReactNode }) => {
  const [showSubPopup, setShowSubPopup] = useState(false);
  return <PopupContext.Provider value={{ showSubPopup, setShowSubPopup }}>{children}</PopupContext.Provider>;
};

export default PopupProvider;
