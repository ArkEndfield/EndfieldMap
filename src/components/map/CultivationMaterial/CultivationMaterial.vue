<template>
  <Teleport
    to="body"
    defer
  >
    <motion.div
      class="cultivation-material-panel fixed left-0 bottom-0 bg-[#272727] z-[53] text-white"
      :animate="{
        opacity: open ? 1 : 0,
        width: open ? 'var(--cultivation-material-panel-width)' : 0,
        overflow: open ? 'visible' : 'hidden',
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
        class="absolute -top-2 right-2 bg-[#272727] text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-[#3a3a3a] active:bg-[#4a4a4a] transition-all duration-200 group"
      >
        <CloseIcon
          class="w-4 h-4 group-hover:rotate-180 transition-transform duration-200 ease-in-out"
          :class="cn(open ? 'rotate-0' : 'rotate-180')"
        />
      </button>
      <div class="w-1 h-6"></div>
      <ScrollArea
        class="px-4"
        flex-container
      >
        <CultivationMaterialListTitle>
          {{ $t('character') }}
          <template #content>
            <div class="grid grid-cols-2 gap-2">
              <CultivationAddItem
                v-for="item in 10"
                :key="item"
                icon="/enemy/adventure_eny_0018_lbtough.png"
                :name="`char_name_${item}`"
                :id="String(item)"
                @toggle="toggleCharacter"
                :active="chooseCharacters.includes(String(item))"
              />
            </div>
          </template>
        </CultivationMaterialListTitle>

        <div class="py-4 space-y-2">
          <AnimatePresence>
            <CultivationMaterialItem
              v-for="item in chooseCharacters"
              :key="item"
              :id="item"
              :name="`char_name_${item}`"
              icon="/enemy/adventure_eny_0018_lbtough.png"
              @delete="deleteCharacter"
            />
          </AnimatePresence>
        </div>

        <CultivationMaterialListTitle>
          {{ $t('weapon') }}
          <template #content>
            <div class="grid grid-cols-2 gap-2">
              <CultivationAddItem
                v-for="item in 10"
                :key="item"
                icon="/enemy/adventure_eny_0018_lbtough.png"
                :name="`weapon_name_${item}`"
                :id="String(item)"
                :active="chooseWeapons.includes(String(item))"
                @toggle="toggleWeapon"
              />
            </div>
          </template>
        </CultivationMaterialListTitle>

        <div class="min-h-[18em] py-4 space-y-2">
          <AnimatePresence>
            <CultivationMaterialItem
              v-for="item in chooseWeapons"
              :key="item"
              :id="item"
              :name="`weapon_name_${item}`"
              icon="/enemy/adventure_eny_0018_lbtough.png"
              @delete="deleteWeapon"
            />
          </AnimatePresence>
        </div>
      </ScrollArea>
    </motion.div>
  </Teleport>
</template>

<script setup lang="ts">
import { cn } from '@/utils/tailwind';
import { AnimatePresence, motion } from 'motion-v';
import { ref } from 'vue';
const chooseCharacters = ref<string[]>([]);
const chooseWeapons = ref<string[]>([]);
const open = defineModel<boolean>('open', {
  default: false,
});
const toggleCharacter = (id: string) => {
  if (chooseCharacters.value.includes(id)) {
    chooseCharacters.value = chooseCharacters.value.filter(item => item !== id);
  } else {
    chooseCharacters.value.push(id);
  }
};
const deleteCharacter = (id: string) => {
  chooseCharacters.value = chooseCharacters.value.filter(item => item !== id);
};
const toggleWeapon = (id: string) => {
  if (chooseWeapons.value.includes(id)) {
    chooseWeapons.value = chooseWeapons.value.filter(item => item !== id);
  } else {
    chooseWeapons.value.push(id);
  }
};
const deleteWeapon = (id: string) => {
  chooseWeapons.value = chooseWeapons.value.filter(item => item !== id);
};
const close = () => {
  open.value = false;
};
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
