import { getBrowserInfo } from '@/utils/deviceDetection';

export function browserTip() {
  // 隐藏加载界面
  const loading = document.getElementById('app-loading');
  if (loading) {
    loading.classList.add('loading-hidden');
  }

  // 触发应用加载完成事件，确保过渡效果正确执行
  window.dispatchEvent(new CustomEvent('app-loading-complete'));

  // 获取当前浏览器信息
  const { browserName, version } = getBrowserInfo();

  // 延迟300ms后替换内容，确保加载过渡有时间完成
  setTimeout(() => {
    // 美化后的浏览器不兼容提示
    document.body.innerHTML = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 50px auto; padding: 30px; text-align: center; background: #ffffff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
        <div style="margin-bottom: 25px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        
        <!-- 语言选择链接 -->
        <div style="margin-bottom: 20px; display: flex; justify-content: center; gap: 10px;">
          <a href="?lang=zh" style="display: inline-block; padding: 5px 12px; border: none; border-radius: 4px; background: #3498db; color: white; text-decoration: none; font-size: 14px;">中文</a>
          <a href="?lang=en" style="display: inline-block; padding: 5px 12px; border: none; border-radius: 4px; background: #f1f5f9; color: #34495e; text-decoration: none; font-size: 14px;">English</a>
          <a href="?lang=ja" style="display: inline-block; padding: 5px 12px; border: none; border-radius: 4px; background: #f1f5f9; color: #34495e; text-decoration: none; font-size: 14px;">日本語</a>
        </div>

        <!-- 中文内容 -->
        <div style="display: block;">
          <h2 style="color: #2c3e50; font-size: 28px; margin-bottom: 15px; font-weight: 600;">浏览器版本需要更新</h2>
          <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin-bottom: 10px;">您当前使用的浏览器不支持本应用所需的现代web技术。</p>
          
          <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; justify-content: center; align-items: center; gap: 8px;">
              <span style="color: #2c3e50; font-weight: 600;">当前浏览器：</span>
              <span style="background: #e9f3ff; padding: 3px 8px; border-radius: 4px; font-family: monospace; color: #0078d7;">${browserName} ${version}</span>
            </div>
            
            <div style="display: flex; justify-content: center; align-items: center; flex-wrap: wrap; margin-top: 5px; font-size: 14px;">
              <div style="color: #34495e; padding: 2px 8px; border-radius: 4px;">
                请升级您的浏览器
              </div>
            </div>
          </div>
          
          <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">为了获得最佳体验，请升级或切换到以下推荐的浏览器版本：</p>
          
          <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; margin-bottom: 25px;">
            <!-- Chrome -->
            <a href="https://www.google.com/chrome/" target="_blank" style="flex: 1; min-width: 120px; max-width: 200px; text-decoration: none; padding: 15px; border-radius: 8px; background: #f8f9fa; transition: all 0.2s ease; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
              <div style="width: 50px; height: 50px; margin: 0 auto 10px;">
                <img src="/logo/chrome_logo.png" alt="Chrome" style="width: 100%; height: 100%; object-fit: contain;">
              </div>
              <div style="color: #2c3e50; font-weight: 600; margin-bottom: 4px;">Chrome</div>
              <div style="color: #7f8c8d; font-size: 13px;">111+ 版本</div>
            </a>
            
            <!-- Edge -->
            <a href="https://www.microsoft.com/edge" target="_blank" style="flex: 1; min-width: 120px; max-width: 200px; text-decoration: none; padding: 15px; border-radius: 8px; background: #f8f9fa; transition: all 0.2s ease; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
              <div style="width: 50px; height: 50px; margin: 0 auto 10px;">
                <img src="/logo/edge_logo.png" alt="Edge" style="width: 100%; height: 100%; object-fit: contain;">
              </div>
              <div style="color: #2c3e50; font-weight: 600; margin-bottom: 4px;">Edge</div>
              <div style="color: #7f8c8d; font-size: 13px;">111+ 版本</div>
            </a>
            
            <!-- Firefox -->
            <a href="https://www.mozilla.org/firefox/new/" target="_blank" style="flex: 1; min-width: 120px; max-width: 200px; text-decoration: none; padding: 15px; border-radius: 8px; background: #f8f9fa; transition: all 0.2s ease; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
              <div style="width: 50px; height: 50px; margin: 0 auto 10px;">
                <img src="/logo/firefox_logo.png" alt="Firefox" style="width: 100%; height: 100%; object-fit: contain;">
              </div>
              <div style="color: #2c3e50; font-weight: 600; margin-bottom: 4px;">Firefox</div>
              <div style="color: #7f8c8d; font-size: 13px;">127+ 版本</div>
            </a>
            
            <!-- Safari -->
            <a href="https://www.apple.com/safari/" target="_blank" style="flex: 1; min-width: 120px; max-width: 200px; text-decoration: none; padding: 15px; border-radius: 8px; background: #f8f9fa; transition: all 0.2s ease; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
              <div style="width: 50px; height: 50px; margin: 0 auto 10px;">
                <img src="/logo/safari_logo.png" alt="Safari" style="width: 100%; height: 100%; object-fit: contain;">
              </div>
              <div style="color: #2c3e50; font-weight: 600; margin-bottom: 4px;">Safari</div>
              <div style="color: #7f8c8d; font-size: 13px;">16.2+ 版本</div>
            </a>
          </div>
          
          <p style="color: #7f8c8d; font-size: 14px; margin-top: 20px;">
            更新浏览器后，<a href="javascript:location.reload()" style="color: #3498db; text-decoration: none; font-weight: 500;">刷新此页面</a> 继续访问
          </p>
          
        </div>
      </div>
    `;

    // 检查URL参数以支持语言切换（无需JavaScript）
    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get('lang');

    if (lang === 'en') {
      // 显示英文内容
      document.body.innerHTML = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 50px auto; padding: 30px; text-align: center; background: #ffffff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
          <div style="margin-bottom: 25px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          
          <!-- 语言选择链接 -->
          <div style="margin-bottom: 20px; display: flex; justify-content: center; gap: 10px;">
            <a href="?lang=zh" style="display: inline-block; padding: 5px 12px; border: none; border-radius: 4px; background: #f1f5f9; color: #34495e; text-decoration: none; font-size: 14px;">中文</a>
            <a href="?lang=en" style="display: inline-block; padding: 5px 12px; border: none; border-radius: 4px; background: #3498db; color: white; text-decoration: none; font-size: 14px;">English</a>
            <a href="?lang=ja" style="display: inline-block; padding: 5px 12px; border: none; border-radius: 4px; background: #f1f5f9; color: #34495e; text-decoration: none; font-size: 14px;">日本語</a>
          </div>
          
          <h2 style="color: #2c3e50; font-size: 28px; margin-bottom: 15px; font-weight: 600;">Browser Update Required</h2>
          <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin-bottom: 10px;">Your current browser does not support the modern web technologies required by this application.</p>
          
          <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; justify-content: center; align-items: center; gap: 8px;">
              <span style="color: #2c3e50; font-weight: 600;">Current Browser:</span>
              <span style="background: #e9f3ff; padding: 3px 8px; border-radius: 4px; font-family: monospace; color: #0078d7;">${browserName} ${version}</span>
            </div>
            
            <div style="display: flex; justify-content: center; align-items: center; flex-wrap: wrap; margin-top: 5px; font-size: 14px;">
              <div style="color: #34495e; padding: 2px 8px; border-radius: 4px;">
                Please upgrade your browser
              </div>
            </div>
          </div>
          
          <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">For the best experience, please upgrade or switch to one of the following recommended browser versions:</p>
          
          <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; margin-bottom: 25px;">
            <!-- Chrome -->
            <a href="https://www.google.com/chrome/" target="_blank" style="flex: 1; min-width: 120px; max-width: 200px; text-decoration: none; padding: 15px; border-radius: 8px; background: #f8f9fa; transition: all 0.2s ease; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
              <div style="width: 50px; height: 50px; margin: 0 auto 10px;">
                <img src="/logo/chrome_logo.png" alt="Chrome" style="width: 100%; height: 100%; object-fit: contain;">
              </div>
              <div style="color: #2c3e50; font-weight: 600; margin-bottom: 4px;">Chrome</div>
              <div style="color: #7f8c8d; font-size: 13px;">Version 111+</div>
            </a>
            
            <!-- Edge -->
            <a href="https://www.microsoft.com/edge" target="_blank" style="flex: 1; min-width: 120px; max-width: 200px; text-decoration: none; padding: 15px; border-radius: 8px; background: #f8f9fa; transition: all 0.2s ease; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
              <div style="width: 50px; height: 50px; margin: 0 auto 10px;">
                <img src="/logo/edge_logo.png" alt="Edge" style="width: 100%; height: 100%; object-fit: contain;">
              </div>
              <div style="color: #2c3e50; font-weight: 600; margin-bottom: 4px;">Edge</div>
              <div style="color: #7f8c8d; font-size: 13px;">Version 111+</div>
            </a>
            
            <!-- Firefox -->
            <a href="https://www.mozilla.org/firefox/new/" target="_blank" style="flex: 1; min-width: 120px; max-width: 200px; text-decoration: none; padding: 15px; border-radius: 8px; background: #f8f9fa; transition: all 0.2s ease; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
              <div style="width: 50px; height: 50px; margin: 0 auto 10px;">
                <img src="/logo/firefox_logo.png" alt="Firefox" style="width: 100%; height: 100%; object-fit: contain;">
              </div>
              <div style="color: #2c3e50; font-weight: 600; margin-bottom: 4px;">Firefox</div>
              <div style="color: #7f8c8d; font-size: 13px;">Version 127+</div>
            </a>
            
            <!-- Safari -->
            <a href="https://www.apple.com/safari/" target="_blank" style="flex: 1; min-width: 120px; max-width: 200px; text-decoration: none; padding: 15px; border-radius: 8px; background: #f8f9fa; transition: all 0.2s ease; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
              <div style="width: 50px; height: 50px; margin: 0 auto 10px;">
                <img src="/logo/safari_logo.png" alt="Safari" style="width: 100%; height: 100%; object-fit: contain;">
              </div>
              <div style="color: #2c3e50; font-weight: 600; margin-bottom: 4px;">Safari</div>
              <div style="color: #7f8c8d; font-size: 13px;">Version 16.2+</div>
            </a>
          </div>
          
          <p style="color: #7f8c8d; font-size: 14px; margin-top: 20px;">
            After updating your browser, <a href="javascript:location.reload()" style="color: #3498db; text-decoration: none; font-weight: 500;">refresh this page</a> to continue
          </p>
        </div>
      `;
    } else if (lang === 'ja') {
      // 显示日文内容
      document.body.innerHTML = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 50px auto; padding: 30px; text-align: center; background: #ffffff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
          <div style="margin-bottom: 25px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          
          <!-- 语言选择链接 -->
          <div style="margin-bottom: 20px; display: flex; justify-content: center; gap: 10px;">
            <a href="?lang=zh" style="display: inline-block; padding: 5px 12px; border: none; border-radius: 4px; background: #f1f5f9; color: #34495e; text-decoration: none; font-size: 14px;">中文</a>
            <a href="?lang=en" style="display: inline-block; padding: 5px 12px; border: none; border-radius: 4px; background: #f1f5f9; color: #34495e; text-decoration: none; font-size: 14px;">English</a>
            <a href="?lang=ja" style="display: inline-block; padding: 5px 12px; border: none; border-radius: 4px; background: #3498db; color: white; text-decoration: none; font-size: 14px;">日本語</a>
          </div>
          
          <h2 style="color: #2c3e50; font-size: 28px; margin-bottom: 15px; font-weight: 600;">ブラウザのアップデートが必要です</h2>
          <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin-bottom: 10px;">お使いのブラウザは、このアプリケーションに必要な最新のWeb技術をサポートしていません。</p>
          
          <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; justify-content: center; align-items: center; gap: 8px;">
              <span style="color: #2c3e50; font-weight: 600;">現在のブラウザ：</span>
              <span style="background: #e9f3ff; padding: 3px 8px; border-radius: 4px; font-family: monospace; color: #0078d7;">${browserName} ${version}</span>
            </div>
            
            <div style="display: flex; justify-content: center; align-items: center; flex-wrap: wrap; margin-top: 5px; font-size: 14px;">
              <div style="color: #34495e; padding: 2px 8px; border-radius: 4px;">
                ブラウザをアップグレードしてください
              </div>
            </div>
          </div>
          
          <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">最適な体験を得るには、次の推奨ブラウザバージョンにアップグレードまたは切り替えてください：</p>
          
          <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; margin-bottom: 25px;">
            <!-- Chrome -->
            <a href="https://www.google.com/chrome/" target="_blank" style="flex: 1; min-width: 120px; max-width: 200px; text-decoration: none; padding: 15px; border-radius: 8px; background: #f8f9fa; transition: all 0.2s ease; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
              <div style="width: 50px; height: 50px; margin: 0 auto 10px;">
                <img src="/logo/chrome_logo.png" alt="Chrome" style="width: 100%; height: 100%; object-fit: contain;">
              </div>
              <div style="color: #2c3e50; font-weight: 600; margin-bottom: 4px;">Chrome</div>
              <div style="color: #7f8c8d; font-size: 13px;">バージョン 111+</div>
            </a>
            
            <!-- Edge -->
            <a href="https://www.microsoft.com/edge" target="_blank" style="flex: 1; min-width: 120px; max-width: 200px; text-decoration: none; padding: 15px; border-radius: 8px; background: #f8f9fa; transition: all 0.2s ease; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
              <div style="width: 50px; height: 50px; margin: 0 auto 10px;">
                <img src="/logo/edge_logo.png" alt="Edge" style="width: 100%; height: 100%; object-fit: contain;">
              </div>
              <div style="color: #2c3e50; font-weight: 600; margin-bottom: 4px;">Edge</div>
              <div style="color: #7f8c8d; font-size: 13px;">バージョン 111+</div>
            </a>
            
            <!-- Firefox -->
            <a href="https://www.mozilla.org/firefox/new/" target="_blank" style="flex: 1; min-width: 120px; max-width: 200px; text-decoration: none; padding: 15px; border-radius: 8px; background: #f8f9fa; transition: all 0.2s ease; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
              <div style="width: 50px; height: 50px; margin: 0 auto 10px;">
                <img src="/logo/firefox_logo.png" alt="Firefox" style="width: 100%; height: 100%; object-fit: contain;">
              </div>
              <div style="color: #2c3e50; font-weight: 600; margin-bottom: 4px;">Firefox</div>
              <div style="color: #7f8c8d; font-size: 13px;">バージョン 127+</div>
            </a>
            
            <!-- Safari -->
            <a href="https://www.apple.com/safari/" target="_blank" style="flex: 1; min-width: 120px; max-width: 200px; text-decoration: none; padding: 15px; border-radius: 8px; background: #f8f9fa; transition: all 0.2s ease; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
              <div style="width: 50px; height: 50px; margin: 0 auto 10px;">
                <img src="/logo/safari_logo.png" alt="Safari" style="width: 100%; height: 100%; object-fit: contain;">
              </div>
              <div style="color: #2c3e50; font-weight: 600; margin-bottom: 4px;">Safari</div>
              <div style="color: #7f8c8d; font-size: 13px;">バージョン 16.2+</div>
            </a>
          </div>
          
          <p style="color: #7f8c8d; font-size: 14px; margin-top: 20px;">
            ブラウザを更新した後、<a href="javascript:location.reload()" style="color: #3498db; text-decoration: none; font-weight: 500;">このページを更新</a>して続行してください
          </p>
        </div>
      `;
    }
  }, 300);
}

export function loadErrorTip(error: Error) {
  // 显示错误信息给用户
  const errorDiv = document.createElement('div');
  errorDiv.style.position = 'fixed';
  errorDiv.style.top = '0';
  errorDiv.style.left = '0';
  errorDiv.style.width = '100%';
  errorDiv.style.padding = '20px';
  errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
  errorDiv.style.color = 'white';
  errorDiv.style.textAlign = 'center';
  errorDiv.style.fontSize = '16px';
  errorDiv.style.zIndex = '9999';
  errorDiv.innerHTML = `
      <p>应用初始化失败，请尝试刷新页面。</p>
      <p>错误详情: ${error instanceof Error ? error.message : String(error)}</p>
    `;
  document.body.appendChild(errorDiv);
}
