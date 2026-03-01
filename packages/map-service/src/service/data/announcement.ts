import { Announcement, AnnouncementBreif } from '@endfieldmap/map-service/@types/announcement';
import { ServerService } from '@endfieldmap/map-service/service/server';

export interface AnnouncementDataServiceConfig {
  serverService: ServerService;
}

export class AnnouncementDataService {
  private serverService: ServerService;

  constructor(config: AnnouncementDataServiceConfig) {
    this.serverService = config.serverService;
  }

  public loadAnnouncementList(options?: RequestInit) {
    return this.serverService.apiGet<AnnouncementBreif[]>('/announcements', undefined, options);
  }

  public async loadAnnouncementDetail(id: number, options?: RequestInit) {
    return this.serverService.apiGet<Announcement>(`/announcements/${id}`, undefined, options);
  }
}
