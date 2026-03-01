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

  public loadAnnouncementList(pageSize: number = 10, page: number = 1, options?: RequestInit) {
    return this.serverService.apiGet<AnnouncementBreif[]>(
      '/announcements',
      {
        limit: pageSize,
        page: page,
      },
      options
    );
  }

  public async loadAnnouncementDetail(id: number, options?: RequestInit) {
    return this.serverService.apiGet<Announcement>(`/announcements/${id}`, undefined, options);
  }
}
