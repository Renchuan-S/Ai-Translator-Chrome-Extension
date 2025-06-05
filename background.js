// 跟踪侧边栏状态
let sidePanelStatus = {
    isOpen: false,
    selectedText: null
};

// 注入content script
async function injectContentScript(tabId) {
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
        });
        console.log('Content script injected successfully');
    } catch (error) {
        console.error('Failed to inject content script:', error);
    }
}

// 监听插件图标点击事件
chrome.action.onClicked.addListener(async (tab) => {
    // 打开侧边栏
    await chrome.sidePanel.open({ windowId: tab.windowId });
    sidePanelStatus.isOpen = true;
    
    // 确保content script已注入
    await injectContentScript(tab.id);

    // 设置侧边栏默认打开
    await chrome.sidePanel.setOptions({
        enabled: true,
        path: 'sidepanel.html'
    });
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
        await injectContentScript(tabId);
    }
});

// 监听标签页激活
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    await injectContentScript(activeInfo.tabId);
});

// 处理来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'textSelected') {
        // 保存选中的文本
        sidePanelStatus.selectedText = message.text;
        
        // 向侧边栏广播消息
        chrome.runtime.sendMessage({
            action: 'textSelected',
            text: message.text
        }).catch(() => {
            console.log('Side panel not ready yet');
        });
    }
    else if (message.action === 'sidePanelReady') {
        // 如果有已保存的选中文本，立即发送给侧边栏
        if (sidePanelStatus.selectedText) {
            chrome.runtime.sendMessage({
                action: 'textSelected',
                text: sidePanelStatus.selectedText
            }).catch(() => {
                console.log('Failed to send saved text to side panel');
            });
        }
    }
    // 确保消息处理完成
    return true;
}); 