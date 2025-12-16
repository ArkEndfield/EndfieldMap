export const isDev =
  process.env.NODE_ENV === 'development' || new URL(window.location.href).searchParams.get('__DEV__') === 'true';
