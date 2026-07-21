import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Resolve environment variables from the root .env dynamically
let envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  envPath = path.resolve(process.cwd(), '../../.env');
}
if (!fs.existsSync(envPath)) {
  envPath = path.resolve(process.cwd(), '../.env');
}

dotenv.config({ path: envPath });
