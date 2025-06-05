class KimiAPI {
    constructor() {
        this.endpoint = config.KIMI_API_ENDPOINT;
        this.apiKey = config.KIMI_API_KEY;
        this.model = config.MODEL_NAME;
    }

    async processText(text, mode, targetLang = 'zh') {
        try {
            let prompt;
            if (mode === 'translate') {
                prompt = config.TRANSLATE_PROMPTS[targetLang];
                if (!prompt) {
                    throw new Error('不支持的目标语言');
                }
            } else {
                prompt = config.SUMMARIZE_PROMPT;
            }

            const messages = [
                {
                    role: 'user',
                    content: `${prompt}\n\n${text}`
                }
            ];

            const response = await fetch(`${this.endpoint}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API请求失败: ${errorData.error?.message || response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content.trim();
        } catch (error) {
            console.error('Kimi API 错误:', error);
            throw error;
        }
    }

    async translate(text, targetLang) {
        return this.processText(text, 'translate', targetLang);
    }

    async summarize(text) {
        return this.processText(text, 'summarize');
    }
} 