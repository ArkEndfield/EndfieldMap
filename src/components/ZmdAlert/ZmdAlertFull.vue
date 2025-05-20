<template>
  <Teleport to="body">
    <AnimatePresence>
      <motion.dialog
        v-if="props.open"
        class="zmd-alert"
        :initial="{
          backgroundColor: 'rgba(0, 0, 0, 0)',
        }"
        :animate="{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }"
        :exit="{
          backgroundColor: 'rgba(0, 0, 0, 0)',
        }"
        :transition="{
          duration: 0.05,
          exit: {
            delay: 0.05,
          },
        }"
        @click.self="handleDismiss"
      >
        <AnimatePresence>
          <motion.div
            class="zmd-alert-container"
            :style="{
              height: props.height,
            }"
            v-if="props.open"
            :initial="{
              scaleX: 0,
              opacity: 0,
            }"
            :animate="{
              scaleX: [0, 1],
              opacity: [0, 1],
            }"
            :transition="{
              duration: 0.1,
            }"
            :exit="{
              scaleX: 0,
              opacity: 0,
            }"
          >
            <div class="colorful-lines">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div class="zmd-alert-bg-banner">
              <span
                :style="{
                  backgroundImage: `url(${alert_banner_bg_left})`,
                }"
              ></span>
              <span>
                <img :src="alert_banner_bg_right" />
              </span>
            </div>
            <div
              class="zmd-alert-content-wrapper"
              ref="contentRef"
            >
              <ScrollArea
                height="100%"
                :flexContainer="true"
              >
                <div class="zmd-alert-content">
                  <slot></slot>
                </div>
              </ScrollArea>
            </div>
            <div
              class="zmd-alert-actions"
              :class="{ single: props.hideCancel }"
              v-show="props.open"
            >
              <ZmdButtonRight
                v-if="!props.hideCancel"
                :text="t(props.cancelText)"
                :showIcon="props.showIcon"
                :disabled="isProcessing"
                @click="handleCancel"
              >
                <template #icon>
                  <ZmdAlertCloseIcon />
                </template>
              </ZmdButtonRight>
              <ZmdButtonRight
                type="primary"
                :text="t(props.confirmText)"
                :showIcon="props.showIcon"
                :loading="isProcessing"
                :disabled="isProcessing"
                @click="handleConfirm"
              >
                <template #icon>
                  <ZmdAlertTickIcon />
                </template>
              </ZmdButtonRight>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.dialog>
    </AnimatePresence>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import ZmdAlertTickIcon from './icons/ZmdAlertTickIcon.vue';
import ZmdAlertCloseIcon from './icons/ZmdAlertCloseIcon.vue';
import alert_banner_bg_left from '../../assets/images/bg/alert_banner_bg_left.png';
import alert_banner_bg_right from '../../assets/images/bg/alert_banner_bg_right.png';
import { AnimatePresence, motion } from 'motion-v';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
export type ZmdAlertProps = {
  open: boolean;
  dismissible?: boolean;
  hideCancel?: boolean;
  cancelText?: string;
  confirmText?: string;
  loading?: boolean;
  showIcon?: boolean;
  height?: string;
  onDismiss?: () => boolean | void | Promise<boolean | void>;
  onCancel?: () => boolean | void | Promise<boolean | void>;
  onClose?: () => boolean | void | Promise<boolean | void>;
  onConfirm?: () => boolean | void | Promise<boolean | void>;
};

const props = withDefaults(defineProps<ZmdAlertProps>(), {
  open: false,
  dismissible: true,
  hideCancel: false,
  width: '30em',
  height: 'auto',
  loading: false,
  cancelText: 'cancel',
  confirmText: 'confirm',
  showIcon: true,
  onDismiss: () => {},
  onCancel: () => {},
  onClose: () => {},
  onConfirm: () => {},
});

const emit = defineEmits(['update:open']);

const isProcessing = ref(false);
const showDialog = ref(false);

const handleDismiss = () => {
  if (props.dismissible && !isProcessing.value) {
    const result = props.onDismiss();
    if (result instanceof Promise) {
      isProcessing.value = true;
      result
        .then(res => {
          isProcessing.value = false;
          if (res !== false) {
            handleClose();
          }
        })
        .catch(() => {
          isProcessing.value = false;
        });
    } else if (result !== false) {
      handleClose();
    }
  }
};

const handleClose = () => {
  if (isProcessing.value) return;

  const result = props.onClose();
  if (result instanceof Promise) {
    isProcessing.value = true;
    result
      .then(res => {
        isProcessing.value = false;
        if (res !== false) {
          emit('update:open', false);
        }
      })
      .catch(() => {
        isProcessing.value = false;
      });
  } else if (result !== false) {
    emit('update:open', false);
  }
};

