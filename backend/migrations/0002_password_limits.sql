CREATE TABLE auth_rate_limits (
  key TEXT PRIMARY KEY,
  tokens REAL NOT NULL CHECK(tokens >= 0),
  updatedAt INTEGER NOT NULL
);
