/* eslint-disable no-control-regex */
/* eslint-disable prefer-regex-literals */
/* eslint-disable prefer-promise-reject-errors */
import uploadAxios from 'axios'
import { format, formatDistanceToNow } from 'date-fns'
import $ from 'jquery'
import chunk from 'lodash/chunk'
import compact from 'lodash/compact'
import debounce from 'lodash/debounce'
import difference from 'lodash/difference'
import differenceWith from 'lodash/differenceWith'
import escape from 'lodash/escape'
import filter from 'lodash/filter'
import get from 'lodash/get'
import groupBy from 'lodash/groupBy'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import isEqualWith from 'lodash/isEqualWith'
import orderBy from 'lodash/orderBy'
import reject from 'lodash/reject'
import remove from 'lodash/remove'
import sortBy from 'lodash/sortBy'
import sortedUniq from 'lodash/sortedUniq'
import uniqBy from 'lodash/uniqBy'
import uniqWith from 'lodash/uniqWith'
import without from 'lodash/without'
import _md5 from 'md5'
// Require tw locale
import { zhTW } from 'date-fns/locale'

import DOMPurify from 'dompurify'
import { marked } from 'marked'

import highlightWords from 'highlight-words'
marked.setOptions({
  breaks: true
})

export default ({ $axios, store, $config }, inject) => {
  // global const variables, use this.$consts.xxxx to access them in Vue
  const consts = {
    // ✨ 集中管理的監控儀表板清單
    DEFAULT_DASHBOARDS: [
      { id: 'xap', comp: 'lah-monitor-board-xap', header: 'XAP 服務', icon: 'server', footer: false, pinned: true },
      // specify props to pass to component, e.g. {props: {isMailChecker: true}} will pass isMailChecker as a prop to the component, and it will trigger mail checking function in the component to fetch message count
      { id: 'powerha', comp: 'lah-monitor-board-powerha', header: 'PowerHA 狀態', icon: 'project-diagram', footer: true, pinned: true, props: { isMailChecker: true } },
      { id: 'dataguard', comp: 'lah-monitor-board-dataguard', header: 'DataGuard 同步', icon: 'database', footer: true, pinned: true },
      { id: 'xap-trend', comp: 'lah-monitor-board-xap-trend', header: 'XAP 案件趨勢', icon: 'chart-line', footer: false, props: { watchTopXap: true, reloadTime: 15 } },
      { id: 'srmas', comp: 'lah-monitor-board-srmas', header: 'SRMAS 系統', icon: 'desktop', footer: true, extraClass: 'fix-img' },
      { id: 'hacmp', comp: 'lah-monitor-board-hacmp', header: 'HACMP 狀態', icon: 'shield-alt', footer: true },
      { id: 'sms-notify', comp: 'lah-monitor-board-sms-notify', header: '地籍異動即時通', icon: 'bell', footer: true },
      { id: 'sms', comp: 'lah-monitor-board-sms', header: '綜合簡訊監控', icon: 'envelope', footer: true },
      { id: 'l05', comp: 'lah-monitor-board-L05', header: 'L05 系統', icon: 'hdd', footer: true },
      { id: 'apbackup', comp: 'lah-monitor-board-apbackup', header: 'AP 主機備份', icon: 'save', footer: true },
      { id: 'xcase-sync', comp: 'lah-monitor-board-xcase-sync', header: '跨縣市案件同步', icon: 'sync', footer: false },
      { id: 'site-hx', comp: 'lah-monitor-board-site-hx', header: '桃園市各所狀態', icon: 'map-marker-alt', footer: false },
      { id: 'lxhweb', comp: 'lah-monitor-board-lxhweb', header: 'L3HWEB 主機', icon: 'network-wired', footer: false, props: { targetIp: 'L3HWEB', link: true, displayUpdateTime: true } },
      { id: 'site-tw', comp: 'lah-monitor-board-site-tw', header: '全國各所狀態', icon: 'globe', footer: false },
      { id: 'dbbackup', comp: 'lah-monitor-board-dbbackup', header: '資料庫備份', icon: 'database', footer: true },
      { id: 'connectivity', comp: 'lah-monitor-board-connectivity', header: '外部連線狀態', icon: 'wifi', footer: false },
      { id: 'vmclone', comp: 'lah-monitor-board-vmclone', header: 'VM Clone 狀態', icon: 'clone', footer: true, devOnly: true },
      { id: 'tape', comp: 'lah-monitor-board-tape', header: '磁帶備份', icon: 'tape', footer: true },
      { id: 'testdb', comp: 'lah-monitor-board-testdb', header: '測試資料庫', icon: 'vials', footer: false, devOnly: true },
      { id: 'adsync', comp: 'lah-monitor-board-adsync', header: 'AD 帳號同步', icon: 'users-cog', footer: true, devOnly: true },
      { id: 'apconn', comp: 'lah-monitor-board-apconn', header: 'AP 連線數', icon: 'users', footer: false },
      { id: 'ups', comp: 'lah-monitor-board-ups', header: 'UPS 不斷電系統', icon: 'plug', footer: true, devOnly: true }
    ],
    dayMilliseconds: 8640000,
    animateAttentionSeekers: ['bounce', 'flash', 'pulse', 'rubberBand', 'shakeX', 'shakeY', 'headShake', 'swing', 'tada', 'wobble', 'jello', 'heartBeat'],
    loadingAction: [ // (https://loading.io/animation/)
      'ld-heartbeat', 'ld-beat', 'ld-blink', 'ld-bounce', 'ld-bounceAlt', 'ld-breath', 'ld-wrench', 'ld-surprise',
      'ld-clock', 'ld-jump', 'ld-hit', 'ld-fade', 'ld-flip', 'ld-float', 'ld-move-ltr', 'ld-tremble', 'ld-tick',
      'ld-move-rtl', 'ld-move-ttb', 'ld-move-btt', 'ld-move-fade-ltr', 'ld-move-fade-rtl', 'ld-move-fade-ttb',
      'ld-move-fade-btt', 'ld-dim', 'ld-swing', 'ld-wander', 'ld-pulse', 'ld-cycle', 'ld-cycle-alt', 'ld-damage',
      'ld-fade', 'ld-flip', 'ld-flip-h', 'ld-flip-v', 'ld-float', 'ld-jelly', 'ld-jelly-alt', 'ld-jingle',
      'ld-measure', 'ld-metronome', 'ld-orbit', 'ld-rubber-h', 'ld-rubber-v', 'ld-rush-btt', 'ld-rush-ttb',
      'ld-rush-ltr', 'ld-rush-rtl', 'ld-shake-h', 'ld-shake-v', 'ld-shiver', 'ld-skew', 'ld-skew-alt', 'ld-slide-btt',
      'ld-slide-ltr', 'ld-slide-rtl', 'ld-slide-ttb', 'ld-smash', 'ld-spin', 'ld-spin-fast', 'ld-squeeze',
      'ld-swim', 'ld-swing', 'ld-tick-alt', 'ld-vortex', 'ld-vortex-alt', 'ld-wander-h', 'ld-wander-v',
      'ld-shadow', 'ld-shadow-a', 'ld-radio', 'ld-boradcast'
    ],
    loadingShapeSet: [
      'fa fa-snowflake ld-swim',
      'ld-spinner ld-orbit',
      'ld-pie ld-flip',
      'fas fa-sync ld-spin',
      'fas fa-spinner fa-spin',
      'fas fa-radiation-alt ld-cycle',
      'fas fa-radiation ld-spin-fast',
      'fas fa-asterisk ld-spin',
      'fas fa-bolt ld-bounce',
      'fas fa-biking ld-move-ltr',
      'fas fa-snowboarding ld-rush-ltr',
      'fas fa-yin-yang fa-spin',
      'fas fa-biohazard ld-metronome',
      'fas fa-baseball-ball ld-bounce',
      'fas fa-basketball-ball ld-beat',
      'fas fa-stroopwafel ld-metronome',
      'fas fa-fan ld-spin-fast',
      'fas fa-cog ld-swing',
      'fas fa-compact-disc ld-spin-fast',
      'fas fa-crosshairs ld-swim',
      'far fa-compass ld-tick',
      'fas fa-compass fa-pulse',
      'fas fa-anchor ld-swing',
      'fas fa-fingerprint ld-damage',
      'fab fa-angellist ld-metronome'
    ],
    loadingShapeColor: ['text-primary', 'text-secondary', 'text-danger', 'text-info', 'text-warning', 'text-default', ''],
    XHR_STATUS_CODE: {
      SUCCESS_WITH_NO_RECORD: 3,
      SUCCESS_WITH_MULTIPLE_RECORDS: 2,
      SUCCESS_NORMAL: 1,
      DEFAULT_FAIL: 0,
      UNSUPPORT_FAIL: -1,
      FAIL_WITH_LOCAL_NO_RECORD: -2,
      FAIL_NOT_VALID_SERVER: -3,
      FAIL_WITH_REMOTE_NO_RECORD: -4,
      FAIL_NO_AUTHORITY: -5,
      FAIL_JSON_ENCODE: -6,
      FAIL_NOT_FOUND: -7,
      FAIL_LOAD_ERROR: -8,
      FAIL_TIMEOUT: -9,
      FAIL_REMOTE_UNREACHABLE: -10,
      FAIL_DB_ERROR: -11
    },
    API: {
      XLSX: {
        LANDING: '/api/xlsx/landing.php',
        USER_IMPORT: '/api/import_user_xlsx.php',
        EXPORT: '/api/xlsx_export_api.php'
      },
      JSON: {
        QUERY: '/api/query_json_api.php',
        PREFETCH: '/api/prefetch_json_api.php',
        STATS: '/api/stats_json_api.php',
        SWITCH: '/api/switch_json_api.php',
        USER: '/api/user_json_api.php',
        MSSQL: '/api/mssql_json_api.php',
        LXHWEB: '/api/lxhweb_json_api.php',
        AUTH: '/api/auth_json_api.php',
        SYSTEM: '/api/system_json_api.php',
        IP: '/api/ip_json_api.php',
        NOTIFICATION: '/api/notification_json_api.php',
        MONITOR: '/api/monitor_json_api.php',
        MYQUERY: '/api/myquery_json_api.php',
        MOIEXP: '/api/moiexp_json_api.php',
        MOIPRC: '/api/moiprc_json_api.php',
        MOICAD: '/api/moicad_json_api.php',
        MOICAS: '/api/moicas_json_api.php',
        MOICAT: '/api/moicat_json_api.php',
        MOIADM: '/api/moiadm_json_api.php',
        MOISMS: '/api/moisms_json_api.php',
        REG: '/api/reg_json_api.php',
        ADM: '/api/adm_json_api.php',
        SUR: '/api/sur_json_api.php',
        XCASE: '/api/xcase_json_api.php'
      },
      FILE: {
        LOAD: '/api/load_file_api.php',
        EXPORT: '/api/export_file_api.php',
        XLSX: '/api/export_xlsx_api.php',
        TXT: '/api/export_tmp_txt.php',
        CSV: '/api/export_tmp_csv.php',
        DATA: '/api/export_txt_data.php',
        PHOTO: '/api/upload_user_photo.php',
        IMAGE: '/api/upload_image.php',
        BASE64: '/api/base64_image_convert.php'
      }
    },
    AUTHORITY: {
      NORMAL: 0,
      DISABLED: 1,
      ADMIN: 2,
      ANNOUNCEMENT_MANAGEMENT: 4,
      USER_MANAGEMENT: 8,
      CHIEF: 16,
      RESEARCH_AND_EVALUATION: 32
    },
    EVENT: {
      ERROR: 'lah::global::error',
      WARNING: 'lah::global::warning',
      INFO: 'lah::global::info'
    },
    ipMap: new Map([
      ['220.1.33.71', { name: '地政局', code: 'H0', ip: '220.1.33.71' }],
      ['220.1.34.161', { name: '桃園所', code: 'HA', ip: '220.1.34.161' }],
      ['220.1.35.123', { name: '中壢所', code: 'HB', ip: '220.1.35.123' }],
      ['220.1.36.45', { name: '大溪所', code: 'HC', ip: '220.1.36.45' }],
      ['220.1.37.246', { name: '楊梅所', code: 'HD', ip: '220.1.37.246' }],
      ['220.1.38.30', { name: '蘆竹所', code: 'HE', ip: '220.1.38.30' }],
      ['220.1.39.57', { name: '八德所', code: 'HF', ip: '220.1.39.57' }],
      ['220.1.40.33', { name: '平鎮所', code: 'HG', ip: '220.1.40.33' }],
      ['220.1.41.20', { name: '龜山所', code: 'HH', ip: '220.1.41.20' }]
    ]),
    siteMap: new Map([
      ['H0', { name: '地政局', code: 'H0', ip: '220.1.33.71' }],
      ['HA', { name: '桃園所', code: 'HA', ip: '220.1.34.161' }],
      ['HB', { name: '中壢所', code: 'HB', ip: '220.1.35.123' }],
      ['HC', { name: '大溪所', code: 'HC', ip: '220.1.36.45' }],
      ['HD', { name: '楊梅所', code: 'HD', ip: '220.1.37.246' }],
      ['HE', { name: '蘆竹所', code: 'HE', ip: '220.1.38.30' }],
      ['HF', { name: '八德所', code: 'HF', ip: '220.1.39.57' }],
      ['HG', { name: '平鎮所', code: 'HG', ip: '220.1.40.33' }],
      ['HH', { name: '龜山所', code: 'HH', ip: '220.1.41.20' }]
    ])
  }
  // like old fashion global functions, use this.$utils to access these methods in Vue
  const utility = {
    $,
    /**
     * lodash ...
     */
    empty: isEmpty, // '0' is not empty
    equal: isEqual,
    equalWith: isEqualWith,
    debounce,
    debouncePromise (func, delay) {
      let timeoutId
      return (...args) => {
        return new Promise((resolve, reject) => {
          clearTimeout(timeoutId)
          timeoutId = setTimeout(() => {
            func(...args)
              .then(resolve)
              .catch(reject)
          }, delay)
        })
      }
    },
    remove,
    filter,
    without,
    reject,
    sortedUniq,
    uniqBy,
    uniqWith,
    groupBy,
    orderBy,
    sortBy,
    differenceWith,
    difference,
    chunk,
    compact,
    escape,
    md5: _md5,
    /**
     * marked
     */
    marked,
    convertMarkd (text, inline = false) {
      if (inline) {
        return DOMPurify?.sanitize(marked.parseInline(text?.trimEnd()))
      }
      return DOMPurify?.sanitize(marked.parse(text?.trimEnd()))
    },
    convertInlineMarkd (text) {
      return DOMPurify?.sanitize(marked.parseInline(text?.trimEnd()))
    },
    /**
     * usage in Vue
     * this.$utils.animated('.my-element', { name: 'bounce', duration: 'faster', delay: '' }).then((message) => {
     * // Do something after the animation
     * })
     */
    animated (selector, opts, prefix = 'animate__') {
      return new Promise((resolve, reject) => {
        if (isEmpty(selector)) {
          reject('selector is empty.')
        } else if (process.client) {
          opts = Object.assign({
            name: consts.animateAttentionSeekers[this.rand(consts.animateAttentionSeekers.length)],
            speed: 'faster', // 'slower', 'slow', '', 'fast', 'faster' (3s, 2s, 1s, 800ms, 500ms)
            repeat: '', // repeat-[1-3], infinite
            delay: '' // delay, delay-[2s-5s]
          }, opts)
          const node = $(selector)
          if (node.length > 0) {
            node.removeClass('hide')
            const classes = `${prefix}animated ${prefix}${opts.name} ${prefix}${opts.speed} ${prefix}${opts.repeat} ${prefix}${opts.delay}`
            node.addClass(classes)
            // node[0].addEventListener('animationend', handleAnimationEnd, {once: true}
            node.one('animationend', function (e) {
              // When the animation ends, we clean the classes and resolve the Promise
              node.removeClass(classes)
              // clear ld animation also
              $(selector || '*').removeClass('ld').attr('class', function (i, c) {
                return c ? c.replace(/(^|\s+)ld-\S+/g, '') : ''
              })
              resolve(`${opts.name} animation ended.`)
            })
          } else {
            this.warn(`${selector} not found, can't apply animation effect.`)
            reject(false)
          }
        } else {
          reject('Only apply animation on client side, this animated call will be ignored.')
        }
      })
    },
    addAnimation (selector, which) {
      const el = $(selector || '*').removeClass('ld').attr('class', function (i, c) {
        return c ? c.replace(/(^|\s+)ld-\S+/g, '') : ''
      })
      if (el?.length) {
        el?.addClass('ld')
        if (!which) {
          el?.each((idx, el) => {
            if (el.is && !el?.is('body') && !el.is('html')) {
              const index = Math.floor(Math.random() * Math.floor(consts.loadingAction.length || 100))
              const randAnimPattern = consts.loadingAction[index]
              el?.addClass(randAnimPattern)
            }
          })
        } else {
          el?.addClass(which)
        }
      }
      return el
    },
    clearAnimation (selector) {
      return $(selector || '*').removeClass('ld').attr('class', function (i, c) {
        return c ? c.replace(/(^|\s+)ld-\S+/g, '') : ''
      })
    },
    /**
     * Get object property value by string path, if not found return default value
     * @param {`*`} property
     * @param {*} def
     * @returns string
     */
    get (property, def = '') {
      return get(property, def)
    },
    openNewWindow (url, e) {
      if (window) {
        const win = window.open(url, '_blank')
        win.focus()
      }
    },
    statusCheck (statusCode) { return statusCode > 0 && statusCode !== 'cancelled' },
    message (statusCode) {
      switch (statusCode) {
        case 0:
          return `失敗【${consts.XHR_STATUS_CODE.DEFAULT_FAIL}, DEFAULT_FAIL】`
        case 1:
          return `成功【${consts.XHR_STATUS_CODE.SUCCESS_NORMAL}, SUCCESS_NORMAL】`
        case 2:
          return `成功(回傳多筆資料)【${consts.XHR_STATUS_CODE.SUCCESS_WITH_MULTIPLE_RECORDS}, SUCCESS_WITH_MULTIPLE_RECORDS】`
        case 3:
          return `成功(無資料)【${consts.XHR_STATUS_CODE.SUCCESS_WITH_NO_RECORD}, SUCCESS_WITH_NO_RECORD】`
        case -1:
          return `失敗(不支援)【${consts.XHR_STATUS_CODE.UNSUPPORT_FAIL}, UNSUPPORT_FAIL】`
        case -2:
          return `失敗(本地端無資料)【${consts.XHR_STATUS_CODE.FAIL_WITH_LOCAL_NO_RECORD}, FAIL_WITH_LOCAL_NO_RECORD】`
        case -3:
          return `失敗(非正確伺服主機)【${consts.XHR_STATUS_CODE.FAIL_NOT_VALID_SERVER}, FAIL_NOT_VALID_SERVER】`
        case -4:
          return `失敗(遠端無資料)【${consts.XHR_STATUS_CODE.FAIL_WITH_REMOTE_NO_RECORD}, FAIL_WITH_REMOTE_NO_RECORD】`
        case -5:
          return `授權失敗【${consts.XHR_STATUS_CODE.FAIL_NO_AUTHORITY}, FAIL_NO_AUTHORITY】`
        case -6:
          return `JSON編碼失敗【${consts.XHR_STATUS_CODE.FAIL_JSON_ENCODE}, FAIL_JSON_ENCODE】`
        case -7:
          return `找不到資料失敗【${consts.XHR_STATUS_CODE.FAIL_NOT_FOUND}, FAIL_NOT_FOUND】`
        case -8:
          return `讀取檔案失敗【${consts.XHR_STATUS_CODE.FAIL_LOAD_ERROR}, FAIL_LOAD_ERROR】`
        case -9:
          return `動作請求逾時【${consts.XHR_STATUS_CODE.FAIL_TIMEOUT}, FAIL_TIMEOUT】`
        default:
          return `不支援的狀態碼【${statusCode}】`
      }
    },
    isMobileValid (num) {
      const regex = /^09\d{8}$/g
      return regex.test(num?.trim())
    },
    isOfficeHours () {
      const now = new Date()
      if (now.getDay() === 0 || now.getDay() === 6) {
        return false
      }
      return now.getHours() > 6 && now.getHours() < 19
    },
    rand (range) {
      return Math.floor(Math.random() * Math.floor(range || 100))
    },
    trim (str, char = ' ') {
      if (typeof str !== 'string') {
        return str
      }
      if (char === ' ') {
        return str.replace(/^\s+|\s+$/gm, '')
      }
      return str.split(char).filter(Boolean).join(char)
    },
    caseId (id) {
      if (isEmpty(id)) {
        return ''
      }
      id = id.replace(/^[a-zA-Z0-9-]$/g, '')
      if (id.length !== 13) {
        return id
      }
      return `${id.substring(0, 3)}-${id.substring(3, 7)}-${id.substring(7)}`
    },
    uuid () {
      let d = Date.now()
      if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        d += performance.now() // use high-precision timer if available
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (d + Math.random() * 16) % 16 | 0
        d = Math.floor(d / 16)
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
      })
    },
    isIPv4 (str) {
      if (isEmpty(str)) {
        return false
      }
      const regex = new RegExp('^(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}$', 'g')
      return Boolean(str.match(regex))
    },
    ipv4Int (addr) {
      if (this.isIPv4(addr)) {
        const parts = addr.split('.').map(function (str) {
          return parseInt(str)
        })
        return (parts[0] ? parts[0] << 24 : 0) +
               (parts[1] ? parts[1] << 16 : 0) +
               (parts[2] ? parts[2] << 8 : 0) +
                parts[3]
      }
      return false
    },
    addMoneyComma (dollar) {
      const str = (dollar)?.toLocaleString('en')
      return parseInt(str)?.toLocaleString('en') || 0
    },
    msToHuman (remainMs) {
      const seconds = (remainMs / 1000).toFixed(1)
      const minutes = (remainMs / (1000 * 60)).toFixed(1)
      const hours = (remainMs / (1000 * 60 * 60)).toFixed(1)
      const days = (remainMs / (1000 * 60 * 60 * 24)).toFixed(1)
      if (seconds < 60) {
        return seconds + ' 秒'
      } else if (minutes < 60) {
        return minutes + ' 分鐘'
      } else if (hours < 24) {
        return hours + ' 小時'
      } else {
        return days + ' 天'
      }
    },
    formatDate (dateObj = new Date(), formatStr = 'yyyy-MM-dd') {
      return this.formatTime(dateObj, formatStr)
    },
    formatTime (dateObj = new Date(), formatStr = 'HH:mm:ss') {
      if (!dateObj || dateObj === '') { return '' }
      if (dateObj instanceof Date && this.isValidDateObject(dateObj)) {
        return format(dateObj, formatStr, { locale: zhTW })
      } else if (typeof dateObj === 'string' && !isNaN(Date.parse(dateObj))) {
        return format(new Date(Date.parse(dateObj)), formatStr, { locale: zhTW })
      } else {
        this.warn('日期物件無效，無法轉換日期時間字串', typeof dateObj, dateObj)
      }
      return ''
    },
    now (tw = '') {
      // https://date-fns.org/v2.28.0/docs/format
      if (tw.toUpperCase() === 'TW' || tw === true) {
        const now = new Date()
        const ad = format(now, 'yyyy-LL-dd HH:mm:ss', { locale: zhTW })
        const adParts = ad.split('-')
        const twy = parseInt(adParts[0]) - 1911
        return `${twy}-${adParts[1]}-${adParts[2]}`
      }
      // e.g. 2022-01-22 16:06:23
      return format(new Date(), 'yyyy-LL-dd HH:mm:ss', { locale: zhTW })
    },
    nowTs () { return +new Date() },
    time () {
      const fullAdDate = this.now()
      return fullAdDate.split(' ')[1]
    },
    today (tw = '') {
      const fullAdDate = this.now(tw)
      return fullAdDate.split(' ')[0]
    },
    toADDate (ts, fmt = 'yyyy-LL-dd HH:mm:ss') {
      if (ts) {
        return format(ts, fmt, { locale: zhTW })
      }
      return ''
    },
    phpTsToAdDateStr (phpTs, full = false) {
      if (phpTs) {
        // PHP time() generate ts by seconds, however js is milliseconds
        const formatted = format(phpTs * 1000, 'yyyy-LL-dd HH:mm:ss', { locale: zhTW })
        const parts = formatted.split(' ')
        return full ? formatted : parts[0]
      }
      return ''
    },
    twDateStr (dateObj, full = false) {
      if (dateObj) {
        const regex = /[:\-\s]/ig
        const ad = this.phpTsToAdDateStr(dateObj?.getTime() / 1000, full)?.replaceAll(regex, '')
        const year = parseInt(ad.substring(0, 4)) - 1911
        return `${year}${ad.substring(4)}`
      }
      return ''
    },
    twToAdDateObj (twDateStr) {
      if (isEmpty(twDateStr)) { return null }
      try {
        const tmp = twDateStr.replaceAll(/[\\\-\s]/ig, '')
        if (tmp.length !== 7) {
          console.warn(`${twDateStr} is not a valid TW date string. (its length should 7 digits)`)
          return null
        }
        const Y = parseInt(tmp.substring(0, 3)) + 1911
        const M = parseInt(tmp.substring(3, 5)) - 1
        const D = parseInt(tmp.substring(5, 7))
        return new Date(Y, M, D)
      } catch (e) {
        console.error(e)
        return null
      }
    },
    adDateToTs (str, full = true) {
      if (isEmpty(str)) { return false }
      str = str.replaceAll('-', '').replaceAll(':', '')
      const Y = str.substring(0, 4) - 0
      const M = str.substring(4, 6) - 0 - 1
      const D = str.substring(6, 8) - 0
      let H = 0
      let m = 0
      let s = 0
      if (full) {
        H = str.substring(9, 11) - 0
        m = str.substring(11, 13) - 0 - 1
        s = str.substring(13, 15) - 0
      }
      return +new Date(Y, M, D, H, m, s)
    },
    twAdSwitch (str) {
      const formatted = str.replace(/[-/]/g, '')
      // detect if it is AD date
      if (formatted.match(/^\d{8}$/)) {
        // to TW date
        return parseInt(formatted.substring(0, 4)) - 1911 + formatted.substring(4)
      } else if (formatted.match(/^\d{7}$/)) {
        return parseInt(formatted.substring(0, 3)) + 1911 + formatted.substring(3)
      }
      return str
    },
    /**
     * 檢查傳入的值是否為一個有效的 Date 物件
     * @param {*} d - 欲檢查的值
     * @returns {boolean}
     */
    isValidDateObject (d) {
      return d instanceof Date && !isNaN(d.getTime())
    },
    isValidTWDate (str, todayLimit = true) {
      // e.g. 1131111
      if (!str?.match(/^\d{7}$/)) {
        return false
      }
      const year = str.substring(0, 3)
      const month = str.substring(3, 5)
      const day = str.substring(5)
      if (todayLimit) {
        const tmp = parseInt(str)
        const today = parseInt(this.today('TW').replace(/[-/]/g, ''))
        return tmp <= today && this.isValidDate(year, month, day)
      }
      return this.isValidDate(year, month, day)
    },
    isValidDate (iyear, imonth, iday) {
      const pyear = parseInt(iyear)
      const month = parseInt(imonth)
      const day = parseInt(iday)
      // Basic range checks
      if (!Number.isInteger(pyear) || !Number.isInteger(month) || !Number.isInteger(day)) {
        return false
      }
      // Convert ROC year to CE year
      const ceYear = pyear < 200 ? pyear + 1911 : pyear
      if (ceYear < 1 || month < 1 || month > 12 || day < 1) {
        return false
      }
      // Get last day of the month
      const lastDayOfMonth = new Date(ceYear, month, 0).getDate()
      if (day > lastDayOfMonth) {
        return false
      }
      // Check if resulting date is valid
      const date = new Date(ceYear, month - 1, day)
      return date.getFullYear() === ceYear &&
             date.getMonth() === month - 1 &&
             date.getDate() === day
    },
    formatDistanceToNow (d = +new Date()) {
      try {
        return formatDistanceToNow(d, {
          addSuffix: true,
          includeSeconds: true,
          locale: zhTW
        })
      } catch (ex) {
        console.warn(`不是正常的時間戳記，實際值 👉 "${d}"`)
        return `無法轉換時間戳記 ${d}`
      }
    },
    addDateDivider (str, ad = false) {
      if (this.empty(str) || isNaN(str)) {
        return ''
      }
      if (ad === 'AD' || ad === true) {
        const Y = str.substring(0, 4)
        const M = str.substring(4, 6)
        const D = str.substring(6, 8)
        return `${Y}-${M}-${D}`
      }
      if (str.length === 7) {
        // e.g. 1130304
        const Y = str.substring(0, 3)
        const M = str.substring(3, 5)
        const D = str.substring(5, 7)
        return `${Y}-${M}-${D}`
      } else if (str.length === 6) {
        // e.g. 991116
        const Y = str.substring(0, 2)
        const M = str.substring(2, 4)
        const D = str.substring(4, 6)
        return `${Y}-${M}-${D}`
      }
      return str
    },
    addTimeDivider (str) {
      if (this.empty(str)) {
        return ''
      }
      const Y = str.substring(0, 2)
      const M = str.substring(2, 4)
      const D = str.substring(4, 6)
      return `${Y}:${M}:${D}`
    },
    length (chinese) {
      return chinese?.replace(/[^\x00-\xFF]/g, 'xx')?.length
    },
    formatTo8Digits (numberString, landOrBuild) {
      if (numberString?.length < 10) {
        const parts = numberString.split('-')
        if (landOrBuild === 'land') {
          if (parts.length > 1) {
            const paddedParts = parts.map(part => part.padStart(4, '0'))
            const mergedString = paddedParts.join('')
            return mergedString
          }
          return numberString.padStart(4, '0').padEnd(8, '0')
        } else if (landOrBuild === 'building') {
          if (parts.length > 1) {
            return `${parts[0].padStart(5, '0')}${parts[1].padStart(3, '0')}`
          }
          return numberString.padStart(5, '0').padEnd(8, '0')
        }
      }
      this.warn('the string length must less than 10 to be formatted.')
      return numberString
    },
    formatLandNumber (str) {
      const tmp = this.formatTo8Digits(str, 'land')
      if (typeof tmp === 'string' && tmp.length === 8) {
        const mainNumber = tmp.substring(0, 4).replace(/^0+/, '')
        const subNumber = tmp.substring(4).replace(/^0+/, '')
        return this.empty(subNumber) ? mainNumber : `${mainNumber}-${subNumber}`
      }
      return ''
    },
    formatBuildNumber (str) {
      const tmp = this.formatTo8Digits(str, 'building')
      if (typeof tmp === 'string' && tmp.length === 8) {
        const mainNumber = tmp.substring(0, 5).replace(/^0+/, '')
        const subNumber = tmp.substring(5).replace(/^0+/, '')
        return this.empty(subNumber) ? mainNumber : `${mainNumber}-${subNumber}`
      }
      return ''
    },
    convertDBytesNumber (str) {
      if (str) {
        const chars = []
        for (let i = 0; i < str.length; i++) {
          switch (str[i]) {
            case '０':
              chars.push(0)
              break
            case '１':
              chars.push(1)
              break
            case '２':
              chars.push(2)
              break
            case '３':
              chars.push(3)
              break
            case '４':
              chars.push(4)
              break
            case '５':
              chars.push(5)
              break
            case '６':
              chars.push(6)
              break
            case '７':
              chars.push(7)
              break
            case '８':
              chars.push(8)
              break
            case '９':
              chars.push(9)
              break
            default:
              break
          }
        }
        return chars.join('')
      }
      return str
    },
    twIDCheck (idStr) {
      const regex = /^[A-Z]{1}[0-9]{9}$/
      return regex.test(idStr)
    },
    highlight (str, regex, css, title = '') {
      const chunks = highlightWords({
        text: str,
        query: regex
      })
      if (chunks) {
        return chunks.map(({ text, match, key }) => {
          return match ? (`<span class="${css}" title="${title}" key="${key}">${text}</span>`) : text
        }).join('')
      }
      return str
    },
    highlightBlue (str) {
      return this.highlight(
        str,
        /(\{{2}b.+?b\}{2})/igm,
        'text-bold-blue'
      ).replace(/(\{{2}b|b\}{2})/igm, '')
    },
    highlightRed (str) {
      return this.highlight(
        str,
        /(\{{2}r.+?r\}{2})/,
        'text-bold-red'
      ).replace(/(\{{2}r|r\}{2})/igm, '')
    },
    highlightGreen (str) {
      return this.highlight(
        str,
        /(\{{2}g.+?g\}{2})/,
        'text-bold-green'
      ).replace(/(\{{2}g|g\}{2})/igm, '')
    },
    highlightOrange (str) {
      return this.highlight(
        str,
        /(\{{2}o.+?o\}{2})/,
        'text-bold-orange'
      ).replace(/(\{{2}o|o\}{2})/igm, '')
    },
    highlightTimestamp (str, css = 'text-bold-blue') {
      return this.highlight(
        str,
        /([0-2]?[0-9]：[0-5]?[0-9]|\s[0-2]?[0-9]:[0-5]?[0-9]\s|\([0-1]?[0-9]\/[0-3]?[0-9].*?\)|[0-1]?[0-9][／月][0-3]?[0-9]日?|\s[0-1]?[0-9][\/／][0-3]?[0-9]\s|[0-2]?[0-9][:：][0-5]?[0-9]\s?[\-~]\s?[0-2]?[0-9][:：][0-5]?[0-9]|[0-2]?[0-9][點時分秒HhSsMm]?[:：]?[0-5]?[0-9]?\s?[\-~]\s?[0-2]?[0-9][點時Hh][:：]?[0-5]?[0-9]?|[0-1]?[0-9][\/／][0-3]?[0-9]\s?[\-~]\s?[0-1]?[0-9][\/／][0-3]?[0-9])/i,
        css
      )
    },
    highlightTitle (str, css = 'font-weight-bold') {
      return this.highlight(
        str,
        /(['「（【《『〈〔].+?[〕〉』》】）」'])/i,
        css
      )
    },
    highlightPipeline (str) {
      if (str) {
        let tmp = this.highlightBlue(str)
        tmp = this.highlightRed(tmp)
        tmp = this.highlightOrange(tmp)
        tmp = this.highlightGreen(tmp)
        tmp = this.highlightTimestamp(tmp)
        tmp = this.highlightTitle(tmp)
        return tmp
      }
      return str
    },
    log () {
      if ($config.isDev) {
        const err = new Error()
        console.log(err.stack.split('\n')[2], ...arguments)
      }
    },
    warn () {
      if ($config.isDev) {
        const err = new Error()
        console.warn(err.stack.split('\n')[2], ...arguments)
      }
    },
    info: console.info.bind(console),
    assert: console.assert.bind(console),
    error: console.error.bind(console),
    table: console.table.bind(console)
  }
  // all injected var can be used by {varname} in Vue and ${varname} in Nuxt, e.g. this.$http (Vue), $http (Nuxt)
  inject('consts', consts)
  inject('utils', utility)
  // inject uploading file axios
  // need to add 'Header set Access-Control-Allow-Origin "*"' to Apache site and turn on mod_header.so in httpd.conf
  uploadAxios.defaults.headers.post['Content-Type'] = 'multipart/form-data'
  inject('upload', uploadAxios)
}
