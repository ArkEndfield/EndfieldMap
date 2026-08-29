/** new 新结构 */
export interface GuideInfoBrief {
  area: string;
  description: string;
  internal_id: number;
  marker_type: string;
  progress: string;
  record_id: string;
}

export interface GuideInfo extends GuideInfoBrief {
  /** 端点实测可为 null（无图攻略）。 */
  images: string[] | null;
  layer_map: string;
  video_links: string[] | null;
  visible: string;
  refreshable: '' | '是' | '否';
}