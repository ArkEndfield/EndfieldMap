import type { DataService } from '@/services/data';

export interface ThemeRootContextProps {
  dataService: DataService;
  children: React.ReactNode;
}
