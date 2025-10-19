export interface SwiperData {
    cid: number;
    cover: string;
    link: string;
    title: string;
    type: string;
}

export interface SwiperConfig {
    enable: boolean;
    list: Array<SwiperData>;
}