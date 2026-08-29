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
  images: string[];
  layer_map: string;
  video_links: string[];
  visible: string;
  refreshable: '' | '是' | '否';
}