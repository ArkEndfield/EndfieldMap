export interface Coord {
  x: number;
  y: number;
}

export interface LevelData {
  chessBoardID: string;
  sizeX: number;
  sizeY: number;
  colorNum: number;
  rowCondition: Record<string, number[]>;
  columnCondition: Record<string, number[]>;
  bannedGrids: Coord[];
  preGrids: Record<string, Coord[]>;
  attachBlocks: BlockEntry[];
}

export interface BlockEntry {
  blockID: string;
  number: number;
  color: number;
  sortOrderId: number;
}

export interface PieceData {
  blockID: string;
  originBlocks: Coord[];
  resName: string;
}

export type Grid = number[][];
export type PieceShape = number[][];

export interface ObstacleData {
  type: 'counted' | 'uncounted';
  groupId: number;
}

export interface Group {
  id: number;
  name: string;
  color: string;
}

export interface PieceUI {
  id: string;
  shape: PieceShape;
  groupId: number;
}

export interface ParsedLevel {
  sizeX: number;
  sizeY: number;
  groups: Group[];
  rowConstraints: number[][];
  colConstraints: number[][];
  obstaclesFlat: (ObstacleData | null)[];
  pieces: PieceUI[];
}

export type PieceLoader = (blockId: string) => Promise<PieceData>;
