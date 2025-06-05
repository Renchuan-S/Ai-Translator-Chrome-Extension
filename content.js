// 获取页面主要内容
function getPageContent() {
    // 尝试获取文章主体内容
    const article = document.querySelector('article');
    if (article) {
        return article.innerText;
    }

    // 如果没有article标签，尝试获取主要内容区域
    const mainContent = document.querySelector('main') || document.querySelector('#content') || document.querySelector('.content');
    if (mainContent) {
        return mainContent.innerText;
    }

    // 如果都没有，获取body中的所有文本，但排除脚本和样式
    const bodyText = Array.from(document.body.getElementsByTagName('*'))
        .filter(element => {
            const tag = element.tagName.toLowerCase();
            const display = window.getComputedStyle(element).display;
            return !['script', 'style', 'noscript', 'iframe'].includes(tag) && 
                   display !== 'none' &&
                   element.innerText.trim().length > 0;
        })
        .map(element => element.innerText.trim())
        .join('\n')
        .replace(/[\n\r]+/g, '\n')
        .trim();

    return bodyText;
}

// 发送选中的文本到插件
function sendSelectedText() {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
        console.log('Sending selected text:', selectedText);
        chrome.runtime.sendMessage({
            action: 'textSelected',
            text: selectedText,
            from: 'content_script',
            url: window.location.href
        }).catch(error => {
            console.log('Error sending message:', error);
        });
    }
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 使用防抖处理文本选择
const debouncedSendSelectedText = debounce(sendSelectedText, 300);

// 初始化选择监听器
function initializeSelectionListeners() {
    // 移除现有的监听器（如果有）
    document.removeEventListener('mouseup', debouncedSendSelectedText);
    document.removeEventListener('keyup', handleKeyUp);
    
    // 添加新的监听器
    document.addEventListener('mouseup', debouncedSendSelectedText);
    document.addEventListener('keyup', handleKeyUp);
    
    // 检查是否已有选中的文本
    const currentSelection = window.getSelection().toString().trim();
    if (currentSelection) {
        sendSelectedText();
    }
}

// 处理键盘选择
function handleKeyUp(e) {
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
        debouncedSendSelectedText();
    }
}

// 监听来自侧边栏的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageContent') {
        const content = getPageContent();
        sendResponse({ content });
    }
    return true;
});

// 初始化
initializeSelectionListeners();

// 通知background script内容脚本已加载
chrome.runtime.sendMessage({ 
    action: 'contentScriptReady',
    url: window.location.href 
}); 