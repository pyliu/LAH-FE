/**
 * 行政程序法第 48 條假日順延試算與國定例假日判定模組
 *
 * 《行政程序法》第 48 條第 4 項：
 * 「期間之末日為星期日、國定假日或其他休息日者，以該日之次日為期間之末日；期間之末日為星期六者，以其次星期一為期間之末日。」
 */

export const TAIWAN_HOLIDAYS = {
  // 2024
  '2024-01-01': '開國紀念日',
  '2024-02-08': '小年夜',
  '2024-02-09': '農曆除夕',
  '2024-02-10': '春節初一',
  '2024-02-11': '春節初二',
  '2024-02-12': '春節初三',
  '2024-02-13': '春節補假',
  '2024-02-14': '春節補假',
  '2024-02-28': '和平紀念日',
  '2024-04-04': '兒童節',
  '2024-04-05': '民族掃墓節',
  '2024-05-01': '勞動節',
  '2024-06-10': '端午節',
  '2024-09-17': '中秋節',
  '2024-10-10': '國慶日',

  // 2025
  '2025-01-01': '開國紀念日',
  '2025-01-27': '農曆春節彈性放假',
  '2025-01-28': '農曆除夕',
  '2025-01-29': '春節初一',
  '2025-01-30': '春節初二',
  '2025-01-31': '春節初三',
  '2025-02-28': '和平紀念日',
  '2025-04-03': '兒童節清明彈性放假',
  '2025-04-04': '兒童節及民族掃墓節',
  '2025-05-01': '勞動節',
  '2025-05-30': '端午節補假',
  '2025-05-31': '端午節',
  '2025-10-06': '中秋節',
  '2025-10-10': '國慶日',

  // 2026
  '2026-01-01': '開國紀念日',
  '2026-02-16': '農曆除夕',
  '2026-02-17': '春節初一',
  '2026-02-18': '春節初二',
  '2026-02-19': '春節初三',
  '2026-02-20': '春節補假',
  '2026-02-27': '和平紀念日補假',
  '2026-02-28': '和平紀念日',
  '2026-04-03': '兒童節清明補假',
  '2026-04-04': '兒童節',
  '2026-04-05': '民族掃墓節',
  '2026-04-06': '掃墓節補假',
  '2026-05-01': '勞動節',
  '2026-06-19': '端午節',
  '2026-09-25': '中秋節',
  '2026-10-09': '國慶日補假',
  '2026-10-10': '國慶日',

  // 2027
  '2027-01-01': '開國紀念日',
  '2027-02-05': '農曆除夕',
  '2027-02-06': '春節初一',
  '2027-02-07': '春節初二',
  '2027-02-08': '春節初三',
  '2027-02-09': '春節補假',
  '2027-02-26': '和平紀念日補假',
  '2027-02-28': '和平紀念日',
  '2027-04-02': '兒童清明連假補假',
  '2027-04-04': '兒童節',
  '2027-04-05': '民族掃墓節',
  '2027-05-01': '勞動節',
  '2027-06-09': '端午節',
  '2027-09-15': '中秋節',
  '2027-10-08': '國慶日補假',
  '2027-10-10': '國慶日'
}

/**
 * 格式化 Date 為 YYYY-MM-DD
 */
