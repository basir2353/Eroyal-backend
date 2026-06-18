type LogMeta = Record<string, unknown>;

function formatMeta(meta?: LogMeta) {
  if (!meta || Object.keys(meta).length === 0) return "";
  return ` ${JSON.stringify(meta)}`;
}

export const logger = {
  info(message: string, meta?: LogMeta) {
    console.log(`[INFO] ${new Date().toISOString()} ${message}${formatMeta(meta)}`);
  },
  warn(message: string, meta?: LogMeta) {
    console.warn(`[WARN] ${new Date().toISOString()} ${message}${formatMeta(meta)}`);
  },
  error(message: string, meta?: LogMeta) {
    console.error(`[ERROR] ${new Date().toISOString()} ${message}${formatMeta(meta)}`);
  },
};
