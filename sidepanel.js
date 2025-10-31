document.addEventListener('DOMContentLoaded', function() {
    const kimiAPI = new KimiAPI();
    const inputText = document.getElementById('inputText');
    const resultText = document.getElementById('resultText');
    const chatHistory = document.getElementById('chatHistory');
    const modeSelect = document.getElementById('mode');
    const targetLangSelect = document.getElementById('targetLang');
    const translateBtn = document.getElementById('translateBtn');
    const summarizeBtn = document.getElementById('summarizeBtn');
    const sendBtn = document.getElementById('sendBtn');
    const clearBtn = document.getElementById('clearBtn');
    const translateOptions = document.getElementById('translateOptions');

    // 更新界面状态
    function updateUIState() {
        const mode = modeSelect.value;
        translateBtn.style.display = mode === 'translate' ? 'block' : 'none';
        summarizeBtn.style.display = mode === 'summarize' ? 'block' : 'none';
        sendBtn.style.display = mode === 'chat' ? 'block' : 'none';
        translateOptions.style.display = mode === 'translate' ? 'block' : 'none';
        
        // 更新body的类
        document.body.classList.toggle('chat-mode', mode === 'chat');
        
        // 更新placeholder
        inputText.placeholder = mode === 'translate' 
            ? '在此显示选中的网页内容...' 
            : mode === 'summarize'
            ? '在此显示选中的内容或点击总结按钮总结整个页面...'
            : '输入你想说的话...';
            
        // 清空聊天历史
        if (mode === 'chat') {
            chatHistory.innerHTML = '';
        }
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
        if (modeSelect.value === 'chat') {
            // 在聊天模式下，添加一个加载消息
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'chat-message ai-message loading-message';
            loadingDiv.innerHTML = '<div class="message-content">正在思考...</div>';
            chatHistory.appendChild(loadingDiv);
            chatHistory.scrollTop = chatHistory.scrollHeight;
        } else {
            resultText.innerHTML = '';
            resultText.classList.add('loading');
        }
    }

    // 隐藏加载状态
    function hideLoading() {
        if (modeSelect.value === 'chat') {
            // 在聊天模式下，移除加载消息
            const loadingMessage = chatHistory.querySelector('.loading-message');
            if (loadingMessage) {
                loadingMessage.remove();
            }
        } else {
            resultText.classList.remove('loading');
        }
    }

    // 显示错误信息
    function showError(error) {
        if (modeSelect.value === 'chat') {
            // 在聊天模式下，将错误作为AI消息显示
            addChatMessage('ai', `错误: ${error.message}`);
        } else {
            resultText.innerHTML = `<div class="error">错误: ${error.message}</div>`;
        }
    }

    // 显示结果
    function showResult(text) {
        resultText.innerHTML = text;
        resultText.style.color = 'var(--text-color)';
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

    // 处理聊天
    async function handleChat() {
        const text = inputText.value.trim();
        if (!text) {
            showError(new Error('请输入消息'));
            return;
        }

        try {
            console.log('开始处理聊天消息:', text);
            
            // 添加用户消息到聊天历史
            addChatMessage('user', text);
            
            // 清空输入框
            inputText.value = '';
            
            // 显示加载状态
            showLoading();
            
            // 调用API
            console.log('调用聊天API...');
            const result = await kimiAPI.chat(text);
            console.log('收到API响应:', result);
            
            // 隐藏加载状态
            hideLoading();
            
            // 添加AI回复到聊天历史
            if (result) {
                addChatMessage('ai', result);
            } else {
                throw new Error('API返回空响应');
            }
        } catch (error) {
            console.error('聊天处理错误:', error);
            hideLoading();
            showError(error);
        }
    }

    // 添加聊天消息到历史记录
    function addChatMessage(role, content) {
        if (!content) {
            console.warn('尝试添加空消息:', role);
            return;
        }
        
        console.log('添加聊天消息:', role, content);
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${role}-message`;
        messageDiv.innerHTML = `
            <div class="message-content">${content}</div>
        `;
        chatHistory.appendChild(messageDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    // 清除聊天历史
    function handleClear() {
        inputText.value = '';
        resultText.innerHTML = '';
        chatHistory.innerHTML = '';
        kimiAPI.clearChatHistory(); // 清除API的聊天历史
        inputText.focus();
    }

    // 绑定按钮事件
    translateBtn.addEventListener('click', handleTranslate);
    summarizeBtn.addEventListener('click', handleSummarize);
    sendBtn.addEventListener('click', handleChat);
    clearBtn.addEventListener('click', handleClear);

    // 添加快捷键支持
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter 触发操作
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const mode = modeSelect.value;
            if (mode === 'translate') {
                handleTranslate();
            } else if (mode === 'summarize') {
                handleSummarize();
            } else if (mode === 'chat') {
                handleChat();
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