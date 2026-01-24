import { Feature, Map, View } from 'ol';
import { LineString, Point, Polygon } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';

export type { Coordinate } from 'ol/coordinate';

export const MapOL = {
  Feature,
  Map,
  View,
  geom: {
    LineString,
    Point,
    Polygon,
  },
  layer: {
    Vector: VectorLayer,
  },
  source: {
    Vector: VectorSource,
  },
  style: {
    Circle: CircleStyle,
    Fill,
    Stroke,
    Style,
  },
};
