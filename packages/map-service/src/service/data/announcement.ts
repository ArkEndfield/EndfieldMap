import { Announcement, AnnouncementBreif } from '@endfieldmap/map-service/@types/announcement';
import { ServerService } from '@endfieldmap/map-service/service/server';
import { observable } from 'mobx';

export interface AnnouncementDataServiceConfig {
  serverService: ServerService;
}

export class AnnouncementDataService {
  @observable
  accessor list: AnnouncementBreif[] = [];

  @observable
  accessor listLoading: boolean = false;

  @observable
  accessor listError: Error | null = null;

  @observable
  accessor detail: Announcement | null = null;

  @observable
  accessor detailLoading: boolean = false;

  @observable
  accessor detailError: Error | null = null;

  private serverService: ServerService;

  constructor(config: AnnouncementDataServiceConfig) {
    this.serverService = config.serverService;
  }

  public async loadAnnouncementList(pageSize: number = 10, page: number = 1): Promise<void> {
    this.listLoading = true;
    this.listError = null;
    this.list = [];
    try {
      const data = await this.serverService.apiGet<AnnouncementBreif[]>('/announcements', {
        limit: pageSize,
        page: page,
      });
      if (data) {
        this.list = data;
      } else {
        throw new Error('Failed to load announcement list');
      }
    } catch (error) {
      this.listError = error as Error;
    } finally {
      this.listLoading = false;
    }
  }

  public async loadAnnouncementDetail(id: number): Promise<void> {
    this.detailLoading = true;
    this.detailError = null;
    this.detail = null;
    try {
      const data = await this.serverService.apiGet<Announcement>(`/announcements/${id}`);
      if (data) {
        this.detail = data;
      } else {
        throw new Error('Failed to load announcement detail');
      }
    } catch (error) {
      this.detailError = error as Error;
    } finally {
      this.detailLoading = false;
    }
  }
}
