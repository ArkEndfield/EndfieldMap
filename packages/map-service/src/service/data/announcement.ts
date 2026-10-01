import { Announcement, AnnouncementBreif } from '@endfieldmap/map-service/@types/announcement';
import { ServerService } from '@endfieldmap/map-service/service/server';

export interface AnnouncementDataServiceConfig {
  serverService: ServerService;
}

/** V2 wire 形状：published_at 为 ISO 字符串且可缺省；列表包裹在 {announcements:[...]} */
interface AnnouncementWire {
  id: number;
  lang: string;
  category: string;
  title: string;
  version: string;
  content?: string;
  link?: string;
  published_at?: string;
}

function isoToUnix(s?: string): number {
  if (!s) return 0;
  const t = Date.parse(s);
  return Number.isNaN(t) ? 0 : Math.floor(t / 1000);
}

function toBreif(w: AnnouncementWire): AnnouncementBreif {
  return {
    id: w.id,
    lang: w.lang,
    published_at: isoToUnix(w.published_at),
    category: w.category,
    title: w.title,
    version: w.version,
  };
}

export class AnnouncementDataService {
  private serverService: ServerService;

  constructor(config: AnnouncementDataServiceConfig) {
    this.serverService = config.serverService;
  }

  public async loadAnnouncementList(options?: RequestInit): Promise<AnnouncementBreif[]> {
    const data = await this.serverService.apiGet<{ announcements: AnnouncementWire[] }>(
      '/announcements',
      undefined,
      options
    );
    return (data.announcements ?? []).map(toBreif);
  }

  public async loadAnnouncementDetail(id: number, options?: RequestInit): Promise<Announcement> {
    const w = await this.serverService.apiGet<AnnouncementWire>(`/announcements/${id}`, undefined, options);
    return {
      ...toBreif(w),
      content: w.content ?? '',
      link: w.link ?? '',
    };
  }
}
