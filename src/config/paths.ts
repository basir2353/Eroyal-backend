import path from "path";
import { fileURLToPath } from "url";

const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Local upload folder — always under backend/, not process.cwd() */
export const UPLOADS_DIR = path.join(backendRoot, "uploads");
