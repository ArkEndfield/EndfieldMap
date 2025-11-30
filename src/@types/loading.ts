import type { LoadingStageId } from "@/const/loading";

export interface LoadingState {
  totalProgress: number;
  displayProgress: number;
  currentStage: LoadingStageId;
  isComplete: boolean;
  error?: Error | null;
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
