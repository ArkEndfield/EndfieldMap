import { BACKEND_URL } from "@/data/env";
import { swiperConfig } from "@/data/swiper";

const API_URL = new URL('/api/scroll', BACKEND_URL).toString();

export const loadSwiperData = async () => {
    try {
        const data = await fetch(API_URL).then(res => res.json());
        swiperConfig.value = data;
    } catch (error) {
        console.error("Failed to load swiper data:", error);
    }
}