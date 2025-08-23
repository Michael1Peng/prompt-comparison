#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 读取 JSON 文件
function loadPromptData(filePath = 'pubcollection.json') {
    try {
        const dataPath = path.join(__dirname, filePath);
        const rawData = fs.readFileSync(dataPath, 'utf8');
        return JSON.parse(rawData);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error.message);
        process.exit(1);
    }
}

// 转义HTML特殊字符
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// 截取文本到指定长度
function truncateText(text, maxLength = 500) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// 生成单个表格的HTML（行列翻转版本）
function generateTable(prompts, tableIndex, hasTranslation = false) {
    const translationRows = hasTranslation ? `
        <tr class="translation-desc-row">
            <td class="field-label"><strong>中文描述</strong></td>
            ${prompts.map(prompt => `
                <td class="description-cell">
                    ${escapeHtml(prompt.translated_description || '未翻译')}
                </td>
            `).join('')}
        </tr>
        <tr class="translation-content-row">
            <td class="field-label"><strong>中文内容</strong></td>
            ${prompts.map(prompt => `
                <td class="content-cell">
                    <pre><code>${escapeHtml(prompt.translated_prompt || '未翻译')}</code></pre>
                </td>
            `).join('')}
        </tr>
    ` : '';

    const tableHtml = `
    <div class="table-container">
        <h2>Prompt Collection Table ${tableIndex}</h2>
        <div class="table-wrapper">
            <table class="prompt-table">
                <thead>
                    <tr>
                        <th class="field-header">Field</th>
                        ${prompts.map((prompt, index) => `
                            <th class="prompt-header">Prompt ${index + 1}</th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    <tr class="name-row">
                        <td class="field-label"><strong>Name</strong></td>
                        ${prompts.map(prompt => `
                            <td class="name-cell">
                                <strong>${escapeHtml(prompt.name)}</strong>
                            </td>
                        `).join('')}
                    </tr>
                    <tr class="description-row">
                        <td class="field-label"><strong>Description</strong></td>
                        ${prompts.map(prompt => `
                            <td class="description-cell">
                                ${escapeHtml(prompt.description)}
                            </td>
                        `).join('')}
                    </tr>
                    <tr class="content-row">
                        <td class="field-label"><strong>Original Content</strong></td>
                        ${prompts.map(prompt => `
                            <td class="content-cell">
                                <pre><code>${escapeHtml(prompt.original_prompt)}</code></pre>
                            </td>
                        `).join('')}
                    </tr>
                    ${translationRows}
                </tbody>
            </table>
        </div>
    </div>
    `;
    return tableHtml;
}

// 生成完整的HTML文档
function generateHtmlDocument(prompts) {
    // 检测是否有翻译字段
    const hasTranslation = prompts.some(p => p.translated_description || p.translated_prompt);
    
    // 将提示词按每4个分组
    const promptGroups = [];
    for (let i = 0; i < prompts.length; i += 4) {
        promptGroups.push(prompts.slice(i, i + 4));
    }

    const css = `
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 20px;
                background-color: #f5f5f5;
            }
            
            .container {
                max-width: 1400px;
                margin: 0 auto;
                background: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            
            h1 {
                color: #333;
                text-align: center;
                margin-bottom: 30px;
                font-size: 2.5em;
            }
            
            .table-container {
                margin-bottom: 50px;
                page-break-inside: avoid;
            }
            
            h2 {
                color: #444;
                border-bottom: 3px solid #007acc;
                padding-bottom: 10px;
                margin-bottom: 20px;
            }
            
            .table-wrapper {
                overflow-x: auto;
                margin-bottom: 20px;
                border: 1px solid #dee2e6;
                border-radius: 6px;
            }
            
            .prompt-table {
                width: 100%;
                min-width: 800px;
                border-collapse: collapse;
                background: white;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            .prompt-table th {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 12px;
                text-align: center;
                font-weight: 600;
                border: none;
            }
            
            .field-header {
                background: linear-gradient(135deg, #2c5aa0 0%, #1e3a72 100%) !important;
                text-align: left !important;
                width: 150px;
            }
            
            .prompt-header {
                min-width: 200px;
                max-width: 300px;
            }
            
            .prompt-table td {
                padding: 15px 12px;
                border-bottom: 1px solid #eee;
                border-right: 1px solid #eee;
                vertical-align: top;
            }
            
            .prompt-table tr:hover {
                background-color: #f8f9fa;
            }
            
            .field-label {
                background: #f1f3f4;
                font-weight: 600;
                color: #2c5aa0;
                text-align: left;
                width: 150px;
                position: sticky;
                left: 0;
                z-index: 1;
            }
            
            .name-cell {
                font-weight: 600;
                color: #2c5aa0;
                max-width: 250px;
                word-wrap: break-word;
            }
            
            .description-cell {
                color: #555;
                max-width: 300px;
                word-wrap: break-word;
                line-height: 1.4;
            }
            
            .content-cell {
                max-width: 400px;
                max-height: 300px;
                overflow-y: auto;
                overflow-x: auto;
            }
            
            .name-row {
                background: #f8fffe;
            }
            
            .description-row {
                background: #f8f9fa;
            }
            
            .content-row {
                background: #fafbfc;
            }
            
            .translation-desc-row {
                background: #f0f8ff;
            }
            
            .translation-content-row {
                background: #f5f5ff;
            }
            
            details {
                cursor: pointer;
            }
            
            summary {
                background: #f8f9fa;
                padding: 8px 12px;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                font-weight: 500;
                color: #495057;
                user-select: none;
            }
            
            summary:hover {
                background: #e9ecef;
            }
            
            pre {
                background: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 4px;
                padding: 10px;
                overflow: auto;
                margin: 0;
                font-size: 12px;
                line-height: 1.3;
                white-space: pre-wrap;
                word-wrap: break-word;
                max-height: 280px;
            }
            
            code {
                font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
                color: #333;
            }
            
            .stats {
                background: #e3f2fd;
                padding: 15px;
                border-radius: 6px;
                margin-bottom: 30px;
                text-align: center;
                color: #1565c0;
                font-weight: 500;
            }
            
            @media (max-width: 768px) {
                .container {
                    padding: 15px;
                }
                
                .prompt-table {
                    font-size: 14px;
                }
                
                .name-cell, .description-cell, .content-cell {
                    width: auto;
                }
            }
            
            @media print {
                body {
                    background: white;
                }
                
                .container {
                    box-shadow: none;
                    padding: 0;
                }
                
                .table-container {
                    page-break-before: always;
                }
                
                .table-container:first-child {
                    page-break-before: avoid;
                }
            }
        </style>
    `;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Prompt Collection Analysis Tables</title>
        ${css}
    </head>
    <body>
        <div class="container">
            <h1>🤖 Prompt Collection Analysis</h1>
            <div class="stats">
                📊 Total Prompts: ${prompts.length} | 📋 Tables: ${promptGroups.length} | 🔍 Source: RooCodeInc/roo-code
            </div>
            
            ${promptGroups.map((group, index) => 
                generateTable(group, index + 1, hasTranslation)
            ).join('')}
            
            <footer style="text-align: center; margin-top: 40px; color: #666; font-size: 14px;">
                <p>Generated on ${new Date().toLocaleDateString()} | Prompt Engineering Analysis</p>
            </footer>
        </div>
    </body>
    </html>
    `;

    return html;
}

// 生成Markdown格式的表格（行列翻转版本）
function generateMarkdownTables(prompts) {
    // 检测是否有翻译字段
    const hasTranslation = prompts.some(p => p.translated_description || p.translated_prompt);
    
    // 将提示词按每4个分组
    const promptGroups = [];
    for (let i = 0; i < prompts.length; i += 4) {
        promptGroups.push(prompts.slice(i, i + 4));
    }

    let markdown = `# Prompt Collection Analysis\n\n`;
    markdown += `**Total Prompts:** ${prompts.length} | **Tables:** ${promptGroups.length} | **Source:** RooCodeInc/roo-code\n\n`;
    if (hasTranslation) {
        markdown += `**🌐 Translation Available:** Chinese translations included\n\n`;
    }

    promptGroups.forEach((group, index) => {
        markdown += `## Table ${index + 1}\n\n`;
        
        // 创建表头
        markdown += `| Field |`;
        group.forEach((prompt, idx) => {
            markdown += ` Prompt ${idx + 1} |`;
        });
        markdown += `\n`;
        
        // 创建分隔线
        markdown += `|-------|`;
        group.forEach(() => {
            markdown += `----------|`;
        });
        markdown += `\n`;
        
        // Name行
        markdown += `| **Name** |`;
        group.forEach(prompt => {
            const name = prompt.name.replace(/\|/g, '\\|');
            markdown += ` **${name}** |`;
        });
        markdown += `\n`;
        
        // Description行
        markdown += `| **Description** |`;
        group.forEach(prompt => {
            const description = prompt.description.replace(/\|/g, '\\|').substring(0, 100) + '...';
            markdown += ` ${description} |`;
        });
        markdown += `\n`;
        
        // Original Content行
        markdown += `| **Original Content** |`;
        group.forEach(prompt => {
            // 在Markdown中显示内容的前200个字符作为预览
            const contentPreview = prompt.original_prompt.replace(/\|/g, '\\|').replace(/\n/g, ' ').substring(0, 200) + '...';
            markdown += ` ${contentPreview} |`;
        });
        markdown += `\n`;
        
        // 翻译字段
        if (hasTranslation) {
            // 中文描述行
            markdown += `| **中文描述** |`;
            group.forEach(prompt => {
                const description = (prompt.translated_description || '未翻译').replace(/\|/g, '\\|').substring(0, 100) + '...';
                markdown += ` ${description} |`;
            });
            markdown += `\n`;
            
            // 中文内容行
            markdown += `| **中文内容** |`;
            group.forEach(prompt => {
                const contentPreview = (prompt.translated_prompt || '未翻译').replace(/\|/g, '\\|').replace(/\n/g, ' ').substring(0, 200) + '...';
                markdown += ` ${contentPreview} |`;
            });
            markdown += `\n`;
        }
        
        markdown += `\n`;
    });

    return markdown;
}

// 主函数
function main() {
    console.log('🚀 Starting prompt table generation...');
    
    // 支持命令行参数指定输入文件
    const inputFile = process.argv[2] || 'prompt-collection.json';
    
    const prompts = loadPromptData(inputFile);
    console.log(`📊 Loaded ${prompts.length} prompts from ${inputFile}`);
    
    // 检测翻译状态
    const hasTranslation = prompts.some(p => p.translated_description || p.translated_prompt);
    if (hasTranslation) {
        console.log('🌐 Translation fields detected');
    }
    
    // 生成HTML文件
    const htmlContent = generateHtmlDocument(prompts);
    const htmlPath = path.join(__dirname, 'prompt-tables.html');
    fs.writeFileSync(htmlPath, htmlContent, 'utf8');
    console.log(`✅ Generated HTML tables: ${htmlPath}`);
    
    // 生成Markdown文件
    const markdownContent = generateMarkdownTables(prompts);
    const markdownPath = path.join(__dirname, 'prompt-tables.md');
    fs.writeFileSync(markdownPath, markdownContent, 'utf8');
    console.log(`✅ Generated Markdown tables: ${markdownPath}`);
    
    // 输出统计信息
    const tableCount = Math.ceil(prompts.length / 4);
    console.log(`\n📈 Summary:`);
    console.log(`   • Input file: ${inputFile}`);
    console.log(`   • Total prompts: ${prompts.length}`);
    console.log(`   • Tables generated: ${tableCount}`);
    console.log(`   • Prompts per table: 4`);
    console.log(`   • Translation support: ${hasTranslation ? 'Yes' : 'No'}`);
    console.log(`   • Output formats: HTML + Markdown`);
    
    console.log('\n🎉 Table generation completed successfully!');
}

// 执行脚本
if (require.main === module) {
    main();
}

module.exports = {
    loadPromptData,
    generateHtmlDocument,
    generateMarkdownTables
};