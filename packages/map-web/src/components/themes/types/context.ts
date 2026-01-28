import type { MapDataService } from '@/services/data/map';

export interface ThemeRootContextProps {
  mapDataService: MapDataService;
  children: React.ReactNode;
}
