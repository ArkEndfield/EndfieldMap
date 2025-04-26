<template>
  <Teleport
    to="body"
    defer
  >
    <motion.div
      class="cultivation-material-panel fixed left-0 bottom-0 bg-[#272727] z-[53] text-white overflow-hidden pt-4"
      :animate="{
        opacity: showCultivationMaterial ? 1 : 0,
        width: showCultivationMaterial
          ? 'var(--cultivation-material-panel-width)'
          : 0,
        overflow: showCultivationMaterial ? 'visible' : 'hidden',
      }"
      :initial="{
        opacity: 0,
        width: 0,
        overflow: 'hidden',
      }"
      :transition="{
        duration: 0.5,
        type: 'spring',
        bounce: 0.25,
      }"
    >
      <button
        @click="close"
        class="absolute -top-2 right-2 bg-[#272727] text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-[#3a3a3a] active:bg-[#4a4a4a] transition-all duration-200 group z-20"
      >
        <CloseIcon
          class="w-4 h-4 group-hover:rotate-180 transition-transform duration-200 ease-in-out"
          :class="cn(showCultivationMaterial ? 'rotate-0' : 'rotate-180')"
        />
      </button>
      <ScrollArea
        class="px-4"
        flex-container
      >
        <CultivationMaterialListTitle>
          {{ t('_character') }}
          <template #content>
            <div class="grid grid-cols-2 gap-2">
              <CultivationAddItem
                v-for="item in allCharIDs"
                :key="item"
                :icon="`/images/character/rectangle/icon_cutin_${item}.png`"
                :name="t(`character.${item}.name`)"
                :id="String(item)"
                @toggle="toggleCharacter"
                :active="chooseCharacters.includes(String(item))"
              />
            </div>
          </template>
        </CultivationMaterialListTitle>

        <div class="py-4 space-y-2 overflow-hidden">
          <AnimatePresence>
            <CultivationMaterialItem
              v-for="item in chooseCharacters"
              :key="item"
              :id="item"
              :name="t(`character.${item}.name`)"
              type="character"
              :icon="`/images/character/square_round/icon_round_${item}.png`"
              @delete="deleteCharacter"
            />
          </AnimatePresence>
        </div>

        <CultivationMaterialListTitle>
          {{ t('weapon') }}
          <template #content>
            <div class="grid grid-cols-2 gap-2">
              <CultivationAddItem
                v-for="item in allWeaponIDs"
                :key="item"
                :icon="`/item/${item}.png`"
                :name="t(`item.${item}.name`)"
                :id="String(item)"
                :active="chooseWeapons.includes(String(item))"
                @toggle="toggleWeapon"
              />
            </div>
          </template>
        </CultivationMaterialListTitle>

        <div class="min-h-[5em] py-4 space-y-2 overflow-hidden">
          <AnimatePresence>
            <CultivationMaterialItem
              v-for="item in chooseWeapons"
              :key="item"
              :id="item"
              type="weapon"
              :name="t(`item.${item}.name`)"
              :icon="`/item/${item}.png`"
              @delete="deleteWeapon"
            />
          </AnimatePresence>
        </div>
      </ScrollArea>
    </motion.div>
  </Teleport>
</template>

<script setup lang="ts">
import { showCultivationMaterial } from '@/data/entity';
import {
  getAllMaterialCharIDs,
  getAllMaterialWeaponIDs,
} from '@/services/material';
import { getCharMaterial } from '@/services/material';
import { getWeaponMaterial } from '@/services/material';
import { unSelect, getEntityDataByPic } from '@/services/entity';
import { cn } from '@/utils/tailwind';
import { AnimatePresence, motion } from 'motion-v';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const chooseCharacters = ref<string[]>([]);
const chooseWeapons = ref<string[]>([]);
const allCharIDs = ref<string[]>([]);
const allWeaponIDs = ref<string[]>([]);
const { t } = useI18n();

const loadAllCharEntityData = async () => {
  allCharIDs.value = await getAllMaterialCharIDs();
  allWeaponIDs.value = await getAllMaterialWeaponIDs();
};

