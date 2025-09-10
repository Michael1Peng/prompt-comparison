#!/usr/bin/env node

const fs = require('fs');
const QianwenTranslator = require('./translate.js');

async function translateItem(translator, item) {
    const result = { ...item };
    const tasks = [];
    
    if (item.original_prompt) {
        tasks.push(
            translator.translate(item.original_prompt, 'Chinese')
                .then(text => result.translated_prompt = text)
        );
    }
    
    if (item.description) {
        tasks.push(
            translator.translate(item.description, 'Chinese')
                .then(text => result.translated_description = text)
        );
    }
    
    await Promise.all(tasks);
    return result;
}

async function concurrentMap(items, fn, concurrency = 5) {
    const results = [];
    for (let i = 0; i < items.length; i += concurrency) {
        const batch = items.slice(i, i + concurrency);
        const batchResults = await Promise.all(batch.map(fn));
        results.push(...batchResults);
    }
    return results;
}

async function main() {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    const inputFile = process.argv[2];
    const outputFile = process.argv[3];

    if (!apiKey) process.exit(1);
    if (!inputFile) process.exit(1);

    const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    const translator = new QianwenTranslator(apiKey);
    
    console.log(`并发翻译 ${data.length} 个项目...`);
    const results = await concurrentMap(data, item => translateItem(translator, item));
    
    const output = outputFile || inputFile.replace('.json', '-translated.json');
    fs.writeFileSync(output, JSON.stringify(results, null, 2));
    console.log(`完成: ${output}`);
}

if (require.main === module) main();
