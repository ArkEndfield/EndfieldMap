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
          <button
            @click="handleCancel"
            v-if="!props.hideCancel"
            :disabled="isProcessing"
            :class="{ 'is-disabled': isProcessing }"
          >
            <slot name="cancel">
              <div class="zmd-alert-close">
                <div class="text">{{ $t(props.cancelText) }}</div>
                <div
                  class="icon"
                  v-if="props.showIcon"
                >
                  <ZmdAlertCloseIcon />
                </div>
              </div>
            </slot>
          </button>
          <button
            @click="handleConfirm"
            :disabled="isProcessing"
            :class="{ 'is-disabled': isProcessing }"
          >
            <slot name="confirm">
              <div
                class="zmd-alert-confirm"
                ref="confirmRef"
                @mouseenter="animateConfirmEnter"
                @mouseleave="animateConfirmLeave"
              >
                <div class="text">{{ $t(props.confirmText) }}</div>
                <div
                  class="icon"
                  v-if="props.showIcon"
                >
                  <motion.div
                    v-if="isProcessing"
                    class="loading-spinner"
                    :animate="{ rotate: 360 }"
                    :transition="{
                      duration: 1,
                      ease: 'linear',
                      repeat: Infinity,
                    }"
                  ></motion.div>
                  <ZmdAlertTickIcon v-else />
                </div>
              </div>
            </slot>
          </button>
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
const dialog = ref<HTMLDialogElement | null>(null);

export type ZmdAlertProps = {
  open: boolean;
  dismissible?: boolean;
  hideCancel?: boolean;
  cancelText?: string;
  confirmText?: string;
  loading?: boolean;
  showIcon?: boolean;
  width?: string;
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
const [confirmRef, confirmAnimate] = useAnimate();

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

async function animateConfirmEnter() {
  await confirmAnimate(
    confirmRef.value,
    {
      backgroundColor: ['#2a272877', '#2a2728b5', '#2a272877', '#2a2728b5'],
      boxShadow: [
        '0 0 0 0.1em #2a272877, 0 0 0 0.1em #81807f inset',
        '0 0 0 0.1em #2a2728b5, 0 0 0 0.1em #81807f inset',
        '0 0 0 0.1em #2a272877, 0 0 0 0.1em #81807f inset',
        '0 0 0 0.1em #2a2728b5, 0 0 0 0.1em #81807f inset',
      ],
    },
    { duration: 0.2 }
  );
}

async function animateConfirmLeave() {
  await confirmAnimate(
    confirmRef.value,
    {
      backgroundColor: ['#2a2728b5', '#2a2728', '#2a2728b5', '#2a2728'],
      boxShadow: [
        '0 0 0 0.1em #2a2728b5, 0 0 0 0.1em #81807f inset',
        '0 0 0 0.1em #2a2728, 0 0 0 0.1em #81807f inset',
        '0 0 0 0.1em #2a2728b5, 0 0 0 0.1em #81807f inset',
        '0 0 0 0.1em #2a2728, 0 0 0 0.1em #81807f inset',
      ],
    },
    { duration: 0.2 }
  );
}

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
      max-height: calc(70vh - 6em);
      margin: 0 1em;
      z-index: 1;
    }

    .zmd-alert-content {
      padding: 1em 0;
      color: $primary-color;
    }

    .zmd-alert-actions {
      display: flex;
      justify-content: space-between;
      gap: 1em;
      padding: 0 1em;
      padding-top: 1em;
      z-index: 1;
      &.single {
        justify-content: center;
      }
      button {
        all: unset;
        flex: 1;
        max-width: 50%;
        .zmd-alert-confirm,
        .zmd-alert-close {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          .text {
            flex: 1;
            text-align: center;
          }
          .icon {
            width: 1.3em;
            height: 1.3em;
            border-radius: 50%;
            flex-grow: 0;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            .loading-spinner {
              width: 1em;
              height: 1em;
              border: 2px solid rgb(255, 187, 0);
              border-top: 2px solid #fff;
              border-radius: 50%;
            }
          }
        }
        .zmd-alert-close {
          background-color: $default-color;
          color: $default-text-color;
          padding: 0.3em 0.35em;
          box-shadow: 0 0 0 0.1em $default-color,
            0 0 0 0.1em $default-border-color inset;
          .icon {
            background-color: $default-text-color;
            color: $default-color;
            transition: color 0.3s;
            svg {
              font-size: 1em;
            }
          }
          &:hover {
            background-color: $default-hover-color;
            box-shadow: 0 0 0 0.1em $default-hover-color,
              0 0 0 0.1em $default-border-color inset;
            .icon {
              color: $default-hover-color;
            }
          }
        }
        .zmd-alert-confirm {
          background-color: $primary-color;
          color: $primary-text-color;
          padding: 0.3em 0.35em;
          box-shadow: 0 0 0 0.1em $primary-color,
            0 0 0 0.1em $primary-border-color inset;
          .icon {
            background-color: $primary-text-color;
            color: $primary-color;
            transition: color 0.3s;
            svg {
              font-size: 1.3em;
            }
          }
        }
        &.is-disabled {
          opacity: 0.7;
          cursor: not-allowed;
          pointer-events: none;
        }
      }
    }
  }
}
</style>
