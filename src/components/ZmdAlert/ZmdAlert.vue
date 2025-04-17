<template>
  <Teleport to="body">
    <dialog
      v-if="backdropVisible"
      ref="dialog"
      class="zmd-alert"
      @click.self="handleDismiss"
    >
      <motion.div
        class="zmd-alert-container"
        :style="{
          width: props.width,
          height: props.height,
          backgroundImage: `url(${alert_bg})`,
          transformOrigin: props.open ? 'top' : 'bottom',
        }"
        ref="alertRef"
        :initial="false"
      >
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
          ref="buttonsRef"
        >
          <ZmdButton
            v-if="!props.hideCancel"
            type="default"
            :text="t(props.cancelText)"
            :showIcon="props.showIcon"
            :disabled="isProcessing"
            @click="handleCancel"
          >
            <template #icon>
              <ZmdAlertCloseIcon />
            </template>
          </ZmdButton>
          <ZmdButton
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
          </ZmdButton>
        </div>
      </motion.div>
    </dialog>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import ZmdAlertTickIcon from './icons/ZmdAlertTickIcon.vue';
import ZmdAlertCloseIcon from './icons/ZmdAlertCloseIcon.vue';
import alert_bg from '../../assets/images/bg/alert_bg.png';
import alert_banner_bg_left from '../../assets/images/bg/alert_banner_bg_left.png';
import alert_banner_bg_right from '../../assets/images/bg/alert_banner_bg_right.png';
import { motion, useAnimate } from 'motion-v';
import { nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import ZmdButton from '../ZmdButton/ZmdButton.vue';
const dialog = ref<HTMLDialogElement | null>(null);
const { t } = useI18n();
export type ZmdAlertProps = {
  open: boolean;
  dismissible?: boolean;
  hideCancel?: boolean;
  cancelText?: string;
  confirmText?: string;
  loading?: boolean;
  showIcon?: boolean;
  width?: string;
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

const backdropVisible = ref(false);
const isProcessing = ref(false);

const [alertRef, alertAnimate] = useAnimate();
const [contentRef, contentAnimate] = useAnimate();
const [buttonsRef] = useAnimate();

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

const shineAnimate = async (scope: typeof contentRef, show: boolean) => {
  if (show) {
    await contentAnimate(
      scope.value,
      {
        opacity: 1,
      },
      {
        duration: 0.1,
      }
    );
    await contentAnimate(
      scope.value,
      { opacity: 0 },
      { duration: 0.005, delay: 0.07 }
    );
    await contentAnimate(
      scope.value,
      { opacity: 1 },
      { duration: 0.005, delay: 0.005 }
    );
    await contentAnimate(
      scope.value,
      { opacity: 0 },
      { duration: 0.005, delay: 0.005 }
    );
    await contentAnimate(
      scope.value,
      { opacity: 1 },
      { duration: 0.005, delay: 0.005 }
    );
  } else {
    await contentAnimate(
      scope.value,
      {
        opacity: 0,
      },
      {
        duration: 0.15,
      }
    );
  }
};

watch(
  () => props.open,
  async newVal => {
    if (newVal) {
      backdropVisible.value = true;
      await nextTick();
      await alertAnimate(
        alertRef.value,
        {
          transform: ['scaleY(0)', 'scaleY(1)'],
          opacity: [0, 1],
        },
        {
          duration: 0.15,
        }
      );

      shineAnimate(contentRef, newVal);
      shineAnimate(buttonsRef, newVal);
    } else {
      shineAnimate(contentRef, newVal);
      shineAnimate(buttonsRef, newVal);
      await Promise.all([
        alertAnimate(
          alertRef.value,
          { transform: ['scaleY(1)', 'scaleY(0)'] },
          { duration: 0.15 }
        ),
        alertAnimate(
          alertRef.value,
          { opacity: [1, 0] },
          {
            duration: 0.03,
            delay: 0.07,
          }
        ),
      ]);
      backdropVisible.value = false;
    }
  }
);

watch(
  backdropVisible,
  newVal => {
    if (newVal) {
      dialog.value?.showModal();
    } else {
      dialog.value?.close();
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
  background-color: transparent;

  .zmd-alert-container {
    min-height: 10em;
    max-height: calc(100vh - 4em);
    max-width: calc(100vw - 2em);
    background-color: #fefefe;
    border-radius: 0.2em;
    box-shadow: 0 0 0.4em rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    padding: 1em 0;
    padding-top: 1.7em;
    margin: 1em;
    transform-origin: top;
    background-size: 90% auto;
    background-position: bottom right;
    background-repeat: no-repeat;
    position: relative;
    @media screen and (max-width: zmd.$phone-width) {
      max-width: calc(100vw - 0.2em);
      padding-top: 1.7em;
      margin: 0.5em;
    }
    .zmd-alert-bg-banner {
      $size: 4.5em;
      position: absolute;
      width: 100%;
      top: 0;
      left: 0;
      z-index: 0;
      display: flex;
      align-items: stretch;
      height: $size;
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
    }

    .zmd-alert-actions {
      display: flex;
      justify-content: space-between;
      gap: 1em;
      padding: 0 1em;
      padding-top: 1em;
      z-index: 1;
      position: relative;
      &.single {
        justify-content: center;
      }
    }
  }
}
</style>