export function formatDateISO (date) {
  if (!date || isNaN(date.getTime())) { return '' }
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * 格式化 Date 為 YYYY/MM/DD
 */
export function formatDateSlash (date) {
  if (!date || isNaN(date.getTime())) { return '' }
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}/${m}/${d}`
}

/**
 * 轉為民國年字串 (YYY-MM-DD)
 */
export function toMinguoDateString (dateStr) {
  if (!dateStr) { return '' }
  const clean = dateStr.replace(/\//g, '-')
  const parts = clean.split('-')
  if (parts.length < 3) { return dateStr }
  const year = parseInt(parts[0], 10)
  if (isNaN(year) || year < 1911) { return dateStr }
  return `${year - 1911}-${parts[1]}-${parts[2]}`
}

/**
 * 判斷是否為休假日 (週六、週日或國定假日)
 */
export function isOffDay (date, customHolidays = {}) {
  if (!date || isNaN(date.getTime())) { return false }
  const day = date.getDay()
  // 週日 (0) 或 週六 (6)
  if (day === 0 || day === 6) {
    return {
      isOff: true,
      reason: day === 0 ? '星期日' : '星期六'
    }
  }
  const iso = formatDateISO(date)
  if (customHolidays && customHolidays[iso]) {
    return {
      isOff: true,
      reason: customHolidays[iso]
    }
  }
  if (TAIWAN_HOLIDAYS[iso]) {
    return {
      isOff: true,
      reason: TAIWAN_HOLIDAYS[iso]
    }
  }
  return {
    isOff: false,
    reason: ''
  }
}

/**
 * 依據行政程序法第48條計算補正到期日與可駁回日
 *
 * @param {string|Date} deliveredDate 通知書送達日
 * @param {number} days 補正天數 (預設15天)
 * @param {object} customHolidays 自訂/伺服器同步假日表
 * @returns {object} 計算結果
 */
export function calculateLegalFixDeadline (deliveredDate, days = 15, customHolidays = {}) {
  if (!deliveredDate) {
    return {
      deliveredDate: '',
      baseDueDate: '',
      dueDate: '',
      dueDateMinguo: '',
      rejectDate: '',
      rejectDateMinguo: '',
      isRolledOver: false,
      rolloverDays: 0,
      reasons: [],
      tooltipText: '',
      status: 'PENDING_DELIVERY',
      statusText: '待填送達日',
      statusVariant: 'secondary',
      daysDiff: null
    }
  }

  // 標準化送達日期 (避免時區偏移，採正午解析)
  const dateStr = typeof deliveredDate === 'string'
    ? deliveredDate.replace(/\//g, '-').trim()
    : formatDateISO(deliveredDate)

  const [y, m, d] = dateStr.split('-').map(v => parseInt(v, 10))
  if (isNaN(y) || isNaN(m) || isNaN(d)) {
    return { status: 'PENDING_DELIVERY', statusText: '日期無效' }
  }

  // 基準到期日 = 送達日 + days
  const baseDate = new Date(y, m - 1, d)
  baseDate.setDate(baseDate.getDate() + (parseInt(days, 10) || 15))
  const baseDueDateStr = formatDateISO(baseDate)

  // 檢查末日是否適逢休息日 (依行政程序法第48條第4項順延)
  const cur = new Date(baseDate.getTime())
  let rolledOver = false
  let rolloverDays = 0
  const reasons = []

  let offCheck = isOffDay(cur, customHolidays)
  while (offCheck.isOff) {
    rolledOver = true
    rolloverDays++
    reasons.push(`${formatDateISO(cur)}（${offCheck.reason}）`)
    cur.setDate(cur.getDate() + 1)
    offCheck = isOffDay(cur, customHolidays)
  }

  const adjustedDueDateStr = formatDateISO(cur)

  // 可駁回日 = 到期日 + 1 天
  const rejectDateObj = new Date(cur.getTime())
  rejectDateObj.setDate(rejectDateObj.getDate() + 1)
  const rejectDateStr = formatDateISO(rejectDateObj)

  // 狀態判定 (以當前日期為基準)
  const now = new Date()
  const todayStr = formatDateISO(now)
  const todayObj = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dueObj = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate())
  const diffTime = dueObj.getTime() - todayObj.getTime()
  const daysDiff = Math.round(diffTime / (1000 * 60 * 60 * 24))

  let status = 'IN_PROGRESS'
  let statusText = '補正中'
  let statusVariant = 'success'

  if (todayStr >= rejectDateStr) {
    status = 'REJECTABLE'
    statusText = '已可駁回'
    statusVariant = 'danger'
  } else if (daysDiff <= 3 && daysDiff >= 0) {
    status = 'DUE_SOON'
    statusText = daysDiff === 0 ? '今日到期' : `${daysDiff}日內到期`
    statusVariant = 'warning'
  } else if (daysDiff < 0) {
    // 今日剛好等於到期日當天晚間或次日未達駁回
    status = 'REJECTABLE'
    statusText = '已可駁回'
    statusVariant = 'danger'
  }

  let tooltipText = ''
  if (rolledOver) {
    tooltipText = `原期滿日為 ${baseDueDateStr}，因末日適逢${reasons.join('、')}，依行政程序法第48條規定順延至次一工作日（${adjustedDueDateStr}）。`
  }

  return {
    deliveredDate: dateStr,
    baseDueDate: baseDueDateStr,
    dueDate: adjustedDueDateStr,
    dueDateMinguo: toMinguoDateString(adjustedDueDateStr),
    rejectDate: rejectDateStr,
    rejectDateMinguo: toMinguoDateString(rejectDateStr),
    isRolledOver: rolledOver,
    rolloverDays,
    reasons,
    tooltipText,
    status,
    statusText,
    statusVariant,
    daysDiff
  }
}

export default {
  methods: {
    calculateFixDeadline: calculateLegalFixDeadline,
    toMinguoDate: toMinguoDateString,
    formatDateISO
  }
}
