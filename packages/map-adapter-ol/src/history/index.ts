// Re-export from map-core
export { type Command, CommandType } from '@endfieldmap/map-core/history/command';
export { HistoryManager, historyManager } from '@endfieldmap/map-core/history/history_manager';

// OL-specific commands
export {
  BatchCreateCustomPointsCommand,
  BatchDeleteCustomPointsCommand,
  CreateCustomPointCommand,
  DeleteCustomPointCommand,
} from '@endfieldmap/map-adapter-ol/history/custom_point_commands';
export {
  AddDevToolsFeatureCommand,
  BatchAddDevToolsFeaturesCommand,
  BatchRemoveDevToolsFeaturesCommand,
  ClearDevToolsFeaturesCommand,
  type DevToolsControllerInterface,
  RemoveDevToolsFeatureCommand,
} from '@endfieldmap/map-adapter-ol/history/dev_tools_commands';
export {
  BatchCreateElectricPolesCommand,
  BatchDeleteElectricPolesCommand,
  CreateElectricPoleCommand,
  DeleteElectricPoleCommand,
} from '@endfieldmap/map-adapter-ol/history/electric_pole_commands';
