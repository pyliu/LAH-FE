export const DEPARTMENTS = {
  INF: 'inf',
  ADM: 'adm',
  REG: 'reg',
  SUR: 'sur',
  VAL: 'val',
  HR: 'hr',
  ACC: 'acc',
  SUPERVISOR: 'supervisor',
  LDS: 'lds'
}

export const DEPT_NAME_MAP = {
  [DEPARTMENTS.INF]: '資訊課',
  [DEPARTMENTS.ADM]: '行政課',
  [DEPARTMENTS.REG]: '登記課',
  [DEPARTMENTS.SUR]: '測量課',
  [DEPARTMENTS.VAL]: '地價課',
  [DEPARTMENTS.HR]: '人事室',
  [DEPARTMENTS.ACC]: '會計室',
  [DEPARTMENTS.SUPERVISOR]: '主任祕書室',
  [DEPARTMENTS.LDS]: '全所'
}

export const DEPT_CODE_MAP = Object.entries(DEPT_NAME_MAP).reduce((acc, [key, value]) => {
  acc[value] = key
  return acc
}, {})

export const CHAT_ROOMS = ['lds', 'adm', 'inf', 'val', 'reg', 'sur', 'acc', 'hr', 'supervisor']

export const DEFAULT_WS_PORT = 8081

export const getDepartmentCode = (deptName, fallback = 'inf') => {
  if (!deptName) {
    return fallback
  }
  const s = String(deptName).toLowerCase().trim()
  if (DEPT_CODE_MAP[deptName]) {
    return DEPT_CODE_MAP[deptName]
  }
  if (DEPT_CODE_MAP[s]) {
    return DEPT_CODE_MAP[s]
  }
  if (s.includes('資訊') || s === 'inf') {
    return 'inf'
  }
  if (s.includes('登記') || s === 'reg') {
    return 'reg'
  }
  if (s.includes('地價') || s === 'val') {
    return 'val'
  }
  if (s.includes('測量') || s === 'sur') {
    return 'sur'
  }
  if (s.includes('行政') || s === 'adm') {
    return 'adm'
  }
  if (s.includes('人事') || s === 'hr') {
    return 'hr'
  }
  if (s.includes('會計') || s === 'acc') {
    return 'acc'
  }
  if (s.includes('主秘') || s.includes('主任祕書') || s.includes('主任秘書') || s.includes('秘書') || s === 'supervisor') {
    return 'supervisor'
  }
  if (s.includes('全所') || s === 'lds') {
    return 'lds'
  }
  return fallback
}

export default {
  DEPARTMENTS,
  DEPT_NAME_MAP,
  DEPT_CODE_MAP,
  CHAT_ROOMS,
  DEFAULT_WS_PORT,
  getDepartmentCode
}
