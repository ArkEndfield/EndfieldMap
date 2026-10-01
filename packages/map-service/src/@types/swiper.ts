export interface SwiperData {
  id: number;
  image_url: string;
  link_url: string;

  /** 以下字段前端 UI 不消费；V2 起 start_at/end_at 为 ISO 字符串 */
  title?: string;
  remark?: string;
  sort_order?: number;
  status?: number;
  start_at?: string;
  end_at?: string;
}
