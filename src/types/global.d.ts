// 为TypeScript声明全局变量
declare global {
  interface Window {
    APP_LOADED?: () => void;
    APP_LOADED_CALLED?: boolean;
  }
}

export {};
