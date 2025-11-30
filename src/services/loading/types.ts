export enum LoadingStageId {
  INIT = 'INIT',
  I18N = 'I18N',
  STORAGE = 'STORAGE',
  COMPONENTS = 'COMPONENTS',
  MAP_ADAPTER = 'MAP_ADAPTER',
  MAP_RENDER = 'MAP_RENDER',
  ENTITY_RENDER = 'ENTITY_RENDER',
}

export interface LoadingState {
  totalProgress: number;
  displayProgress: number;
  currentStage: LoadingStageId;
  isComplete: boolean;
}

export interface StageConfig {
  id: LoadingStageId;
  weight: number;
  label: string;
}

export interface LoadingStage {
  progress: number;
  completed: boolean;
}