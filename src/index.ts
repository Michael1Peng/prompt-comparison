/**
 * 主入口文件
 * 临时文件用于验证TypeScript配置
 */

export const VERSION = '1.0.0';

export const greet = (name: string): string => {
  return `Hello, ${name}!`;
};

// 临时导出，后续会被实际的CLI入口替换
export default {
  VERSION,
  greet,
};
