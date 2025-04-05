<template>
  <div
    v-show="backdropVisible"
    class="zmd-alert"
    @click.self="handleDismiss"
  >
    <Transition
      @enter="animateAlertEnter"
      @leave="animateAlertLeave"
    >
      <div
        class="zmd-alert-container"
        v-show="props.open"
        :style="{ width: props.width, backgroundImage: `url(${alert_bg})` }"
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
        <Transition
          @enter="animateAlertEnterContent"
          @leave="animateAlertLeaveContent"
        >
          <div
            class="zmd-alert-content-wrapper"
            v-show="props.open"
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
        </Transition>
        <Transition
          @enter="animateAlertEnterContent"
          @leave="animateAlertLeaveContent"
        >
          <div
            class="zmd-alert-actions"
            :class="{ single: props.hideCancel }"
            v-show="props.open"
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
              ref="confirmButtonRef"
              :disabled="isProcessing"
              :class="{ 'is-disabled': isProcessing }"
            >
              <slot name="confirm">
                <Transition>
                  <div
                    class="zmd-alert-confirm"
                    @mouseenter="animateConfirmEnter"
                    @mouseleave="animateConfirmLeave"
                  >
                    <div class="text">{{ $t(props.confirmText) }}</div>
                    <div
                      class="icon"
                      v-if="props.showIcon"
                    >
                      <div
                        v-if="isProcessing"
                        class="loading-spinner"
                      ></div>
                      <ZmdAlertTickIcon v-else />
                    </div>
                  </div>
                </Transition>
              </slot>
            </button>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { animate } from 'motion';
import ZmdAlertTickIcon from './icons/ZmdAlertTickIcon.vue';
import ZmdAlertCloseIcon from './icons/ZmdAlertCloseIcon.vue';
import alert_bg from '../../assets/images/bg/alert_bg.png';
import alert_banner_bg_left from '../../assets/images/bg/alert_banner_bg_left.png';
import alert_banner_bg_right from '../../assets/images/bg/alert_banner_bg_right.png';
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

watch(
  () => props.open,
  newVal => {
    if (newVal) backdropVisible.value = true;
  },
  { immediate: true }
);

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

const confirmButtonRef = ref<HTMLElement | null>(null);

async function animateConfirmEnter(payload: MouseEvent) {
  const el = payload.currentTarget as HTMLElement;
  if (el) {
    await animate(
      el,
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
}

async function animateConfirmLeave(payload: MouseEvent) {
  const el = payload.currentTarget as HTMLElement;
  if (el) {
    await animate(
      el,
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
}

async function animateAlertEnter(el: Element, done: () => void) {
  const container = el as HTMLElement;
  container.style.transformOrigin = 'top';
  await animate(
    container,
    {
      transform: ['scaleY(0)', 'scaleY(1)'],
      opacity: 1,
    },
    {
      duration: 0.15,
    }
  );
  done();
}

async function animateAlertLeave(el: Element, done: () => void) {
  const container = el as HTMLElement;
  container.style.transformOrigin = 'bottom';
  await Promise.all([
    animate(
      container,
      { transform: ['scaleY(1)', 'scaleY(0)'] },
      { duration: 0.15 }
    ),
    animate(
      container,
      { opacity: 0 },
      {
        duration: 0.03,
        delay: 0.07,
      }
    ),
  ]);
  backdropVisible.value = false;
  done();
}

async function animateAlertEnterContent(el: Element, done: () => void) {
  await animate(
    el,
    {
      opacity: 1,
    },
    {
      duration: 0.1,
    }
  );
  await animate(el, { opacity: 0 }, { duration: 0.005, delay: 0.07 });
  await animate(el, { opacity: 1 }, { duration: 0.005, delay: 0.005 });
  await animate(el, { opacity: 0 }, { duration: 0.005, delay: 0.005 });
  await animate(el, { opacity: 1 }, { duration: 0.005, delay: 0.005 });

  done();
}

async function animateAlertLeaveContent(el: Element, done: () => void) {
  await animate(
    el,
    {
      opacity: 0,
    },
    {
      duration: 0.15,
    }
  );
  done();
}
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
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;

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
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% {
                transform: rotate(0deg);
              }
              100% {
                transform: rotate(360deg);
              }
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
