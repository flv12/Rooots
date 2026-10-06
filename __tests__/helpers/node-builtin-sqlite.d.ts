// Minimal typings for Node's built-in SQLite, used only by the test database helper
// (the app itself does not depend on Node types).
declare module 'node:sqlite' {
  type Value = string | number | bigint | null | Uint8Array;
  class StatementSync {
    run(...params: Value[]): { changes: number | bigint; lastInsertRowid: number | bigint };
    all(...params: Value[]): unknown[];
    get(...params: Value[]): unknown;
  }
  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
  }
}
