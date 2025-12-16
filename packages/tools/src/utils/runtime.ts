export const isDev =
  process.env.NODE_ENV === 'development' || new URLSearchParams(window.location.search).get('__DEV__') === 'true';
