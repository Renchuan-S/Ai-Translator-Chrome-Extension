const config = {
    // Kimi API配置
    KIMI_API_ENDPOINT: 'https://api.moonshot.cn/v1',
    // 在这里替换为你的API密钥
    KIMI_API_KEY: 'sk-eWiQVWV0sBPEJnC8CiVueUsPckWmkD1X5AJMTT3zTPR3D9yH',
    
    // 模型配置
    MODEL_NAME: 'moonshot-v1-8k',
    
    // 翻译提示词
    TRANSLATE_PROMPTS: {
        'zh': '请将以下文本翻译成中文，保持原文的语气和风格：',
        'en': '请将以下文本翻译成英文，保持原文的语气和风格：',
        'ko': '请将以下文本翻译成韩文，保持原文的语气和风格：'
    },
    
    // 总结提示词
    SUMMARIZE_PROMPT: '请用简洁的语言总结以下文本的主要内容（不超过300字）：'
}; 