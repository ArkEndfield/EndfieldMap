<template>
  <div class="zmd-sidebar-item">
    <div
      class="header"
      @click="toggleContent"
    >
      <div class="icon">
        <ZmdSidebarLocation :icon-color="props.iconColor" />
      </div>
      <div class="title">
        <slot name="title">TITLE</slot>
      </div>
      <div class="subtitle">
        <slot name="subtitle">SUBTITLE</slot>
      </div>
    </div>
    <div class="content-container">
      <Transition
        @enter="onEnter"
        @leave="onLeave"
      >
        <div
          class="content"
          v-if="isOpen"
        >
          <div class="placeholder"></div>
          <slot>
            <div class="empty">内容为空</div>
          </slot>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { animate } from 'motion';
import ZmdSidebarLocation from './ZmdSidebarLocation.vue';

interface Props {
  iconColor?: string;
  defaultOpen?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  iconColor: '#FDFB55',
  defaultOpen: true,
});

const emit = defineEmits(['toggle']);
const isOpen = ref(props.defaultOpen);

async function onEnter(el: Element, onComplete: () => void) {
  el.setAttribute('style', 'height: 0px; overflow: hidden;');
  const height = el.scrollHeight;
  await animate(
    el,
    {
      height: `${height}px`,
    },
    { duration: 0.3 }
  );
  el.setAttribute('style', 'height: auto; overflow: visible;');
  onComplete();
}

async function onLeave(el: Element, onComplete: () => void) {
  const height = (el as HTMLElement).offsetHeight;
  el.setAttribute('style', `height: ${height}px; overflow: hidden;`);
  await new Promise(resolve => setTimeout(resolve, 10));
  await animate(
    el,
    {
      height: 0,
    },
    { duration: 0.3 }
  );
  onComplete();
}

const toggleContent = () => {
  isOpen.value = !isOpen.value;
  emit('toggle', isOpen.value);
};
</script>

<style lang="scss" scoped>
$bg-line-color: #4a4a4a89;
$bg-bg-color: #4a4a4ac1;
$bg-border-start-color: #d4d4d40b;
$bg-border-end-color: #afafaf4e;
$border-size: 0.35em;
$content-bg: #1d1d1d;
$gap: 0.7em;
.zmd-sidebar-item {
  margin-right: 1em;
  margin-top: calc(0px - $gap);
  &:first-child {
    margin-top: 0;
  }
  .header {
    display: flex;
    align-items: flex-end;
    position: relative;
    z-index: 10;
    padding-left: 0.5em;
    position: relative;
    padding-bottom: 0.2em;
    clip-path: polygon(
      0% 0%,
      100% 0%,
      100% calc(100% - $border-size),
      calc(100% - $border-size) 100%,
      0% 100%
    );
    &::before {
      content: '';
      display: block;
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 70%;
      background-color: $bg-bg-color;
      background-image: repeating-linear-gradient(
        135deg,
        transparent,
        transparent 0.1em,
        $bg-line-color 0.15em,
        $bg-line-color 0.2em
      );
      z-index: 1;
    }
    &::after {
      content: '';
      display: block;
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: $border-size;
      background: linear-gradient(
        to right,
        $bg-border-start-color,
        $bg-border-end-color
      );
      z-index: 2;
    }
    .icon {
      flex-shrink: 0;
      flex-grow: 0;
      font-size: 0.64em;
      margin-bottom: -0.2em;
      z-index: 2;
    }
    .title {
      font-size: 1.6em;
      font-weight: 900;
      margin-right: 0.2em;
      z-index: 2;
    }
    .subtitle {
      margin-bottom: 0.5em;
      scale: 0.4;
      letter-spacing: 0.4em;
      z-index: 2;
      transform-origin: left bottom;
    }

    &:hover {
      outline: 1px solid rgba(255, 255, 255, 0.2);
    }
  }
  .content-container {
    background-color: $content-bg;
    margin-top: calc(0px - $border-size);
    padding-bottom: calc($gap + 0.4em);
    padding-top: $border-size;
    position: relative;
  }
  .content {
    overflow: hidden;
    padding: 0 1em;
    &::before,
    &::after {
      content: '';
      display: block;
      background-color: #f9f853;
      width: 1.5px;
      position: absolute;
      left: 0.4em;
    }
    &::before {
      height: 1.5px;
      top: 0.5em;
    }
    &::after {
      top: 0.8em;
      bottom: 0.4em;
    }
    .placeholder {
      height: 1em;
    }
    .empty {
      text-align: center;
      font-size: 0.8em;
    }
  }
}
</style>
