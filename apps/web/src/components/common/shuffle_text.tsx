/**
 * source code: https://reactbits.dev/text-animations/shuffle
 */

import { domEventListener } from '@endfieldmap/tools';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { SplitText as GSAPSplitText } from 'gsap/SplitText';
import { useEffect, useRef, useState } from 'react';

// 延迟注册插件标志
let pluginsRegistered = false;

export interface ShuffleTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  shuffleDirection?: 'left' | 'right';
  duration?: number;
  maxDelay?: number;
  ease?: string | ((t: number) => number);
  threshold?: number;
  rootMargin?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  textAlign?: React.CSSProperties['textAlign'];
  onShuffleComplete?: () => void;
  shuffleTimes?: number;
  animationMode?: 'random' | 'evenodd';
  loop?: boolean;
  loopDelay?: number;
  stagger?: number;
  scrambleCharset?: string;
  colorFrom?: string;
  colorTo?: string;
  triggerOnce?: boolean;
  respectReducedMotion?: boolean;
  triggerOnHover?: boolean;
}

const ShuffleText: React.FC<ShuffleTextProps> = ({
  text,
  className = '',
  style = {},
  shuffleDirection = 'right',
  duration = 0.35,
  maxDelay = 0,
  ease = 'power3.out',
  threshold = 0.1,
  rootMargin = '-100px',
  tag = 'p',
  textAlign = 'center',
  onShuffleComplete,
  shuffleTimes = 1,
  animationMode = 'evenodd',
  loop = false,
  loopDelay = 0,
  stagger = 0.03,
  scrambleCharset = '',
  colorFrom,
  colorTo,
  triggerOnce = true,
  respectReducedMotion = true,
  triggerOnHover = true,
}) => {
  const ref = useRef<HTMLElement | null>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [ready, setReady] = useState(false);

  const splitRef = useRef<GSAPSplitText | null>(null);
  const wrappersRef = useRef<HTMLElement[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const playingRef = useRef(false);
  const hoverDisposerRef = useRef<(() => void) | null>(null);
  const hasTriggeredRef = useRef(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if ('fonts' in document) {
      if (document.fonts.status === 'loaded') {
        Promise.resolve().then(() => setFontsLoaded(true));
      } else {
        document.fonts.ready.then(() => setFontsLoaded(true));
      }
    } else {
      Promise.resolve().then(() => setFontsLoaded(true));
    }
  }, []);

  // 使用 IntersectionObserver 检测元素是否在视口中
  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      {
        // 元素进入视口 threshold 比例时触发（例如 threshold=0.1 表示 10% 可见时触发）
        rootMargin: rootMargin,
        threshold: threshold,
      }
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  // 只在组件实际需要时才注册 GSAP 插件
  useEffect(() => {
    if (isVisible && !pluginsRegistered) {
      gsap.registerPlugin(GSAPSplitText);
      pluginsRegistered = true;
    }
  }, [isVisible]);

  useGSAP(
    () => {
      if (!ref.current || !text || !fontsLoaded || !isVisible) {
        // 当不可见时，暂停循环动画
        if (!isVisible && tlRef.current && loop) {
          tlRef.current.pause();
        }
        return;
      }

      // 如果已经触发过且 triggerOnce 为 true，只需恢复动画（如果是 loop 模式）
      if (hasTriggeredRef.current) {
        if (loop && tlRef.current) {
          tlRef.current.resume();
        }
        return;
      }

      if (respectReducedMotion && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        onShuffleComplete?.();
        return;
      }

      const el = ref.current as HTMLElement;

      const removeHover = () => {
        if (hoverDisposerRef.current) {
          hoverDisposerRef.current();
          hoverDisposerRef.current = null;
        }
      };

      const teardown = () => {
        if (tlRef.current) {
          tlRef.current.kill();
          tlRef.current = null;
        }
        if (wrappersRef.current.length) {
          wrappersRef.current.forEach((wrap) => {
            const inner = wrap.firstElementChild as HTMLElement | null;
            const orig = inner?.querySelector('[data-orig="1"]') as HTMLElement | null;
            if (orig && wrap.parentNode) wrap.parentNode.replaceChild(orig, wrap);
          });
          wrappersRef.current = [];
        }
        try {
          splitRef.current?.revert();
        } catch {
          // Ignore revert errors
        }
        splitRef.current = null;
        playingRef.current = false;
      };

      const build = () => {
        teardown();

        const computedFont = getComputedStyle(el).fontFamily;

        splitRef.current = new GSAPSplitText(el, {
          type: 'chars',
          charsClass: 'shuffle-char',
          wordsClass: 'shuffle-word',
          linesClass: 'shuffle-line',
          smartWrap: true,
          reduceWhiteSpace: false,
        });

        const chars = (splitRef.current.chars || []) as HTMLElement[];
        wrappersRef.current = [];

        const rolls = Math.max(1, Math.floor(shuffleTimes));
        const rand = (set: string) => set.charAt(Math.floor(Math.random() * set.length)) || '';

        chars.forEach((ch) => {
          const parent = ch.parentElement;
          if (!parent) return;

          const w = ch.getBoundingClientRect().width;
          if (!w) return;

          const wrap = document.createElement('span');
          wrap.className = 'inline-block overflow-hidden align-baseline text-left';
          Object.assign(wrap.style, { width: w + 'px' });

          const inner = document.createElement('span');
          inner.className = 'inline-block whitespace-nowrap will-change-transform origin-left transform-gpu';

          parent.insertBefore(wrap, ch);
          wrap.appendChild(inner);

          const firstOrig = ch.cloneNode(true) as HTMLElement;
          firstOrig.className = 'inline-block text-left';
          Object.assign(firstOrig.style, { width: w + 'px', fontFamily: computedFont });

          ch.setAttribute('data-orig', '1');
          ch.className = 'inline-block text-left';
          Object.assign(ch.style, { width: w + 'px', fontFamily: computedFont });

          inner.appendChild(firstOrig);
          for (let k = 0; k < rolls; k++) {
            const c = ch.cloneNode(true) as HTMLElement;
            if (scrambleCharset) c.textContent = rand(scrambleCharset);
            c.className = 'inline-block text-left';
            Object.assign(c.style, { width: w + 'px', fontFamily: computedFont });
            inner.appendChild(c);
          }
          inner.appendChild(ch);

          const steps = rolls + 1;
          let startX = 0;
          let finalX = -steps * w;
          if (shuffleDirection === 'right') {
            const firstCopy = inner.firstElementChild as HTMLElement | null;
            const real = inner.lastElementChild as HTMLElement | null;
            if (real) inner.insertBefore(real, inner.firstChild);
            if (firstCopy) inner.appendChild(firstCopy);
            startX = -steps * w;
            finalX = 0;
          }

          gsap.set(inner, { x: startX, force3D: true });
          if (colorFrom) inner.style.color = colorFrom;

          inner.setAttribute('data-final-x', String(finalX));
          inner.setAttribute('data-start-x', String(startX));

          wrappersRef.current.push(wrap);
        });
      };

      const inners = () => wrappersRef.current.map((w) => w.firstElementChild as HTMLElement);

      const randomizeScrambles = () => {
        if (!scrambleCharset) return;
        wrappersRef.current.forEach((w) => {
          const strip = w.firstElementChild as HTMLElement;
          if (!strip) return;
          const kids = Array.from(strip.children) as HTMLElement[];
          for (let i = 1; i < kids.length - 1; i++) {
            kids[i].textContent = scrambleCharset.charAt(Math.floor(Math.random() * scrambleCharset.length));
          }
        });
      };

      const cleanupToStill = () => {
        wrappersRef.current.forEach((w) => {
          const strip = w.firstElementChild as HTMLElement;
          if (!strip) return;
          const real = strip.querySelector('[data-orig="1"]') as HTMLElement | null;
          if (!real) return;
          strip.replaceChildren(real);
          strip.style.transform = 'none';
          strip.style.willChange = 'auto';
        });
      };

      const play = () => {
        const strips = inners();
        if (!strips.length) return;

        playingRef.current = true;

        const tl = gsap.timeline({
          smoothChildTiming: true,
          repeat: loop ? -1 : 0,
          repeatDelay: loop ? loopDelay : 0,
          onRepeat: () => {
            if (scrambleCharset) randomizeScrambles();
            gsap.set(strips, { x: (_i, t: HTMLElement) => parseFloat(t.getAttribute('data-start-x') || '0') });
            onShuffleComplete?.();
          },
          onComplete: () => {
            playingRef.current = false;
            if (!loop) {
              cleanupToStill();
              if (colorTo) gsap.set(strips, { color: colorTo });
              onShuffleComplete?.();
              armHover();
            }
          },
        });

        const addTween = (targets: HTMLElement[], at: number) => {
          tl.to(
            targets,
            {
              x: (_i, t: HTMLElement) => parseFloat(t.getAttribute('data-final-x') || '0'),
              duration,
              ease,
              force3D: true,
              stagger: animationMode === 'evenodd' ? stagger : 0,
            },
            at
          );
          if (colorFrom && colorTo) tl.to(targets, { color: colorTo, duration, ease }, at);
        };

        if (animationMode === 'evenodd') {
          const odd = strips.filter((_, i) => i % 2 === 1);
          const even = strips.filter((_, i) => i % 2 === 0);
          const oddTotal = duration + Math.max(0, odd.length - 1) * stagger;
          const evenStart = odd.length ? oddTotal * 0.7 : 0;
          if (odd.length) addTween(odd, 0);
          if (even.length) addTween(even, evenStart);
        } else {
          strips.forEach((strip) => {
            const d = Math.random() * maxDelay;
            tl.to(
              strip,
              {
                x: parseFloat(strip.getAttribute('data-final-x') || '0'),
                duration,
                ease,
                force3D: true,
              },
              d
            );
            if (colorFrom && colorTo) tl.fromTo(strip, { color: colorFrom }, { color: colorTo, duration, ease }, d);
          });
        }

        tlRef.current = tl;
      };

      const armHover = () => {
        if (!triggerOnHover || !ref.current) return;
        removeHover();
        const handler = () => {
          if (playingRef.current) return;
          build();
          if (scrambleCharset) randomizeScrambles();
          play();
        };
        hoverDisposerRef.current = domEventListener(ref.current, 'mouseenter', handler);
      };

      build();
      if (scrambleCharset) randomizeScrambles();
      play();
      armHover();
      setReady(true);
      hasTriggeredRef.current = true;

      return () => {
        removeHover();
        // 只有非循环模式或组件卸载时才完全清理
        if (!loop) {
          teardown();
          setReady(false);
        }
      };
    },
    {
      dependencies: [
        text,
        duration,
        isVisible,
        maxDelay,
        ease,
        threshold,
        rootMargin,
        fontsLoaded,
        shuffleDirection,
        shuffleTimes,
        animationMode,
        loop,
        loopDelay,
        stagger,
        scrambleCharset,
        colorFrom,
        colorTo,
        triggerOnce,
        respectReducedMotion,
        triggerOnHover,
      ],
      scope: ref,
    }
  );

  // 组件卸载时彻底清理
  useEffect(() => {
    return () => {
      if (tlRef.current) {
        tlRef.current.kill();
        tlRef.current = null;
      }
      if (hoverDisposerRef.current) {
        hoverDisposerRef.current();
        hoverDisposerRef.current = null;
      }
    };
  }, []);

  const baseTw = 'inline-block whitespace-normal break-words will-change-transform uppercase text-2xl leading-none';
  const userHasFont = className && /font[-[]/i.test(className);

  const fallbackFont = userHasFont ? {} : { fontFamily: `'Press Start 2P', sans-serif` };

  const commonStyle: React.CSSProperties = {
    textAlign,
    ...fallbackFont,
    ...style,
  };

  const classes = `${baseTw} ${ready ? 'visible' : 'invisible'} ${className}`.trim();

  switch (tag) {
    case 'h1':
      return (
        <h1 ref={ref as React.RefObject<HTMLHeadingElement>} className={classes} style={commonStyle}>
          {text}
        </h1>
      );
    case 'h2':
      return (
        <h2 ref={ref as React.RefObject<HTMLHeadingElement>} className={classes} style={commonStyle}>
          {text}
        </h2>
      );
    case 'h3':
      return (
        <h3 ref={ref as React.RefObject<HTMLHeadingElement>} className={classes} style={commonStyle}>
          {text}
        </h3>
      );
    case 'h4':
      return (
        <h4 ref={ref as React.RefObject<HTMLHeadingElement>} className={classes} style={commonStyle}>
          {text}
        </h4>
      );
    case 'h5':
      return (
        <h5 ref={ref as React.RefObject<HTMLHeadingElement>} className={classes} style={commonStyle}>
          {text}
        </h5>
      );
    case 'h6':
      return (
        <h6 ref={ref as React.RefObject<HTMLHeadingElement>} className={classes} style={commonStyle}>
          {text}
        </h6>
      );
    case 'span':
      return (
        <span ref={ref as React.RefObject<HTMLSpanElement>} className={classes} style={commonStyle}>
          {text}
        </span>
      );
    case 'p':
    default:
      return (
        <p ref={ref as React.RefObject<HTMLParagraphElement>} className={classes} style={commonStyle}>
          {text}
        </p>
      );
  }
};

export default ShuffleText;
