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

export const DEFAULT_WS_PORT = 8082

export default {
  DEPARTMENTS,
  DEPT_NAME_MAP,
  DEPT_CODE_MAP,
  CHAT_ROOMS,
  DEFAULT_WS_PORT
}
