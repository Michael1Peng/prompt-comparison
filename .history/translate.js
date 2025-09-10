#!/usr/bin/env node

const https = require('https');

class QianwenTranslator {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'dashscope.aliyuncs.com';
        this.endpoint = '/compatible-mode/v1/chat/completions';
    }

    async translate(text, targetLang = 'English') {
        const data = JSON.stringify({
            model: 'qwen-coder-plus',
            messages: [
                {
                    role: 'system',
                    content: `You are a professional translator. Translate the following text to ${targetLang}. Only return the translated text, no explanations.`
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            temperature: 0.7
        });

        const options = {
            hostname: this.baseUrl,
            port: 443,
            path: this.endpoint,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Length': Buffer.byteLength(data)
            }
        };

        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let responseData = '';

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    try {
                        const result = JSON.parse(responseData);
                        if (result.choices && result.choices[0] && result.choices[0].message) {
                            resolve(result.choices[0].message.content.trim());
                        } else {
                            reject(new Error('Invalid response format'));
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.write(data);
            req.end();
        });
    }
}

async function main() {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    
    if (!apiKey) {
        console.error('请设置环境变量 DASHSCOPE_API_KEY');
        process.exit(1);
    }

    const translator = new QianwenTranslator(apiKey);
    
    const textToTranslate = process.argv[2];
    const targetLanguage = process.argv[3] || 'English';

    if (!textToTranslate) {
        console.error('使用方法: node translate.js "要翻译的文本" [目标语言]');
        console.error('例如: node translate.js "你好世界" "English"');
        process.exit(1);
    }

    try {
        console.log('翻译中...');
        const result = await translator.translate(textToTranslate, targetLanguage);
        console.log('翻译结果:', result);
    } catch (error) {
        console.error('翻译失败:', error.message);
    }
}

if (require.main === module) {
    main();
}

module.exports = QianwenTranslator;
