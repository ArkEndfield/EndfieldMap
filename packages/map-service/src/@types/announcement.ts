/**
 * @description: 公告摘要内容
 */
export interface AnnouncementBreif {
  /** 公告id */
  id: number;
  /** 公告语言 */
  lang: string;
  /** 公告发布时间 */
  published_at: number;
  /** 公告标题 */
  title: string;
  /** 公告版本 */
  version: string;
}

export interface Announcement extends AnnouncementBreif {
  /** 公告内容 */
  content: string;
  /** 公告链接 */
  link: string;
}
