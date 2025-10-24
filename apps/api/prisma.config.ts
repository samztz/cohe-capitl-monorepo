import { defineConfig, env } from "prisma/config";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envFilePath = resolve(process.cwd(), ".env");
if (existsSync(envFilePath)) {
  const fileContents = readFileSync(envFilePath, "utf8");
  for (const line of fileContents.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const delimiterIndex = line.indexOf("=");
    if (delimiterIndex === -1) continue;

    const key = line.slice(0, delimiterIndex).trim();
    if (!key || key in process.env) continue;

    const value = line.slice(delimiterIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    process.env[key] = value;
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
