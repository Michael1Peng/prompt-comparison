/**
 * 测试设置文件
 * 全局测试配置和工具函数
 */

// 全局测试配置
beforeAll(() => {
  // 设置测试环境变量
  process.env.NODE_ENV = 'test';

  // 可以在这里添加全局的测试初始化代码
});

afterAll(() => {
  // 清理测试环境
});

// 测试辅助函数
export const createMockFileSystem = () => {
  const files: Record<string, string> = {};

  return {
    writeFile: (path: string, content: string) => {
      files[path] = content;
    },
    readFile: (path: string) => {
      if (!(path in files)) {
        throw new Error(`File not found: ${path}`);
      }
      return files[path];
    },
    exists: (path: string) => path in files,
    clear: () => {
      Object.keys(files).forEach(key => delete files[key]);
    },
    getFiles: () => ({ ...files }),
  };
};

// Mock API 响应辅助函数
export const createMockApiResponse = <T>(data: T, delay = 0) => {
  return new Promise<T>(resolve => {
    setTimeout(() => resolve(data), delay);
  });
};

// 时间相关的测试工具
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
