/**
 * 登記逾期案件共用時間工具
 * 限辦期限格式範例："113-06-26 15:58:00"（民國年）
 */
export const HOUR = 3600 * 1000
export const DAY = 24 * HOUR

export function parseRocDateTime (val) {
  if (typeof val !== 'string') { return NaN }
  const m = val.trim().match(/^(\d{2,3})[-/](\d{1,2})[-/](\d{1,2})(?:[\sT]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/)
  if (!m) { return NaN }
  return new Date(
    1911 + parseInt(m[1], 10),
    parseInt(m[2], 10) - 1,
    parseInt(m[3], 10),
    parseInt(m[4] || 0, 10),
    parseInt(m[5] || 0, 10),
    parseInt(m[6] || 0, 10)
  ).getTime()
}

export function humanizeDuration (ms) {
  const abs = Math.abs(ms)
  if (abs < HOUR) { return `${Math.max(1, Math.round(abs / 60000))} 分鐘` }
  if (abs < 2 * DAY) { return `${(abs / HOUR).toFixed(1)} 小時` }
  return `${(abs / DAY).toFixed(1)} 天`
}

/**
 * 緊急度：crit(紅) / warn(橘) / over(已逾期但不嚴重) / ok / unknown
 */
export function urgencyLevel (remainMs) {
  if (isNaN(remainMs)) { return 'unknown' }
  if (remainMs > 0) {
    if (remainMs <= HOUR) { return 'crit' }
    if (remainMs <= 4 * HOUR) { return 'warn' }
    return 'ok'
  }
  const elapsed = -remainMs
  if (elapsed > 3 * DAY) { return 'crit' }
  if (elapsed > DAY) { return 'warn' }
  return 'over'
}
