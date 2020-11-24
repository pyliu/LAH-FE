import $ from 'jquery'
import isEqual from 'lodash/isEqual'
import isEmpty from 'lodash/isEmpty'

export default ({ $axios, store }, inject) => {
  // global const variables, use this.$consts.xxxx to access them in Vue
  const consts = {
    dayMilliseconds: 8640000,
    animateAttentionSeekers:  ['bounce', 'flash', 'pulse', 'rubberBand', 'shakeX', 'shakeY', 'headShake', 'swing', 'tada', 'wobble', 'jello', 'heartBeat'],
    loadingAction: [ //(https://loading.io/animation/)
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
      FAIL_TIMEOUT: -9
    },
    API: {
      XLSX: {
        LANDING: '/api/xlsx/landing.php'
      },
      JSON: {
        QUERY: '/api/query_json_api.php',
        STATS: '/api/stats_json_api.php',
        SWITCH: '/api/switch_json_api.php',
        USER: '/api/user_json_api.php',
        MSSQL: '/api/mssql_json_api.php',
        LXHWEB: '/api/lxhweb_json_api.php'
      },
      FILE: {
        LOAD: '/api/load_file_api.php',
        EXPORT: '/api/export_file_api.php',
        XLSX: '/api/export_xlsx_api.php',
        TXT: '/api/export_tmp_txt.php',
        CSV: '/api/export_tmp_csv.php',
        DATA: '/api/export_txt_data.php'
      }
    }
  }
  // like old fashion global functions, use this.$utils to access these methods in Vue
  const utility = {
    /**
     * usage in Vue
     * this.$utils.animated('.my-element', { name: 'bounce', duration: 'faster', delay: '' }).then((message) => {
     *  // Do something after the animation
     * })
     */
    animated (selector, opts, prefix = '') {
      return new Promise((resolve, reject) => {
        opts = Object.assign({
          name: consts.animateAttentionSeekers[this.rand(consts.animateAttentionSeekers.length)],
          speed: 'faster', // 'slower', 'slow', '', 'fast', 'faster' (3s, 2s, 1s, 800ms, 500ms)
          repeat: '', // repeat-[1-3], infinite
          delay: '' // delay, delay-[2s-5s]
        }, opts)
        const node = $(selector)
        node.removeClass('hide')
        const classes = `${prefix}animated ${prefix}${opts.name} ${prefix}${opts.speed} ${prefix}${opts.repeat} ${prefix}${opts.delay}`
        node.addClass(classes)
        // When the animation ends, we clean the classes and resolve the Promise
        function handleAnimationEnd() {
          node.removeClass(classes)
          // clear ld animation also
          $(selector || '*').removeClass('ld').attr('class', function (i, c) {
            return c ? c.replace(/(^|\s+)ld-\S+/g, '') : ''
          })
          resolve(`${opts.name} animation ended.`)
        }
        node[0].addEventListener('animationend', handleAnimationEnd, {once: true})
      })
    },
    addAnimation (selector, which) {
      let el = $(selector || '*').removeClass('ld').attr('class', function(i, c) {
        return c ? c.replace(/(^|\s+)ld-\S+/g, '') : ''
      })
      if (el.length) {
        el.addClass('ld')
        if (!which) {
          el.each((idx, el) => {
            if (!el.is('body') && !el.is('html')) {
              const index = Math.floor(Math.random() * Math.floor(consts.loadingAction.length || 100))
              const randAnimPattern = consts.loadingAction[index]
              el.addClass(randAnimPattern)
            }
          })
        } else {
          el.addClass(which)
        }
      }
      return el
    },
    clearAnimation (selector) {
      return $(selector || '*').removeClass('ld').attr('class', function(i, c) {
        return c ? c.replace(/(^|\s+)ld-\S+/g, '') : ''
      })
    },
    openNewWindow (url, e) {
      if (window) {
        const win = window.open(url, '_blank')
        win.focus()
      }
    },
    statusCheck (statusCode) { return statusCode > 0 },
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
          return `找不到資料失敗【${consts.XHR_STATUS_CODE.FAIL_NOT_FOUND}, FAIL_NOT_FOUND`
        case -8:
          return `讀取檔案失敗【${consts.XHR_STATUS_CODE.FAIL_LOAD_ERROR}, FAIL_LOAD_ERROR`
        case -9:
          return `動作請求逾時【${consts.XHR_STATUS_CODE.FAIL_TIMEOUT}, FAIL_TIMEOUT`
        default:
          return `不支援的狀態碼【${statusCode}】`
      }
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
    trim (x) { return typeof x === 'string' ? x.replace(/^\s+|\s+$/gm,'') : '' },
    empty: isEmpty, // '0' is not empty
    equal: isEqual,
    caseid (id) {
      if (this.empty(id) || id.length !== 13) {
        this.warn(`id is not a valid string, can not oonvert to formated case id. (${id})`)
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
    now () {
      // e.g. 2020-11-06 13:39:23
      const now = new Date()
      return now.getFullYear() + '-' +
        ('0' + (now.getMonth() + 1)).slice(-2) + '-' +
        ('0' + now.getDate()).slice(-2) + ' ' +
        ('0' + now.getHours()).slice(-2) + ':' +
        ('0' + now.getMinutes()).slice(-2) + ':' +
        ('0' + now.getSeconds()).slice(-2)
    },
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    assert: console.assert.bind(console),
    error: console.error.bind(console)
  }
  // all injected var can be used by {varname} in Vue and ${varname} in Nuxt, e.g. this.$http (Vue), $http (Nuxt)
  inject('consts', consts)
  inject('utils', utility)
  inject('http', $axios)
  // get ip address and save it to store at FE
  store.dispatch('ip')
}