const toggleCharacter = (id: string) => {
  if (chooseCharacters.value.includes(id)) {
    chooseCharacters.value = chooseCharacters.value.filter(item => item !== id);
  } else {
    chooseCharacters.value.push(id);
  }
};

const deleteCharacter = async (id: string) => {
  // 获取要删除角色的所有材料
  const deletedCharMaterials = await getCharMaterial(id);
  if (!deletedCharMaterials) return;

  // 获取所有剩余角色和武器的材料
  const remainingMaterials = new Set<string>();

  // 获取所有剩余角色的材料
  for (const charId of chooseCharacters.value) {
    if (charId === id) continue;
    const materials = await getCharMaterial(charId);
    if (materials) {
      Object.keys(materials).forEach(materialId => {
        const entity = getEntityDataByPic(materialId);
        if (entity) {
          remainingMaterials.add(entity.entityInfo.point);
        }
      });
    }
  }

  // 获取所有武器的材料
  for (const weaponId of chooseWeapons.value) {
    const materials = await getWeaponMaterial(weaponId);
    if (materials) {
      Object.keys(materials).forEach(materialId => {
        const entity = getEntityDataByPic(materialId);
        if (entity) {
          remainingMaterials.add(entity.entityInfo.point);
        }
      });
    }
  }

  // 取消选中不再被任何角色或武器使用的材料
  Object.keys(deletedCharMaterials).forEach(materialId => {
    const entity = getEntityDataByPic(materialId);
    if (entity && !remainingMaterials.has(entity.entityInfo.point)) {
      unSelect(entity.entityInfo.point);
    }
  });

  // 最后从列表中移除该角色
  chooseCharacters.value = chooseCharacters.value.filter(item => item !== id);
};

const toggleWeapon = (id: string) => {
  if (chooseWeapons.value.includes(id)) {
    chooseWeapons.value = chooseWeapons.value.filter(item => item !== id);
  } else {
    chooseWeapons.value.push(id);
  }
};

const deleteWeapon = async (id: string) => {
  // 获取要删除武器的所有材料
  const deletedWeaponMaterials = await getWeaponMaterial(id);
  if (!deletedWeaponMaterials) return;

  // 获取所有剩余武器和角色的材料
  const remainingMaterials = new Set<string>();

  // 获取所有剩余武器的材料
  for (const weaponId of chooseWeapons.value) {
    if (weaponId === id) continue;
    const materials = await getWeaponMaterial(weaponId);
    if (materials) {
      Object.keys(materials).forEach(materialId => {
        const entity = getEntityDataByPic(materialId);
        if (entity) {
          remainingMaterials.add(entity.entityInfo.point);
        }
      });
    }
  }

  // 获取所有角色的材料
  for (const charId of chooseCharacters.value) {
    const materials = await getCharMaterial(charId);
    if (materials) {
      Object.keys(materials).forEach(materialId => {
        const entity = getEntityDataByPic(materialId);
        if (entity) {
          remainingMaterials.add(entity.entityInfo.point);
        }
      });
    }
  }

  // 取消选中不再被任何武器或角色使用的材料
  Object.keys(deletedWeaponMaterials).forEach(materialId => {
    const entity = getEntityDataByPic(materialId);
    if (entity && !remainingMaterials.has(entity.entityInfo.point)) {
      unSelect(entity.entityInfo.point);
    }
  });

  // 最后从列表中移除该武器
  chooseWeapons.value = chooseWeapons.value.filter(item => item !== id);
};

const close = () => {
  showCultivationMaterial.value = false;
};

onMounted(() => {
  loadAllCharEntityData();
});
</script>

<style lang="scss" scoped>
@use '../../../styles/zmd.scss' as zmd;
.cultivation-material-panel {
  --cultivation-material-panel-width: calc(#{zmd.$side-width} - 1.3em);
  width: var(--cultivation-material-panel-width);
  top: calc(#{zmd.$side-margin-y} + 1.1em);
  @media screen and (max-width: zmd.$phone-width) {
    top: 1.1em;
  }
  @media screen and (min-width: zmd.$large-screen-width) {
    --cultivation-material-panel-width: calc(#{zmd.$side-large-width} - 1.5em);
  }
}
</style>
