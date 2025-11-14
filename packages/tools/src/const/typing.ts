import type { MapIndex } from "./data";

export type { Coordinate } from "ol/coordinate";

export type DataState<T> = {
    [key in MapIndex]: T;
}