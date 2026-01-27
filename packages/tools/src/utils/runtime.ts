export const isDev =
  process.env.NODE_ENV === 'development' || new URLSearchParams(window.location.search).get('__DEV__') === 'true';

const timestamp = new Date().getTime().toString();

export const getVersionInfo = () => {
  let commitHash = timestamp,
    buildTime = timestamp;
  if (typeof __COMMIT_HASH__ !== 'undefined' && __COMMIT_HASH__) {
    commitHash = __COMMIT_HASH__;
  }
  if (typeof __BUILD_TIME__ !== 'undefined' && __BUILD_TIME__) {
    buildTime = __BUILD_TIME__;
  }
  return {
    commitHash,
    buildTime,
  };
};
