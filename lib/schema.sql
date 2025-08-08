-- Database schema for Chinese novel reader
-- Run this with: turso db execute <database-name> --file schema.sql

-- Novels table
CREATE TABLE IF NOT EXISTS novels (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT '其他',
  cover TEXT,
  status TEXT DEFAULT '连载中',
  source TEXT,
  word_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_update TEXT,
  latest_chapter TEXT
);

-- Chapters table
CREATE TABLE IF NOT EXISTS chapters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  novel_id TEXT NOT NULL,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  url TEXT,
  is_vip BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE,
  UNIQUE(novel_id, chapter_number)
);

-- Import tasks table (for tracking import progress)
CREATE TABLE IF NOT EXISTS import_tasks (
  id TEXT PRIMARY KEY,
  novel_id TEXT,
  task_type TEXT NOT NULL, -- 'import', 'update', 'retry'
  status TEXT NOT NULL, -- 'pending', 'in_progress', 'completed', 'failed'
  total_chapters INTEGER DEFAULT 0,
  imported_chapters INTEGER DEFAULT 0,
  failed_chapters INTEGER DEFAULT 0,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_novels_title ON novels(title);
CREATE INDEX IF NOT EXISTS idx_novels_author ON novels(author);
CREATE INDEX IF NOT EXISTS idx_novels_category ON novels(category);
CREATE INDEX IF NOT EXISTS idx_novels_created_at ON novels(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chapters_novel_id ON chapters(novel_id);
CREATE INDEX IF NOT EXISTS idx_chapters_novel_number ON chapters(novel_id, chapter_number);
CREATE INDEX IF NOT EXISTS idx_import_tasks_status ON import_tasks(status);
CREATE INDEX IF NOT EXISTS idx_import_tasks_novel_id ON import_tasks(novel_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_novels_updated_at 
  AFTER UPDATE ON novels
  FOR EACH ROW
BEGIN
  UPDATE novels SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_chapters_updated_at 
  AFTER UPDATE ON chapters
  FOR EACH ROW
BEGIN
  UPDATE chapters SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_import_tasks_updated_at 
  AFTER UPDATE ON import_tasks
  FOR EACH ROW
BEGIN
  UPDATE import_tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;