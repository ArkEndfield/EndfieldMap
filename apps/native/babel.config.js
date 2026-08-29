module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { decorators: { version: "2023-11" } }],
    ],
    // jest 转译工作区包源码时需要（Metro/RN 原生支持 static block，不经过此插件）。
    env: {
      test: { plugins: ["@babel/plugin-transform-class-static-block"] },
    },
  };
};
