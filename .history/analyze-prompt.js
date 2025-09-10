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
- 角色能力：定义AI助手的身份、角色或专业能力（string类型）
- 任务请求：明确要完成的具体任务或请求（string类型）
- 背景情境：提供相关背景信息或使用场景（string类型）
- 指令行动：具体的操作步骤、方法或指导原则（string类型）
- 输出规格：对输出格式、结构或风格的要求（string类型）
- 示例：提供的例子、样例或演示（string类型）
- 限制约束：禁止做的事情、限制条件或约束规则（string类型）
- 目标期望：期望达到的效果或目标（string类型）
- 信息：提供的背景信息、数据或知识（string类型）
- 评估优化：关于评估标准、优化方向的内容（string类型）
- 调整：可以调整、定制或配置的内容（string类型）
- 受众：目标用户、读者或使用对象（string类型）

要求：
1. 只对原内容进行分类拆分，不要添加任何新内容
2. 每个分类下列出属于该分类的原文内容
3. 如果某个分类没有对应内容，则设为空字符串
4. 保持原文的完整性，确保所有内容都被分配到某个分类中
5. 必须返回标准JSON格式

待分析的提示词：
${promptText}

请按照以下JSON格式返回结果：
{
  "角色能力": "",
  "任务请求": "",
  "背景情境": "",
  "指令行动": "",
  "输出规格": "",
  "示例": "",
  "限制约束": "",
  "目标期望": "",
  "信息": "",
  "评估优化": "",
  "调整": "",
  "受众": ""
}`;

        const data = JSON.stringify({
            model: 'qwen-plus',
            messages: [
                {
                    role: 'user',
                    content: analysisPrompt
                }
            ],
            temperature: 0.3,
            response_format: { type: "json_object" }
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
                            // 直接解析JSON内容（使用结构化输出确保格式正确）
                            try {
                                const parsedResult = JSON.parse(content);
                                resolve(parsedResult);
                            } catch (parseError) {
                                // 如果直接解析失败，尝试提取JSON部分（兼容旧版本）
                                const jsonMatch = content.match(/\{[\s\S]*\}/);
                                if (jsonMatch) {
                                    const parsedResult = JSON.parse(jsonMatch[0]);
                                    resolve(parsedResult);
                                } else {
                                    reject(new Error(`JSON解析失败: ${parseError.message}, 原始内容: ${content}`));
                                }
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

async function analyzeItem(analyzer, item, index, total, retries = 2) {
    try {
        console.log(`[${index + 1}/${total}] 分析: ${item.name}`);
        
        const analyzedElements = await analyzer.analyzePrompt(item.original_prompt);
        
        // 验证返回的JSON结构
        const requiredFields = ['角色能力', '任务请求', '背景情境', '指令行动', '输出规格', '示例', '限制约束', '目标期望', '信息', '评估优化', '调整', '受众'];
        const missingFields = requiredFields.filter(field => !(field in analyzedElements));
        
        if (missingFields.length > 0) {
            console.warn(`⚠️ [${index + 1}/${total}] 缺少字段: ${missingFields.join(', ')} - ${item.name}`);
        }
        
        // 为item添加analysis字段
        item.analysis = {
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
            受众: analyzedElements.受众 || ''
        };
        
        console.log(`✅ [${index + 1}/${total}] 完成: ${item.name}`);
        return item;
        
    } catch (error) {
        if (retries > 0) {
            console.warn(`⚠️ [${index + 1}/${total}] 重试: ${item.name} - ${error.message} (剩余重试次数: ${retries})`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return analyzeItem(analyzer, item, index, total, retries - 1);
        }
        
        console.error(`❌ [${index + 1}/${total}] 失败: ${item.name} - ${error.message}`);
        // 分析失败时，添加空的analysis字段
        item.analysis = {
            角色能力: '', 任务请求: '', 背景情境: '', 指令行动: '',
            输出规格: '', 示例: '', 限制约束: '', 目标期望: '',
            信息: '', 评估优化: '', 调整: '', 受众: ''
        };
        return item;
    }
}

async function concurrentAnalyze(analyzer, items, concurrency = 3) {
    const results = [];
    const total = items.length;
    
    for (let i = 0; i < items.length; i += concurrency) {
        const batch = items.slice(i, i + concurrency);
        const batchPromises = batch.map((item, batchIndex) => 
            analyzeItem(analyzer, item, i + batchIndex, total)
        );
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // 每个batch完成后稍作延迟，避免API限流
        if (i + concurrency < items.length) {
            console.log(`已完成 ${Math.min(i + concurrency, items.length)}/${items.length} 项，等待1秒后继续下一批...\n`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    return results;
}

async function main() {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    const inputFile = './prompt-collection.json';
    
    if (!apiKey) {
        console.error('请设置环境变量 DASHSCOPE_API_KEY');
        process.exit(1);
    }

    try {
        const data = fs.readFileSync(inputFile, 'utf8');
        const prompts = JSON.parse(data);
        
        console.log(`开始并发分析 ${prompts.length} 个提示词项目...\n`);
        
        const analyzer = new QianwenAnalyzer(apiKey);
        
        // 并发分析所有items
        const analyzedPrompts = await concurrentAnalyze(analyzer, prompts);
        
        // 直接更新原文件
        fs.writeFileSync(inputFile, JSON.stringify(analyzedPrompts, null, 2), 'utf8');
        
        console.log(`\n🎉 全部完成！已更新原文件: ${inputFile}`);
        console.log(`成功分析了 ${analyzedPrompts.length} 个项目`);
        
        // 统计分析结果
        const successCount = analyzedPrompts.filter(item => 
            item.analysis && Object.values(item.analysis).some(v => v.trim().length > 0)
        ).length;
        
        console.log(`成功率: ${successCount}/${analyzedPrompts.length} (${(successCount/analyzedPrompts.length*100).toFixed(1)}%)`);
        
    } catch (error) {
        console.error('分析过程失败:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
  main();
}