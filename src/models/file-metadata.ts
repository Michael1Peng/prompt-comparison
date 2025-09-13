/**
 * 文件元数据模型
 * 记录仓库中所有扫描文件的基本信息和处理状态
 */

export interface FileMetadata {
  // 标识字段
  file_id: string;                    // 唯一标识符 (UUID)
  absolute_path: string;              // 绝对文件路径
  relative_path: string;              // 相对于仓库根目录的路径
  file_name: string;                  // 文件名(含扩展名)
  
  // 文件属性
  file_extension: string;             // 文件扩展名(.js, .md等)
  file_size_bytes: number;            // 文件大小(字节)
  encoding: string;                   // 文件编码(utf-8, gbk等)
  line_count: number;                 // 文件行数
  
  // 时间戳
  created_time: string;               // 文件创建时间(ISO 8601)
  modified_time: string;              // 文件修改时间(ISO 8601)
  scanned_time?: string;              // 扫描时间(ISO 8601)
  
  // 内容特征
  file_hash: string;                  // 文件内容MD5哈希
  content_preview?: string;           // 文件前500字符预览
  
  // 处理状态
  has_prompts: boolean;               // 是否包含提示词
  prompt_count: number;               // 包含的提示词数量
  scan_status: 'pending' | 'scanned' | 'error' | 'skipped';
  error_message?: string;             // 错误信息(如果有)
  
  // 统计信息
  character_count?: number;           // 字符数
  word_count?: number;               // 单词数
  detected_language?: string;         // 检测到的主要语言
}

/**
 * 创建FileMetadata实例的工厂函数
 */
export function createFileMetadata(partial: Partial<FileMetadata>): FileMetadata {
  return {
    file_id: partial.file_id || '',
    absolute_path: partial.absolute_path || '',
    relative_path: partial.relative_path || '',
    file_name: partial.file_name || '',
    file_extension: partial.file_extension || '',
    file_size_bytes: partial.file_size_bytes || 0,
    encoding: partial.encoding || 'utf-8',
    line_count: partial.line_count || 0,
    created_time: partial.created_time || new Date().toISOString(),
    modified_time: partial.modified_time || new Date().toISOString(),
    file_hash: partial.file_hash || '',
    has_prompts: partial.has_prompts || false,
    prompt_count: partial.prompt_count || 0,
    scan_status: partial.scan_status || 'pending',
    ...partial
  };
}

/**
 * 验证FileMetadata数据
 */
export function validateFileMetadata(data: FileMetadata): boolean {
  // 必填字段验证
  if (!data.file_id || !data.absolute_path) {
    return false;
  }
  
  // 数值范围验证
  if (data.file_size_bytes < 0 || data.line_count < 0) {
    return false;
  }
  
  // 逻辑一致性验证
  if (data.has_prompts && data.prompt_count <= 0) {
    return false;
  }
  
  return true;
}