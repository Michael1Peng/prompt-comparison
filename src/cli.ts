#!/usr/bin/env node
/**
 * CLI主入口文件 - 用于bin字段
 */

import { main } from './cli/index.js';

main().catch(err => {
  console.error('CLI执行失败:', err.message);
  process.exit(1);
});