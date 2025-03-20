function resourceLoadingPlugin(
  options = { simulateLoadingInDev: true, minLoadingTime: 1000 }
) {
  return {
    name: 'vite-plugin-resource-loading',
    transformIndexHtml(html: string) {
      return html.replace(
        /<meta charset="UTF-8" \/>/,
        `<meta charset="UTF-8" />
        <script>
          window.LOADING_CONFIG = {
            isDevMode: ${process.env.NODE_ENV === 'development'},
            simulateLoading: ${options.simulateLoadingInDev},
            minLoadingTime: ${options.minLoadingTime},
            startTime: Date.now(),
            appInitWaitTime: 500,
            maxWaitTime: 5000,
            simulationStages: [
              { end: 20, weight: 0.2, speed: 0.3 },
              { end: 50, weight: 0.3, speed: 0.5 },
              { end: 80, weight: 0.3, speed: 0.4 },
              { end: 95, weight: 0.2, speed: 0.3 }
            ],
            initialDelay: 100
          };
          window.LOADING_STATE = {
            simulatedProgress: 0,
            realProgress: 0,
            combinedProgress: 0,
            lastCombinedProgress: 0,
            realProgressWeight: 0.4,
            simulationAnimFrame: null,
            pageLoaded: false,
            appReady: false,
            readyCheckInterval: null,
            lastUpdateTime: 0,
            resources: {
              total: 0,
              loaded: 0,
              items: new Map()
            }
          };
          window.updateProgressUI = function(progress) {
            const leftBar = document.querySelector('#app-loading .loading-bar-progress-left');
            const rightBar = document.querySelector('#app-loading .loading-bar-progress-right');
            const progressText = document.querySelector('#app-loading .loading-text');
            if (leftBar && leftBar.classList.contains('loading-bar-complete') && progress < 100) {
              return;
            }
            if(leftBar) leftBar.style.width = progress + '%';
            if(rightBar) rightBar.style.width = progress + '%';
            if(progressText) progressText.textContent = Math.floor(progress) + '%';
            if(progress >= 100) {
              if(leftBar) {
                leftBar.classList.add('loading-bar-complete');
                leftBar.style.width = '100%';
              }
              if(rightBar) {
                rightBar.classList.add('loading-bar-complete');
                rightBar.style.width = '100%';
              }
              if(progressText) {
                progressText.textContent = '100%';
              }
            }
          };
          function getSimulationSpeed(progress) {
            const stages = window.LOADING_CONFIG.simulationStages;
            for (let i = 0; i < stages.length; i++) {
              if (progress <= stages[i].end) {
                return stages[i].speed;
              }
            }
            return 0.1;
          }
          function startSimulation() {
            if (window.LOADING_STATE.simulationAnimFrame) {
              cancelAnimationFrame(window.LOADING_STATE.simulationAnimFrame);
              window.LOADING_STATE.simulationAnimFrame = null;
            }
            window.LOADING_STATE.simulatedProgress = 0;
            window.LOADING_STATE.combinedProgress = 0;
            window.LOADING_STATE.lastCombinedProgress = 0;
            window.updateProgressUI(0);
            window.LOADING_STATE.lastUpdateTime = performance.now();
            const slowStartTarget = 2;
            const slowStartSpeed = 0.02;
            function slowStartAnimation() {
              const now = performance.now();
              const deltaTime = now - window.LOADING_STATE.lastUpdateTime;
              window.LOADING_STATE.lastUpdateTime = now;
              const increment = slowStartSpeed * (deltaTime / 16.67);
              window.LOADING_STATE.simulatedProgress += increment;
              window.updateProgressUI(window.LOADING_STATE.simulatedProgress);
              if (window.LOADING_STATE.simulatedProgress < slowStartTarget) {
                window.LOADING_STATE.simulationAnimFrame = requestAnimationFrame(slowStartAnimation);
              } else {
                setTimeout(() => {
                  window.LOADING_STATE.lastUpdateTime = performance.now();
                  startMainSimulation();
                }, window.LOADING_CONFIG.initialDelay);
              }
            }
            window.LOADING_STATE.simulationAnimFrame = requestAnimationFrame(slowStartAnimation);
            function startMainSimulation() {
              let lastProgress = window.LOADING_STATE.simulatedProgress;
              let stabilityCounter = 0;
              function simulationFrame() {
                const now = performance.now();
                const deltaTime = now - window.LOADING_STATE.lastUpdateTime;
                window.LOADING_STATE.lastUpdateTime = now;
                const { simulatedProgress } = window.LOADING_STATE;
                let currentSpeed = getSimulationSpeed(simulatedProgress);
                if (window.LOADING_STATE.realProgress > simulatedProgress + 20) {
                  currentSpeed *= 1.2; 
                } else if (window.LOADING_STATE.realProgress + 20 < simulatedProgress) {
                  currentSpeed *= 0.8;
                }
                const baseIncrement = currentSpeed * (deltaTime / 16.67) * 0.3;
                let smoothedIncrement = baseIncrement;
                if (Math.abs(simulatedProgress - lastProgress) > 1.5 && stabilityCounter < 5) {
                  smoothedIncrement = baseIncrement * 0.3;
                  stabilityCounter++;
                } else {
                  stabilityCounter = Math.max(0, stabilityCounter - 1);
                }
                const finalIncrement = Math.max(0.01, Math.min(smoothedIncrement, 0.5));
                const newProgress = Math.min(simulatedProgress + finalIncrement, 90);
                window.LOADING_STATE.simulatedProgress = newProgress;
                lastProgress = newProgress;
                updateCombinedProgress();
                if (window.LOADING_STATE.pageLoaded && window.LOADING_STATE.combinedProgress >= 90) {
                  cancelAnimationFrame(window.LOADING_STATE.simulationAnimFrame);
                  window.LOADING_STATE.simulationAnimFrame = null;
                  return;
                }
                window.LOADING_STATE.simulationAnimFrame = requestAnimationFrame(simulationFrame);
              }
              window.LOADING_STATE.simulationAnimFrame = requestAnimationFrame(simulationFrame);
            }
          }
          function monitorRealProgress() {
            try {
              const initialResources = performance.getEntriesByType('resource');
              collectResources(initialResources);
            } catch (e) {
              console.warn('Failed to get initial resources:', e);
            }
            try {
              if (window.PerformanceObserver && window.PerformanceResourceTiming) {
                const observer = new PerformanceObserver((list) => {
                  collectResources(list.getEntries());
                  updateRealProgress();
                });
                observer.observe({ entryTypes: ['resource'] });
              }
            } catch (e) {
              console.warn('Failed to create PerformanceObserver:', e);
            }
            document.addEventListener('DOMContentLoaded', () => {
              const domResources = [
                ...Array.from(document.querySelectorAll('script[src]')),
                ...Array.from(document.querySelectorAll('link[href]')),
                ...Array.from(document.querySelectorAll('img[src]'))
              ];
              domResources.forEach(resource => {
                const url = resource.src || resource.href;
                if (url && !window.LOADING_STATE.resources.items.has(url)) {
                  window.LOADING_STATE.resources.items.set(url, { loaded: false });
                  window.LOADING_STATE.resources.total++;
                  if (resource.complete || resource.readyState === 'complete') {
                    window.LOADING_STATE.resources.items.set(url, { loaded: true });
                    window.LOADING_STATE.resources.loaded++;
                  } else {
                    resource.addEventListener('load', () => {
                      if (!window.LOADING_STATE.resources.items.get(url)?.loaded) {
                        window.LOADING_STATE.resources.items.set(url, { loaded: true });
                        window.LOADING_STATE.resources.loaded++;
                        updateRealProgress();
                      }
                    });
                    resource.addEventListener('error', () => {
                      if (!window.LOADING_STATE.resources.items.get(url)?.loaded) {
                        window.LOADING_STATE.resources.items.set(url, { loaded: true });
                        window.LOADING_STATE.resources.loaded++;
                        updateRealProgress();
                      }
                    });
                  }
                }
              });
              updateRealProgress();
            });
          }
          function collectResources(resources) {
            let newCount = 0;
            const filteredResources = resources.filter(resource => {
              const url = resource.name;
              return !(url.includes('analytics') || 
                     url.includes('tracking') || 
                     url.includes('google') ||
                     url.includes('favicon'));
            });
            filteredResources.forEach(resource => {
              const url = resource.name;
              if (!window.LOADING_STATE.resources.items.has(url)) {
                window.LOADING_STATE.resources.items.set(url, { loaded: true });
                window.LOADING_STATE.resources.total++;
                window.LOADING_STATE.resources.loaded++;
                newCount++;
              }
            });
            if (newCount > 2) {
              let processedCount = 0;
              let batchSize = Math.ceil(newCount / 5);
              function processNextBatch() {
                processedCount += batchSize;
                updateRealProgress();
                if (processedCount < newCount) {
                  setTimeout(processNextBatch, 150);
                }
              }
              processNextBatch();
            } else if (newCount > 0) {
              updateRealProgress();
            }
          }
          function updateRealProgress() {
            const { total, loaded } = window.LOADING_STATE.resources;
            if (total > 0) {
              let rawRealProgress = Math.min((loaded / total) * 90, 90);
              let currentRealProgress = window.LOADING_STATE.realProgress;
              let maxIncrement = 3;
              if (rawRealProgress > currentRealProgress + maxIncrement) {
                window.LOADING_STATE.realProgress = currentRealProgress + maxIncrement;
                requestAnimationFrame(updateRealProgress);
              } else {
                window.LOADING_STATE.realProgress = rawRealProgress;
              }
              updateCombinedProgress();
            }
          }
          function updateCombinedProgress() {
            const { realProgress, simulatedProgress, realProgressWeight } = window.LOADING_STATE;
            let dynamicWeight = realProgressWeight;
            if (simulatedProgress < 10) {
              dynamicWeight = 0.1;
            } else if (simulatedProgress < 30) {
              dynamicWeight = 0.1 + (simulatedProgress - 10) * 0.01;
            }
            let combined = (realProgress * dynamicWeight) + 
                          (simulatedProgress * (1 - dynamicWeight));
            combined = Math.max(combined, window.LOADING_STATE.combinedProgress);
            const lastCombined = window.LOADING_STATE.lastCombinedProgress;
            const maxSingleIncrement = 0.5;
            if (combined > lastCombined + maxSingleIncrement) {
              combined = lastCombined + maxSingleIncrement;
            }
            if (!window.LOADING_STATE.appReady) {
              combined = Math.min(combined, 90);
            }
            window.LOADING_STATE.lastCombinedProgress = window.LOADING_STATE.combinedProgress;
            window.LOADING_STATE.combinedProgress = combined;
            window.updateProgressUI(combined);
            if (window.LOADING_STATE.appReady && combined >= 100) {
              hideLoadingScreen();
            }
          }
          function checkAppReady() {
            if (document.readyState === 'complete') {
              window.LOADING_STATE.pageLoaded = true;
            }
            const appElement = document.getElementById('app');
            if (appElement && appElement.children && appElement.children.length > 0) {
              window.LOADING_STATE.appReady = true;
              finalizeLoading();
              if (window.LOADING_STATE.readyCheckInterval) {
                clearInterval(window.LOADING_STATE.readyCheckInterval);
                window.LOADING_STATE.readyCheckInterval = null;
              }
            }
          }
          function setupAppReadyCheck() {
            window.LOADING_STATE.readyCheckInterval = setInterval(() => {
              checkAppReady();
            }, 200);
            if (document.readyState === 'complete') {
              checkAppReady();
            } else {
              window.addEventListener('load', () => {
                window.LOADING_STATE.pageLoaded = true;
                setTimeout(() => {
                  checkAppReady();
                  if (!window.LOADING_STATE.appReady) {
                    setTimeout(() => {
                      checkAppReady();
                      if (!window.LOADING_STATE.appReady) {
                        console.log('App ready timeout - forcing completion');
                        window.LOADING_STATE.appReady = true;
                        finalizeLoading();
                      }
                    }, window.LOADING_CONFIG.appInitWaitTime);
                  }
                }, 500);
              });
            }
          }
          function hideLoadingScreen(delay = 100) {
            window.LOADING_STATE.combinedProgress = 100;
            window.updateProgressUI(100);
            const appElement = document.getElementById('app');
            const hasAppContent = appElement && appElement.children && appElement.children.length > 0;
            const extraDelay = hasAppContent ? 0 : 300;
            setTimeout(() => {
              const leftBar = document.querySelector('#app-loading .loading-bar-progress-left');
              const rightBar = document.querySelector('#app-loading .loading-bar-progress-right');
              if(leftBar) {
                leftBar.style.transition = 'none';
                leftBar.style.width = '100%';
                leftBar.classList.add('loading-bar-complete');
              }
              if(rightBar) {
                rightBar.style.transition = 'none';
                rightBar.style.width = '100%';
                rightBar.classList.add('loading-bar-complete');
              }
              const nowHasContent = document.getElementById('app')?.children?.length > 0;
              if (!nowHasContent) {
                setTimeout(hideLoadingScreen, 200);
                return;
              }
              const loading = document.getElementById('app-loading');
              if(loading) {
                const allTransitionElements = loading.querySelectorAll('*');
                allTransitionElements.forEach(el => {
                  if(el instanceof HTMLElement) {
                    el.style.transition = 'none';
                  }
                });
                requestAnimationFrame(() => {
                  loading.offsetHeight;
                  loading.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                  loading.style.opacity = '0';
                  loading.style.transform = 'scale(1.05)';
                  setTimeout(() => {
                    loading.remove();
                    
                    // 触发一个自定义事件通知应用加载完成
                    const appReadyEvent = new CustomEvent('app-loading-complete');
                    window.dispatchEvent(appReadyEvent);
                  }, 350);
                });
              }
            }, delay + extraDelay);
          }
          function finalizeLoading() {
            const timeElapsed = Date.now() - window.LOADING_CONFIG.startTime;
            const remainingTime = Math.max(0, window.LOADING_CONFIG.minLoadingTime - timeElapsed);
            if (window.LOADING_STATE.simulationAnimFrame) {
              cancelAnimationFrame(window.LOADING_STATE.simulationAnimFrame);
              window.LOADING_STATE.simulationAnimFrame = null;
            }
            window.LOADING_STATE.appReady = true;
            const appElement = document.getElementById('app');
            const hasAppContent = appElement && appElement.children && appElement.children.length > 0;
            const transitionTime = Math.max(remainingTime, hasAppContent ? 300 : 500);
            const startTime = performance.now();
            const startProgress = window.LOADING_STATE.combinedProgress;
            const endProgress = 100;
            function finalizeAnimation(timestamp) {
              const elapsed = timestamp - startTime;
              const progress = Math.min(elapsed / transitionTime, 1);
              const easeProgress = 1 - Math.pow(1 - progress, 3);
              const currentProgress = startProgress + (endProgress - startProgress) * easeProgress;
              const smoothProgress = Math.max(window.LOADING_STATE.combinedProgress, currentProgress);
              window.LOADING_STATE.combinedProgress = smoothProgress;
              if (progress > 0.98) {
                window.LOADING_STATE.combinedProgress = 100;
                window.updateProgressUI(100);
                const progressBars = document.querySelectorAll('#app-loading .loading-bar-progress-left, #app-loading .loading-bar-progress-right');
                progressBars.forEach(el => {
                  if(el instanceof HTMLElement) {
                    el.style.width = '100%';
                    el.classList.add('loading-bar-complete');
                  }
                });
                hideLoadingScreen();
                return;
              }
              window.updateProgressUI(smoothProgress);
              if (progress < 0.98) {
                requestAnimationFrame(finalizeAnimation);
              }
            }
            requestAnimationFrame(finalizeAnimation);
          }
          function initLoadingProcess() {
            if (window.LOADING_CONFIG.simulateLoading) {
              startSimulation();
            }
            monitorRealProgress();
            setupAppReadyCheck();
            let maxWaitStartTime = performance.now();
            function checkMaxWaitTime() {
              const elapsed = performance.now() - maxWaitStartTime;
              if (elapsed >= window.LOADING_CONFIG.maxWaitTime && window.LOADING_STATE.combinedProgress < 100) {
                console.log('Loading max timeout - forcing completion');
                window.LOADING_STATE.appReady = true;
                finalizeLoading();
              } else if (window.LOADING_STATE.combinedProgress < 100) {
                requestAnimationFrame(checkMaxWaitTime);
              }
            }
            requestAnimationFrame(checkMaxWaitTime);
          }
          window.APP_LOADED = function() {
            window.LOADING_STATE.appReady = true;
            finalizeLoading();
          };
          initLoadingProcess();
        </script>`
      );
    },
  };
}

export default resourceLoadingPlugin;
