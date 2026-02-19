import type { EntityInfoDataJson, EntityJsonDataList } from '@endfieldmap/map-core';
import type { CustomPointPreset, ElectricPolePreset } from '@endfieldmap/map-service';
import { observer } from 'mobx-react-lite';

import { MapPreview } from '@/components/common/map-preview';
import { useAdapter } from '@/hooks/use_adapter';

/**
 * Mock 实体数据
 */
const mockEntityJsonData: EntityJsonDataList = [
  {
    map_id: 'map01',
    levels: [
      {
        map_level_id: 'map01_lv001',
        categories: [
          {
            category: 'mineral',
            data: [
              {
                levelLogicId: 1001,
                entityDataIdKey: 'mineral_001',
                templateId: 'mineral',
                entityType: 'mineral',
                position: { x: 50, y: 0, z: 100 },
                properties: {},
                progressLockCondition: {},
                componentProperties: {},
              },
              {
                levelLogicId: 1002,
                entityDataIdKey: 'mineral_001',
                templateId: 'mineral',
                entityType: 'mineral',
                position: { x: 60, y: 0, z: 150 },
                properties: {},
                progressLockCondition: {},
                componentProperties: {},
              },
            ],
          },
          {
            category: 'plant',
            data: [
              {
                levelLogicId: 2001,
                entityDataIdKey: 'plant_001',
                templateId: 'plant',
                entityType: 'plant',
                position: { x: -50, y: 0, z: 350 },
                properties: {},
                progressLockCondition: {},
                componentProperties: {},
              },
            ],
          },
        ],
      },
    ],
  },
];

/**
 * Mock 实体信息
 */
const mockEntityInfoData: EntityInfoDataJson = {
  mineral_001: {
    category: 'mineral',
    entityInfo: {
      point: 'mineral_001',
      pic: 'icon_map_mineral_001',
    },
  },
  plant_001: {
    category: 'plant',
    entityInfo: {
      point: 'plant_001',
      pic: 'icon_map_plant_001',
    },
  },
};

/**
 * Mock 电线杆预设
 */
const mockElectricPolePreset: ElectricPolePreset = {
  id: 'preview-ep-preset-1',
  name: 'Demo Electric Poles',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  data: [
    {
      levelLogicId: 102665655,
      entityDataIdKey: '#electric_pole',
      templateId: '#electric_pole',
      entityType: '#ElectricPole',
      position: {
        x: -126.66434482394129,
        y: 0,
        z: 456.8603033211664,
      },
      properties: {
        deviceKey: 'pole',
        connections: [113170985],
      },
      id: 'map01|preset_1770629968773_5j6mscuby|102665655',
      presetId: 'preset_1770629968773_5j6mscuby',
      mapId: 'map01',
      createdAt: 1770648725553,
      updatedAt: 1770648725553,
    },
    {
      levelLogicId: 108857883,
      entityDataIdKey: '#electric_pole',
      templateId: '#electric_pole',
      entityType: '#ElectricPole',
      position: {
        x: -109.5104730230156,
        y: 0,
        z: 415.9229877717039,
      },
      properties: {
        deviceKey: 'pole',
        connections: [192895796],
      },
      id: 'map01|preset_1770629968773_5j6mscuby|108857883',
      presetId: 'preset_1770629968773_5j6mscuby',
      mapId: 'map01',
      createdAt: 1770648727855,
      updatedAt: 1770648727855,
    },
    {
      levelLogicId: 113170985,
      entityDataIdKey: '#electric_pole',
      templateId: '#electric_pole',
      entityType: '#ElectricPole',
      position: {
        x: -117.3070397703757,
        y: 0,
        z: 435.5632201967121,
      },
      properties: {
        deviceKey: 'pole',
        connections: [108857883],
      },
      id: 'map01|preset_1770629968773_5j6mscuby|113170985',
      presetId: 'preset_1770629968773_5j6mscuby',
      mapId: 'map01',
      createdAt: 1770648727330,
      updatedAt: 1770648727330,
    },
    {
      levelLogicId: 192895796,
      entityDataIdKey: '#electric_pole',
      templateId: '#electric_pole',
      entityType: '#ElectricPole',
      position: {
        x: -108.91521079658264,
        y: 0,
        z: 385.9888240861401,
      },
      properties: {
        deviceKey: 'pole',
        connections: [],
      },
      id: 'map01|preset_1770629968773_5j6mscuby|192895796',
      presetId: 'preset_1770629968773_5j6mscuby',
      mapId: 'map01',
      createdAt: 1770648728509,
      updatedAt: 1770648728509,
    },
    {
      levelLogicId: 134747407,
      entityDataIdKey: '#electric_pole',
      templateId: '#electric_pole',
      entityType: '#ElectricPole',
      position: {
        x: -1021.6958676346887,
        y: 0,
        z: -277.28479970986837,
      },
      properties: {
        deviceKey: 'pole',
        connections: [181328430],
      },
      id: 'map02|preset_1770629968773_5j6mscuby|134747407',
      presetId: 'preset_1770629968773_5j6mscuby',
      mapId: 'map02',
      createdAt: 1770648491989,
      updatedAt: 1770648491989,
    },
    {
      levelLogicId: 135085965,
      entityDataIdKey: '#electric_pole',
      templateId: '#electric_pole',
      entityType: '#ElectricPole',
      position: {
        x: -1029.9421836667898,
        y: 0,
        z: -251.5166067360915,
      },
      properties: {
        deviceKey: 'pole',
        connections: [134747407],
      },
      id: 'map02|preset_1770629968773_5j6mscuby|135085965',
      presetId: 'preset_1770629968773_5j6mscuby',
      mapId: 'map02',
      createdAt: 1770648488433,
      updatedAt: 1770648488433,
    },
    {
      levelLogicId: 177098970,
      entityDataIdKey: '#electric_pole',
      templateId: '#electric_pole',
      entityType: '#ElectricPole',
      position: {
        x: -1007.0038003502947,
        y: 0,
        z: -326.0872509974856,
      },
      properties: {
        deviceKey: 'pole',
        connections: [],
      },
      id: 'map02|preset_1770629968773_5j6mscuby|177098970',
      presetId: 'preset_1770629968773_5j6mscuby',
      mapId: 'map02',
      createdAt: 1770648508558,
      updatedAt: 1770648508558,
    },
    {
      levelLogicId: 181328430,
      entityDataIdKey: '#electric_pole',
      templateId: '#electric_pole',
      entityType: '#ElectricPole',
      position: {
        x: -1017.1215876354446,
        y: 0,
        z: -304.07363403545287,
      },
      properties: {
        deviceKey: 'pole',
        connections: [177098970],
      },
      id: 'map02|preset_1770629968773_5j6mscuby|181328430',
      presetId: 'preset_1770629968773_5j6mscuby',
      mapId: 'map02',
      createdAt: 1770648493268,
      updatedAt: 1770648493268,
    },
  ],
};

