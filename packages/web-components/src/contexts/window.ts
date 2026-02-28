import React, { createContext, useContext } from 'react';

const WindowContext = createContext<Window>(window);

export const WindowProvider = ({ window: targetWindow, children }: { window: Window; children: React.ReactNode }) => {
  return React.createElement(WindowContext.Provider, { value: targetWindow }, children);
};

export const useWindow = () => {
  return useContext(WindowContext);
};
