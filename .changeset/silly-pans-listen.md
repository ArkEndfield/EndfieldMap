---
'@endfieldmap/tools': patch
'@endfieldmap/map-service': patch
'@endfieldmap/storage-web': patch
---

修复首屏加载卡死三处根因：JSONLoader 与 ServerService 的 fetch 增加超时兜底（挂起连接原本会让加载页无限期卡住，重试逻辑无法轮转）；WebStorageAdapter.getItem 对损坏的 localStorage 值改为丢弃回退默认，不再于模块求值期抛错导致整站卡在加载页。
