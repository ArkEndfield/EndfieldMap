import { MapOL } from '@endfieldmap/map-core';

export const getDevLayer = (map: InstanceType<typeof MapOL.Map>) => {
  let layer = map
    .getLayers()
    .getArray()
    .find((l) => l.get('name') === 'devToolsDrawLayer') as InstanceType<typeof MapOL.layer.Vector> | undefined;

  if (!layer) {
    layer = new MapOL.layer.Vector({
      source: new MapOL.source.Vector(),
      zIndex: 9999,
      properties: { name: 'devToolsDrawLayer' },
    });
    map.addLayer(layer);
  }
  return layer;
};
