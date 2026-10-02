# node-forge 签名校验补丁

`node-forge@1.4.0.patch` 对 Expo 工具链间接依赖的 RSA PKCS#1 v1.5 校验增加
DigestAlgorithm 子元素数量检查，改动来自上游 [PR #1152](https://github.com/digitalbazaar/forge/pull/1152)。
[GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) 当前没有已发布修复版本。

补丁由 `pnpm-workspace.yaml` 注册，锁文件保存补丁哈希；使用 pnpm 11.1.3 安装时自动应用。
`pnpm audit` 按版本匹配公告，仍会报告 1.4.0 的告警。验证补丁应运行
`node --test scripts/forge-signature.test.cjs`，同时检查正常签名可通过、额外嵌套元素被拒绝。
上游发布修复版本后，再升级依赖并移除本补丁。
