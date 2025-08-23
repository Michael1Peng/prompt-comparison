#!/usr/bin/env node
const fs = require('fs');
const https = require('https');

class QianwenAnalyzer {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'dashscope.aliyuncs.com';
        this.endpoint = '/compatible-mode/v1/chat/completions';
    }

    async analyzePrompt(promptText) {
        const analysisPrompt = `你是一位专业的提示词工程师，请从prompt engineer的角度分析以下提示词，将其拆分为不同的元素。

请将以下提示词内容按照这些元素进行分类：
- 角色/能力：定义AI助手的身份、角色或专业能力
- 任务/请求：明确要完成的具体任务或请求
- 背景/情境：提供相关背景信息或使用场景
- 指令/行动：具体的操作步骤、方法或指导原则
- 输出规格：对输出格式、结构或风格的要求
- 示例：提供的例子、样例或演示
- 限制/约束：禁止做的事情、限制条件或约束规则
- 目标/期望：期望达到的效果或目标
- 信息：提供的背景信息、数据或知识
- 评估/优化：关于评估标准、优化方向的内容
- 调整：可以调整、定制或配置的内容
- 受众：目标用户、读者或使用对象

要求：
1. 只对原内容进行分类拆分，不要添加任何新内容
2. 每个分类下列出属于该分类的原文内容
3. 如果某个分类没有对应内容，则留空
4. 保持原文的完整性，确保所有内容都被分配到某个分类中

待分析的提示词：
${promptText}

请按照以下JSON格式返回结果：
{
  "角色能力": "...",
  "任务请求": "...",
  "背景情境": "...",
  "指令行动": "...",
  "输出规格": "...",
  "示例": "...",
  "限制约束": "...",
  "目标期望": "...",
  "信息": "...",
  "评估优化": "...",
  "调整": "...",
  "受众": "..."
}`;

        const data = JSON.stringify({
            model: 'qwen-plus',
            messages: [
                {
                    role: 'user',
                    content: analysisPrompt
                }
            ],
            temperature: 0.3
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
                            const content = result.choices[0].message.content.trim();
                            // 尝试从返回内容中提取JSON
                            const jsonMatch = content.match(/\{[\s\S]*\}/);
                            if (jsonMatch) {
                                const parsedResult = JSON.parse(jsonMatch[0]);
                                resolve(parsedResult);
                            } else {
                                reject(new Error('无法从API响应中提取JSON格式的分析结果'));
                            }
                        } else {
                            reject(new Error('API响应格式无效'));
                        }
                    } catch (error) {
                        reject(new Error('解析API响应失败: ' + error.message));
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
    const inputFile = './prompt-collection.json';
    const outputFile = './analyzed-prompts.json';
    
    if (!apiKey) {
        console.error('请设置环境变量 DASHSCOPE_API_KEY');
        process.exit(1);
    }

    try {
        const data = fs.readFileSync(inputFile, 'utf8');
        const prompts = JSON.parse(data);
        
        // 只处理第一个item进行测试
        const firstItem = prompts[0];
        console.log(`正在分析: ${firstItem.name}`);
        console.log(`原文长度: ${firstItem.original_prompt.length} 字符\n`);
        console.log('调用阿里云千问API进行智能分析...\n');
        
        const analyzer = new QianwenAnalyzer(apiKey);
        const analyzedElements = await analyzer.analyzePrompt(firstItem.original_prompt);
        
        const result = {
            所在文件: firstItem.name || '',
            角色能力: analyzedElements.角色能力 || '',
            任务请求: analyzedElements.任务请求 || '',
            背景情境: analyzedElements.背景情境 || '',
            指令行动: analyzedElements.指令行动 || '',
            输出规格: analyzedElements.输出规格 || '',
            示例: analyzedElements.示例 || '',
            限制约束: analyzedElements.限制约束 || '',
            目标期望: analyzedElements.目标期望 || '',
            信息: analyzedElements.信息 || '',
            评估优化: analyzedElements.评估优化 || '',
            调整: analyzedElements.调整 || '',
            受众: analyzedElements.受众 || '',
            original_content: firstItem.original_prompt
        };
        
        // 输出结果
        const output = [result];
        fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf8');
        
        console.log('AI分析结果:');
        console.log('所在文件:', result.所在文件);
        console.log('角色/能力:', result.角色能力 || '(空)');
        console.log('任务/请求:', result.任务请求 || '(空)');
        console.log('背景/情境:', result.背景情境 || '(空)');
        console.log('指令/行动:', result.指令行动 || '(空)');
        console.log('输出规格:', result.输出规格 || '(空)');
        console.log('示例:', result.示例 || '(空)');
        console.log('限制/约束:', result.限制约束 || '(空)');
        console.log('目标/期望:', result.目标期望 || '(空)');
        console.log('信息:', result.信息 || '(空)');
        console.log('评估/优化:', result.评估优化 || '(空)');
        console.log('调整:', result.调整 || '(空)');
        console.log('受众:', result.受众 || '(空)');
        
        console.log(`\n结果已保存到: ${outputFile}`);
        
    } catch (error) {
        console.error('分析失败:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
  main();
}