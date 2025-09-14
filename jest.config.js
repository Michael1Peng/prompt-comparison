export default {
  // 测试环境
  testEnvironment: 'node',
  
  // ESM 支持
  preset: null,
  transform: {},
  
  // 测试文件匹配模式 - 只匹配我们的测试
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  
  // 忽略 RooCodeInc 目录中的测试
  testPathIgnorePatterns: [
    '/node_modules/',
    '/RooCodeInc/'
  ],
  
  // 覆盖率配置
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js'
  ],
  
  // 覆盖率报告
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // 测试超时 - 增加到30秒以支持真实API调用
  testTimeout: 30000,
  
  // 清理模拟
  clearMocks: true,
  
  // 详细输出
  verbose: true,
  
  // 监视文件变化时忽略的路径
  watchPathIgnorePatterns: [
    'node_modules',
    'coverage',
    'analysis',
    'RooCodeInc'
  ]
};