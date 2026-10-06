export type SqlValue = string | number | null;

/**
 * The subset of expo-sqlite's SQLiteDatabase we rely on. Keeping it small lets tests run the
 * same SQL against Node's built-in SQLite.
 */
export interface SqlDb {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params: SqlValue[]): Promise<{ lastInsertRowId: number; changes: number }>;
  getAllAsync<T>(sql: string, params: SqlValue[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params: SqlValue[]): Promise<T | null>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}
