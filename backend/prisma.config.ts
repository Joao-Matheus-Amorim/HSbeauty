/// <reference types="node" />
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';
import { PrismaNeon } from '@prisma/adapter-neon';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '.env') });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL!,
    adapter: () => new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  },
});
