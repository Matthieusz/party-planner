import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const root = fileURLToPath(new URL("../../../", import.meta.url));

// Exercise the real Vite+ configuration, including overlapping override precedence.
test("the import fence rejects forbidden dependencies and permits inward imports", () => {
  const shared = mkdtempSync(join(root, "shared/import-fence-"));
  const browser = mkdtempSync(join(root, "frontend/src/import-fence-"));
  const app = mkdtempSync(join(root, "frontend/src/app/import-fence-"));
  const backend = mkdtempSync(join(root, "backend/import-fence-"));
  const fixtures = [
    { directory: shared, name: "server", source: "../../backend/identity/auth.ts", rejected: true },
    { directory: shared, name: "browser", source: "../../frontend/src/entry.ts", rejected: true },
    { directory: shared, name: "alias", source: "@/identity/message.ts", rejected: true },
    { directory: shared, name: "http", source: "effect/http/HttpClient", rejected: true },
    { directory: shared, name: "sql", source: "kysely", rejected: true },
    { directory: shared, name: "provider", source: "@alchemy.run/cloudflare", rejected: true },
    { directory: shared, name: "local-database", source: "./database.ts", rejected: true },
    { directory: shared, name: "schema", source: "effect/Schema", rejected: false },
    { directory: browser, name: "server", source: "../../../backend/worker.ts", rejected: true },
    { directory: browser, name: "runtime", source: "@effect/platform-node", rejected: true },
    {
      directory: browser,
      name: "shared",
      source: "../../../shared/identity/authenticated-identity.ts",
      rejected: false,
    },
    { directory: browser, name: "vendor-client", source: "better-auth/client", rejected: false },
    { directory: app, name: "vendor", source: "better-auth/client", rejected: true },
    { directory: app, name: "server", source: "../../../../backend/worker.ts", rejected: true },
    { directory: app, name: "adapter", source: "../../providers/mail.ts", rejected: true },
    { directory: app, name: "child", source: "../../identity/main.ts", rejected: false },
    { directory: browser, name: "commands", source: "better-auth/client", rejected: true },
    { directory: backend, name: "application", source: "kysely", rejected: true },
    { directory: backend, name: "workflow", source: "./database.ts", rejected: true },
    { directory: backend, name: "http", source: "effect/http/HttpRouter", rejected: false },
  ];

  try {
    const paths = fixtures.map(({ directory, name, source }) => {
      const path = join(directory, `${name}.ts`);
      // Re-exports and type-only imports must not provide an escape from the fence.
      writeFileSync(
        path,
        `export * from ${JSON.stringify(source)};\nimport type {} from ${JSON.stringify(source)};\n`,
      );
      return relative(root, path);
    });
    const result = spawnSync("vp", ["lint", "--format", "unix", ...paths], {
      cwd: root,
      encoding: "utf8",
      timeout: 30_000,
    });
    expect(result.error).toBeUndefined();
    const output = `${result.stdout}\n${result.stderr}`;
    expect(output).toContain("no-restricted-imports");
    for (const [index, fixture] of fixtures.entries()) {
      const diagnostics = output
        .split("\n")
        .filter(
          (line) => line.includes(`${paths[index]}:`) && line.includes("no-restricted-imports"),
        );
      expect(diagnostics.length, `${fixture.name}: ${fixture.source}\n${output}`).toBe(
        fixture.rejected ? 2 : 0,
      );
    }
  } finally {
    for (const directory of [shared, browser, app, backend]) {
      rmSync(directory, { recursive: true, force: true });
    }
  }
}, 40_000);
