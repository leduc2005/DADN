import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('dadn_projects.db');

// ─── Lớp 4 - Data Layer ────────────────────────────────────────────────────────
// Quản lý CSDL SQLite cục bộ cho hệ thống Offline-First.
// Bảng chính: projects (lưu bài toán)
// Bảng phụ: delete_queue (hàng đợi xóa đồng bộ Cloud)
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Khởi tạo database: Tạo bảng projects và delete_queue nếu chưa có.
 * Gọi 1 lần duy nhất khi App khởi động.
 */
export function initDatabase() {
  // Bảng chính: lưu bài toán tính toán
  db.execSync(`
    CREATE TABLE IF NOT EXISTS projects_v2 (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id    TEXT NOT NULL UNIQUE,
      name          TEXT NOT NULL,
      status        TEXT DEFAULT 'ĐANG THỰC HIỆN',
      input_data    TEXT NOT NULL,
      result_data   TEXT,
      is_synced     INTEGER DEFAULT 0,
      created_at    TEXT DEFAULT (datetime('now')),
      synced_at     TEXT
    );
  `);

  // Bảng phụ: hàng đợi xóa để đồng bộ kép (Offline Delete → Cloud Delete)
  db.execSync(`
    CREATE TABLE IF NOT EXISTS delete_queue_v2 (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id    TEXT NOT NULL,
      deleted_at    TEXT DEFAULT (datetime('now'))
    );
  `);
}

// ─── CRUD: Projects ─────────────────────────────────────────────────────────────

/**
 * Lưu một bài toán mới vào SQLite với cờ is_synced = false.
 * Được gọi khi người dùng nhấn "Lưu" tại popup xác nhận.
 */
export function saveProjectLocal(
  sessionId: string,
  name: string,
  inputData: object,
  resultData: object | null = null,
  status: string = 'HOÀN THÀNH',
): number {
  const result = db.runSync(
    `INSERT OR REPLACE INTO projects_v2 (session_id, name, status, input_data, result_data, is_synced, created_at)
     VALUES (?, ?, ?, ?, ?, 0, datetime('now'))`,
    [sessionId, name, status, JSON.stringify(inputData), resultData ? JSON.stringify(resultData) : null]
  );
  return result.lastInsertRowId;
}

/**
 * Lấy toàn bộ danh sách dự án (cho Dashboard HomeScreen).
 * Sắp xếp theo thời gian tạo mới nhất.
 */
export function getAllProjects(): any[] {
  const rows = db.getAllSync(`SELECT * FROM projects_v2 ORDER BY created_at DESC`);
  return rows.map((row: any) => ({
    ...row,
    input_data: safeJsonParse(row.input_data, {}),
    result_data: safeJsonParse(row.result_data, null),
    is_synced: row.is_synced === 1,
  }));
}

/**
 * Lấy chi tiết 1 bài toán theo session_id (cho chức năng Xem lại).
 */
export function getProjectBySessionId(sessionId: string): any | null {
  const row: any = db.getFirstSync(
    `SELECT * FROM projects_v2 WHERE session_id = ?`,
    [sessionId]
  );
  if (!row) return null;
  return {
    ...row,
    input_data: safeJsonParse(row.input_data, {}),
    result_data: safeJsonParse(row.result_data, null),
    is_synced: row.is_synced === 1,
  };
}

/**
 * Cập nhật bài toán đã chỉnh sửa.
 * ⚠️ QUAN TRỌNG: Luôn set is_synced = false để useSyncEngine đẩy bản mới lên Cloud.
 */
export function updateProjectLocal(sessionId: string, data: {
  name?: string;
  status?: string;
  inputData?: object;
  resultData?: object | null;
}) {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    values.push(data.status);
  }
  if (data.inputData !== undefined) {
    fields.push('input_data = ?');
    values.push(JSON.stringify(data.inputData));
  }
  if (data.resultData !== undefined) {
    fields.push('result_data = ?');
    values.push(data.resultData ? JSON.stringify(data.resultData) : null);
  }

  // ⚠️ BẮT BUỘC reset is_synced = false khi Edit
  fields.push('is_synced = 0');
  fields.push('synced_at = NULL');

  if (fields.length === 0) return;

  values.push(sessionId);
  db.runSync(
    `UPDATE projects_v2 SET ${fields.join(', ')} WHERE session_id = ?`,
    values
  );
}

/**
 * Xóa bài toán khỏi SQLite.
 * Nếu bài toán đã sync (is_synced = true), thêm vào delete_queue.
 */
export function deleteProjectLocal(sessionId: string) {
  // Kiểm tra trạng thái sync trước khi xóa
  const row: any = db.getFirstSync(
    `SELECT is_synced FROM projects_v2 WHERE session_id = ?`,
    [sessionId]
  );

  if (row && row.is_synced === 1) {
    // Đã sync → thêm vào hàng đợi xóa để đồng bộ lên Cloud
    db.runSync(
      `INSERT INTO delete_queue_v2 (session_id) VALUES (?)`,
      [sessionId]
    );
  }

  // Xóa khỏi bảng projects
  db.runSync(`DELETE FROM projects_v2 WHERE session_id = ?`, [sessionId]);
}

/**
 * Lấy danh sách dự án chưa đồng bộ (is_synced = false).
 * Dùng bởi useSyncEngine để push lên Cloud.
 */
export function getUnsyncedProjects(): any[] {
  const rows = db.getAllSync(`SELECT * FROM projects_v2 WHERE is_synced = 0`);
  return rows.map((row: any) => ({
    ...row,
    input_data: safeJsonParse(row.input_data, {}),
    result_data: safeJsonParse(row.result_data, null),
  }));
}

/**
 * Đánh dấu dự án đã đồng bộ thành công (is_synced = true).
 */
export function markProjectSynced(sessionId: string) {
  db.runSync(
    `UPDATE projects_v2 SET is_synced = 1, synced_at = datetime('now') WHERE session_id = ?`,
    [sessionId]
  );
}

// ─── CRUD: Delete Queue ─────────────────────────────────────────────────────────

/**
 * Lấy danh sách session_id cần xóa trên Cloud.
 */
export function getDeleteQueue(): string[] {
  const rows = db.getAllSync(`SELECT session_id FROM delete_queue_v2`);
  return rows.map((row: any) => row.session_id);
}

/**
 * Xóa một mục khỏi hàng đợi sau khi Cloud đã xóa thành công.
 */
export function removeFromDeleteQueue(sessionId: string) {
  db.runSync(`DELETE FROM delete_queue_v2 WHERE session_id = ?`, [sessionId]);
}

/**
 * Xóa toàn bộ hàng đợi (dùng khi sync batch thành công).
 */
export function clearDeleteQueue() {
  db.runSync(`DELETE FROM delete_queue_v2`);
}

// ─── Helper ─────────────────────────────────────────────────────────────────────

function safeJsonParse(jsonStr: string | null, fallback: any): any {
  if (!jsonStr) return fallback;
  try {
    return JSON.parse(jsonStr);
  } catch {
    return fallback;
  }
}