const handleCancel = () => {
  if (isProcessing.value) return;

  const result = props?.onCancel?.();
  if (result instanceof Promise) {
    isProcessing.value = true;
    result
      .then(res => {
        isProcessing.value = false;
        if (res !== false) {
          handleClose();
        }
      })
      .catch(() => {
        isProcessing.value = false;
      });
  } else if (result !== false) {
    handleClose();
  }
};

const handleConfirm = () => {
  if (isProcessing.value) return;

  const result = props?.onConfirm?.();
  if (result instanceof Promise) {
    isProcessing.value = true;
    result
      .then(res => {
        isProcessing.value = false;
        if (res !== false) {
          handleClose();
        }
      })
      .catch(() => {
        isProcessing.value = false;
      });
  } else if (result !== false) {
    handleClose();
  }
};

watch(
  () => props.open,
  newVal => {
    if (newVal) {
      showDialog.value = true;
    } else {
      setTimeout(() => {
        showDialog.value = false;
      }, 300);
    }
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
@use '../../styles/zmd.scss' as zmd;
$primary-color: #2a2728;
$primary-text-color: #fefcfc;
$primary-hover-color: #2a2728b5;
$primary-border-color: #81807f;
$default-color: #f2f1ef;
$default-text-color: #4d4d4d;
$default-hover-color: #f2f1efb5;
$default-border-color: #a0a2a3;

.zmd-alert {
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);

  .zmd-alert-container {
    width: 100%;
    min-height: 10em;
    max-height: calc(100vh - 4em);
    background-color: #fefefe;
    filter: drop-shadow(0 0 0.4em rgba(0, 0, 0, 0.3));
    display: flex;
    flex-direction: column;
    padding: 1em 0;
    padding-top: 1.7em;
    transform-origin: center right;
    position: relative;
    @media screen and (width < zmd.$phone-width) {
      padding-top: 1.7em;
    }
    &::before {
      content: '';
      position: absolute;
      left: -2em;
      bottom: 0;
      width: 100%;
      height: calc(100% - 1em);
      background-image: url('/images/deco_common_logo_bg.png');
      background-size: contain;
      background-position: bottom left;
      background-repeat: no-repeat;
      z-index: -1;
    }
    .colorful-lines {
      position: absolute;
      top: 0;
      left: 0;
      width: 15em;
      max-width: 100%;
      height: 100%;
      z-index: -1;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      height: 0.2em;
      span:nth-child(1) {
        background-color: #f0f48a;
        grid-column: span 2;
      }
      span:nth-child(2) {
        background-color: #57a2b5;
      }
      span:nth-child(3) {
        background-color: #b96bbc;
      }
    }
    .zmd-alert-bg-banner {
      $size: 3em;
      position: absolute;
      width: 40em;
      top: 0;
      right: 0;
      z-index: 0;
      display: flex;
      align-items: stretch;
      height: $size;
      transform: scaleX(-1);
      span {
        display: block;
        height: 100%;
        background-size: contain;
        background-position: left top;
        padding-right: 30%;
        &:nth-child(1) {
          flex: 1;
          background-repeat: repeat-x;
        }
        &:nth-child(2) {
          flex-shrink: 0;
          flex-grow: 0;
          background-repeat: no-repeat;
          height: $size;
          img {
            height: 100%;
            display: block;
            user-select: none;
            -webkit-user-drag: none;
            pointer-events: none;
          }
        }
      }
    }
    .zmd-alert-content-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      margin: 0 1em;
      z-index: 1;
      position: relative;
    }

    .zmd-alert-content {
      flex: 1;
      padding: 1em 0;
      color: $primary-color;
      overflow: auto;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .zmd-alert-actions {
      margin: 0 auto;
      width: 26em;
      max-width: calc(100% - 2em);
      margin-bottom: -2em;
      display: flex;
      justify-content: space-between;
      gap: 2em;
      padding: 0 1em;
      padding-top: 1em;
      z-index: 1;
      position: relative;
      @media screen and (width < zmd.$phone-width) {
        width: 25em;
        gap: 1em;
      }
      &.single {
        justify-content: center;
      }
      button {
        position: relative;
        &::before {
          content: '';
          display: block;
          position: absolute;
          top: 50%;
          left: -0.24em;
          right: -0.24em;
          bottom: -0.24em;
          border-radius: 0 0 9999px 9999px;
          background-color: #fefefe;
          z-index: -1;
        }
      }
    }
  }
}
</style>
