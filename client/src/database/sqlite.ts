import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('dadn_projects.db');

/**
 * Lớp 4 - Data Layer: Khởi tạo database SQLite cục bộ.
 * Tạo bảng projects nếu chưa có.
 */
export function initDatabase() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS projects (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      input_data  TEXT NOT NULL,
      is_synced   INTEGER DEFAULT 0,
      created_at  TEXT DEFAULT (datetime('now')),
      synced_at   TEXT
    );
  `);
}

/**
 * Lưu một bài toán mới vào SQLite với cờ is_synced = false.
 */
export function saveProjectLocal(name: string, inputData: object): number {
  const result = db.runSync(
    `INSERT INTO projects (name, input_data, is_synced) VALUES (?, ?, 0)`,
    [name, JSON.stringify(inputData)]
  );
  return result.lastInsertRowId;
}

/**
 * Lấy toàn bộ danh sách dự án (cho Dashboard).
 */
export function getAllProjects(): any[] {
  const rows = db.getAllSync(`SELECT * FROM projects ORDER BY created_at DESC`);
  return rows.map((row: any) => ({
    ...row,
    input_data: JSON.parse(row.input_data),
    is_synced: row.is_synced === 1,
  }));
}

/**
 * Lấy danh sách dự án chưa đồng bộ (is_synced = false).
 */
export function getUnsyncedProjects(): any[] {
  const rows = db.getAllSync(`SELECT * FROM projects WHERE is_synced = 0`);
  return rows.map((row: any) => ({
    ...row,
    input_data: JSON.parse(row.input_data),
  }));
}

/**
 * Đánh dấu dự án đã đồng bộ thành công (is_synced = true).
 */
export function markProjectSynced(id: number) {
  db.runSync(
    `UPDATE projects SET is_synced = 1, synced_at = datetime('now') WHERE id = ?`,
    [id]
  );
}
