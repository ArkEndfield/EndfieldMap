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
        <Transition
          @enter="animateAlertEnterContent"
          @leave="animateAlertLeaveContent"
        >
          <div
            class="zmd-alert-content"
            v-show="props.open"
          >
            <slot></slot>
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
            >
              <slot name="cancel">
                <div class="zmd-alert-close">
                  <div class="text">{{ props.cancelText }}</div>
                  <div
                    class="icon"
                    v-if="props.showIcon"
                  >
                    <ZmdAlertCloseIcon />
                  </div>
                </div>
              </slot>
            </button>
            <button @click="handleConfirm">
              <slot name="confirm">
                <div class="zmd-alert-confirm">
                  <div class="text">{{ props.confirmText }}</div>
                  <div
                    class="icon"
                    v-if="props.showIcon"
                  >
                    <ZmdAlertTickIcon />
                  </div>
                </div>
              </slot>
            </button>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue';
import { animate } from 'motion';
import ZmdAlertTickIcon from './icons/ZmdAlertTickIcon.vue';
import ZmdAlertCloseIcon from './icons/ZmdAlertCloseIcon.vue';
import alert_bg from '../../assets/images/bg/alert_bg.png';
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
  width: '24em',
  loading: false,
  cancelText: '取消',
  confirmText: '确认',
  showIcon: true,
  onDismiss: () => {},
  onCancel: () => {},
  onClose: () => {},
  onConfirm: () => {},
});

const emit = defineEmits(['update:open']);

const backdropVisible = ref(false);
const isInitialRender = ref(true);

watch(
  () => props.open,
  newVal => {
    if (newVal) backdropVisible.value = true;
  },
  { immediate: true }
);

// 在组件挂载后，如果弹窗默认是打开的，手动执行动画
onMounted(async () => {
  if (props.open && isInitialRender.value) {
    backdropVisible.value = true;
    await nextTick();

    // 获取容器和内容元素
    const container = document.querySelector(
      '.zmd-alert-container'
    ) as HTMLElement;
    const contentElements = document.querySelectorAll(
      '.zmd-alert-content, .zmd-alert-actions'
    ) as NodeListOf<HTMLElement>;

    if (container) {
      container.style.opacity = '0';
      container.style.transform = 'scaleY(0)';
      container.style.transformOrigin = 'top';

      // 执行容器动画
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
    }

    // 执行内容动画
    if (contentElements.length) {
      contentElements.forEach(async el => {
        el.style.opacity = '0';
        await animate(el, { opacity: 1 }, { duration: 0.1 });

        await animate(el, { opacity: 0 }, { duration: 0.01, delay: 0.07 });

        await animate(el, { opacity: 1 }, { duration: 0.01, delay: 0.01 });
      });
    }

    isInitialRender.value = false;
  }
});

const handleDismiss = () => {
  if (props.dismissible) {
    const result = props.onDismiss();
    if (result instanceof Promise) {
      result.then(res => {
        if (res !== false) {
          handleClose();
        }
      });
    } else if (result !== false) {
      handleClose();
    }
  }
};

const handleClose = () => {
  const result = props.onClose();
  if (result instanceof Promise) {
    result.then(res => {
      if (res !== false) {
        emit('update:open', false);
      }
    });
  } else if (result !== false) {
    emit('update:open', false);
  }
};

const handleCancel = () => {
  const result = props?.onCancel?.();
  if (result instanceof Promise) {
    result.then(res => {
      if (res !== false) {
        handleClose();
      }
    });
  } else if (result !== false) {
    handleClose();
  }
};

const handleConfirm = () => {
  const result = props?.onConfirm?.();
  if (result instanceof Promise) {
    result.then(res => {
      if (res !== false) {
        handleClose();
      }
    });
  } else if (result !== false) {
    handleClose();
  }
};

async function animateAlertEnter(el: Element, done: () => void) {
  // 只有在非初次渲染时才执行 Transition 的 enter 动画
  if (!isInitialRender.value) {
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
  }
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
  // 只有在非初次渲染时才执行内容的 enter 动画
  if (!isInitialRender.value) {
    await animate(
      el,
      {
        opacity: 1,
      },
      {
        duration: 0.1,
      }
    );

    await animate(
      el,
      {
        opacity: 0,
      },
      {
        duration: 0.01,
        delay: 0.07,
      }
    );

    await animate(
      el,
      {
        opacity: 1,
      },
      {
        duration: 0.01,
        delay: 0.01,
      }
    );
  }
  done();
}

async function animateAlertLeaveContent(el: Element, done: () => void) {
  await animate(
    el,
    {
      opacity: 0,
    },
    {
      duration: 0.01,
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
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;

  @media screen and (max-width: zmd.$phone-width) {
    cursor: default !important;
  }

  .zmd-alert-container {
    min-height: 10em;
    max-height: calc(100vh - 4em);
    max-width: calc(100vw - 2em);
    background-color: #fefefe;
    border-radius: 0.2em;
    box-shadow: 0 0 0.4em rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    padding: 1em 1.5em;
    margin: 1em;
    transform-origin: top;
    background-size: contain;
    background-position: bottom right;
    background-repeat: no-repeat;
    .zmd-alert-content {
      flex: 1;
      display: flex;
      overflow-y: auto;
      > * {
        margin: auto;
      }
    }

    .zmd-alert-actions {
      display: flex;
      justify-content: space-between;
      gap: 1em;
      &.single {
        justify-content: center;
      }
      button {
        all: unset;
        flex: 1;
        max-width: 50%;
        cursor: pointer;
        .zmd-alert-confirm,
        .zmd-alert-close {
          transition: background-color 0.3s, box-shadow 0.3s;
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
          &:hover {
            background-color: $primary-hover-color;
            box-shadow: 0 0 0 0.1em $primary-hover-color,
              0 0 0 0.1em $primary-border-color inset;
            .icon {
              color: $primary-hover-color;
            }
          }
        }
      }
    }
  }
}
</style>
