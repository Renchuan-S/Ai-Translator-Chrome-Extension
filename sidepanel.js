document.addEventListener('DOMContentLoaded', function() {
    const kimiAPI = new KimiAPI();
    const inputText = document.getElementById('inputText');
    const resultText = document.getElementById('resultText');
    const modeSelect = document.getElementById('mode');
    const targetLangSelect = document.getElementById('targetLang');
    const translateBtn = document.getElementById('translateBtn');
    const summarizeBtn = document.getElementById('summarizeBtn');
    const clearBtn = document.getElementById('clearBtn');
    const translateOptions = document.getElementById('translateOptions');

    // 更新界面状态
    function updateUIState() {
        const mode = modeSelect.value;
        translateBtn.style.display = mode === 'translate' ? 'block' : 'none';
        summarizeBtn.style.display = mode === 'summarize' ? 'block' : 'none';
        translateOptions.style.display = mode === 'translate' ? 'block' : 'none';
        
        // 更新placeholder
        inputText.placeholder = mode === 'translate' 
            ? '在此显示选中的网页内容...' 
            : '在此显示选中的内容或点击总结按钮总结整个页面...';
    }

    // 初始化界面状态
    updateUIState();

    // 监听模式切换
    modeSelect.addEventListener('change', updateUIState);

    // 获取当前标签页
    async function getCurrentTab() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        return tab;
    }

    // 获取页面内容
    async function getPageContent() {
        const tab = await getCurrentTab();
        return new Promise((resolve) => {
            chrome.tabs.sendMessage(tab.id, { action: 'getPageContent' }, (response) => {
                resolve(response?.content || '');
            });
        });
    }

    // 处理文本选择
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'textSelected' && request.text) {
            // 更新输入框内容
            inputText.value = request.text;
            // 自动聚焦到输入框
            inputText.focus();
            // 如果需要，可以自动滚动到输入框位置
            inputText.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });

    // 显示加载状态
    function showLoading() {
        resultText.innerHTML = '';
        resultText.classList.add('loading');
    }

    // 隐藏加载状态
    function hideLoading() {
        resultText.classList.remove('loading');
    }

    // 显示错误信息
    function showError(error) {
        resultText.innerHTML = `<div class="error">错误: ${error.message}</div>`;
    }

    // 显示结果
    function showResult(text) {
        resultText.innerHTML = text;
        resultText.style.color = 'var(--text-color)';
    }

    // 清除输入和结果
    function handleClear() {
        inputText.value = '';
        resultText.innerHTML = '';
        inputText.focus(); // 清除后聚焦到输入框
    }

    // 处理翻译
    async function handleTranslate() {
        const text = inputText.value.trim();
        if (!text) {
            showError(new Error('请输入要翻译的文本'));
            return;
        }

        const targetLang = targetLangSelect.value;

        try {
            showLoading();
            const result = await kimiAPI.translate(text, targetLang);
            showResult(result);
        } catch (error) {
            showError(error);
        } finally {
            hideLoading();
        }
    }

    // 处理总结
    async function handleSummarize() {
        let text = inputText.value.trim();
        
        // 如果没有选中文本，获取整个页面内容
        if (!text) {
            try {
                showLoading();
                text = await getPageContent();
                if (!text) {
                    throw new Error('无法获取页面内容');
                }
                // 更新输入框显示页面内容
                inputText.value = text;
            } catch (error) {
                showError(error);
                hideLoading();
                return;
            }
        }

        try {
            if (!hideLoading()) {
                showLoading();
            }
            const result = await kimiAPI.summarize(text);
            showResult(result);
        } catch (error) {
            showError(error);
        } finally {
            hideLoading();
        }
    }

    // 绑定按钮事件
    translateBtn.addEventListener('click', handleTranslate);
    summarizeBtn.addEventListener('click', handleSummarize);
    clearBtn.addEventListener('click', handleClear);

    // 添加快捷键支持
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter 触发操作
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const mode = modeSelect.value;
            if (mode === 'translate') {
                handleTranslate();
            } else {
                handleSummarize();
            }
        }
        // Esc 键清除内容
        else if (e.key === 'Escape') {
            handleClear();
        }
    });

    // 通知后台脚本侧边栏已准备就绪
    chrome.runtime.sendMessage({ action: 'sidePanelReady' });
}); 