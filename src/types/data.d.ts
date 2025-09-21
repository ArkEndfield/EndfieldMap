import { LOCAL_STORAGE_KEY } from '@/constants/db_key';
import type { MarkInfo } from './marks';
import type { Language } from '@/i18n';
import type { PointData, CustomPointDataType } from './customPoints';
import type { EntityShowStates } from './entity';

export interface ElectricPoleConnection {
  poles: (string | number)[];
  lineGroupId: string;
}

export interface BackupData {
  version: string;
  db: {
    marks: MarkInfo;
    settings: Settings;
    customPoints: PointData[];
    customPointsData?: CustomPointDataType;
    entityShowStates: EntityShowStates;
    electricPoleConnections?: ElectricPoleConnection[];
  };
  storage: {
    [LOCAL_STORAGE_KEY.MAP]: string;
    [LOCAL_STORAGE_KEY.LANGUAGE]: Language | null;
  };
}