/**
 * Mock 自定义标点预设
 */
const mockCustomPointPreset: CustomPointPreset = {
  id: 'preview-cp-preset-1',
  name: 'Demo Custom Points',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  data: [
    {
      levelLogicId: 251425519,
      entityDataIdKey: 'custom_point_1',
      templateId: '#custom_point',
      entityType: '#CustomPoint',
      position: {
        x: 77.50680704332422,
        y: 0,
        z: 112.07344158207798,
      },
      properties: {},
      id: 'map01|preset_1770648588572_o87kd4kiq|251425519',
      presetId: 'preset_1770648588572_o87kd4kiq',
      mapId: 'map01',
      createdAt: 1770648741992,
      updatedAt: 1770648741992,
    },
    {
      levelLogicId: 253130012,
      entityDataIdKey: 'custom_point_1',
      templateId: '#custom_point',
      entityType: '#CustomPoint',
      position: {
        x: 68.58926981498553,
        y: 0,
        z: 165.46049970615104,
      },
      properties: {},
      id: 'map01|preset_1770648588572_o87kd4kiq|253130012',
      presetId: 'preset_1770648588572_o87kd4kiq',
      mapId: 'map01',
      createdAt: 1770648741236,
      updatedAt: 1770648741236,
    },
    {
      levelLogicId: 239770691,
      entityDataIdKey: 'custom_point_1',
      templateId: '#custom_point',
      entityType: '#CustomPoint',
      position: {
        x: -939.3081711698969,
        y: 0,
        z: -234.12716866495157,
      },
      properties: {},
      id: 'map02|preset_1770648588572_o87kd4kiq|239770691',
      presetId: 'preset_1770648588572_o87kd4kiq',
      mapId: 'map02',
      createdAt: 1770648590743,
      updatedAt: 1770648590743,
    },
    {
      levelLogicId: 298351628,
      entityDataIdKey: 'custom_point_1',
      templateId: '#custom_point',
      entityType: '#CustomPoint',
      position: {
        x: -933.3188868740981,
        y: 0,
        z: -247.18978589424387,
      },
      properties: {},
      id: 'map02|preset_1770648588572_o87kd4kiq|298351628',
      presetId: 'preset_1770648588572_o87kd4kiq',
      mapId: 'map02',
      createdAt: 1770648591594,
      updatedAt: 1770648591594,
    },
  ],
};

/**
 * MapPreview Demo 页面
 */
export const MapPreviewDemo: React.FC = observer(() => {
  const { mapService } = useAdapter();

  const oriMapData = mapService?.mapData;

  if (!oriMapData) return null;

  const mapData = {
    ...oriMapData,
    data: oriMapData.data.map((map) => ({
      ...map,
      zoom: {
        ...map.zoom,
        default: 1,
      },
    })),
  };

  return (
    <div className="w-100 h-100 fixed right-0 top-0 z-50 overflow-hidden bg-black">
      <MapPreview
        mapData={mapData}
        entity={{
          jsonData: mockEntityJsonData,
          infoData: mockEntityInfoData,
        }}
        electricPolePreset={mockElectricPolePreset}
        customPointPreset={mockCustomPointPreset}
        initialMapId="map01"
      />
    </div>
  );
});
