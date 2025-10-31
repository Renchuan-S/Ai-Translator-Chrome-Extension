class KimiAPI {
    constructor() {
        this.endpoint = config.KIMI_API_ENDPOINT;
        this.apiKey = config.KIMI_API_KEY;
        this.model = config.MODEL_NAME;
        this.chatHistory = [];
    }

    clearChatHistory() {
        this.chatHistory = [];
    }

    async chat(message) {
        try {
            console.log('发送聊天请求:', message);
            
            this.chatHistory.push({
                role: 'user',
                content: message
            });
            
            const response = await fetch(`${this.endpoint}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: this.chatHistory,
                    temperature: 0.7,
                    max_tokens: 2000
                })
            });

            console.log('收到响应状态:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('API错误:', errorData);
                throw new Error(`API请求失败: ${errorData.error?.message || response.status}`);
            }

            const data = await response.json();
            console.log('API响应数据:', data);
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('API响应格式错误');
            }
            
            const aiResponse = data.choices[0].message.content.trim();
            
            this.chatHistory.push({
                role: 'assistant',
                content: aiResponse
            });
            
            return aiResponse;
        } catch (error) {
            console.error('聊天请求失败:', error);
            throw error;
        }
    }

    async translate(text, targetLang) {
        try {
            const prompt = config.TRANSLATE_PROMPTS[targetLang];
            if (!prompt) {
                throw new Error('不支持的目标语言');
            }

            const response = await fetch(`${this.endpoint}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [{
                        role: 'user',
                        content: `${prompt}\n\n${text}`
                    }],
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
            console.error('翻译请求失败:', error);
            throw error;
        }
    }

    async summarize(text) {
        try {
            const response = await fetch(`${this.endpoint}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [{
                        role: 'user',
                        content: `${config.SUMMARIZE_PROMPT}\n\n${text}`
                    }],
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
            console.error('总结请求失败:', error);
            throw error;
        }
    }
} 