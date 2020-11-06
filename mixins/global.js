import $ from 'jquery'
const jQuery = $
export default {
  data: () => ({
    isBusy: false,
    busyIconSize: undefined,
    dayMilliseconds: 24 * 60 * 60 * 1000,
    LOADING_PATTERNS: [
      'ld-heartbeat', 'ld-beat', 'ld-blink', 'ld-bounce', 'ld-bounceAlt', 'ld-breath', 'ld-wrench', 'ld-surprise',
      'ld-clock', 'ld-jump', 'ld-hit', 'ld-fade', 'ld-flip', 'ld-float', 'ld-move-ltr', 'ld-tremble', 'ld-tick',
      'ld-move-rtl', 'ld-move-ttb', 'ld-move-btt', 'ld-move-fade-ltr', 'ld-move-fade-rtl', 'ld-move-fade-ttb',
      'ld-move-fade-btt', 'ld-dim', 'ld-swing', 'ld-wander', 'ld-pulse', 'ld-cycle', 'ld-cycle-alt', 'ld-damage',
      'ld-fade', 'ld-flip', 'ld-flip-h', 'ld-flip-v', 'ld-float', 'ld-jelly', 'ld-jelly-alt', 'ld-jingle',
      'ld-measure', 'ld-metronome', 'ld-orbit', 'ld-rubber-h', 'ld-rubber-v', 'ld-rush-btt', 'ld-rush-ttb',
      'ld-rush-ltr', 'ld-rush-rtl', 'ld-shake-h', 'ld-shake-v', 'ld-shiver', 'ld-skew', 'ld-skew-alt', 'ld-slide-btt',
      'ld-slide-ltr', 'ld-slide-rtl', 'ld-slide-ttb', 'ld-smash', 'ld-spin', 'ld-spin-fast', 'ld-squeeze',
      'ld-swim', 'ld-swing', 'ld-tick-alt', 'ld-vortex', 'ld-vortex-alt', 'ld-wander-h', 'ld-wander-v'
    ],
    LOADING_PREDEFINED: [
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
    LOADING_SHAPES_COLOR: ['text-primary', 'text-secondary', 'text-danger', 'text-info', 'text-warning', 'text-default', ''],
    ANIMATED_PATTERNS: ['bounce', 'flash', 'pulse', 'rubberBand', 'shake', 'headShake', 'swing', 'tada', 'wobble', 'jello', 'hinge'],
    ANIMATED_TRANSITIONS: [
      // rotate
      {
        in: 'animated rotateIn',
        out: 'animated rotateOut'
      },
      {
        in: 'animated rotateInDownLeft',
        out: 'animated rotateOutDownLeft'
      },
      {
        in: 'animated rotateInDownRight',
        out: 'animated rotateOutDownRight'
      },
      {
        in: 'animated rotateInUpLeft',
        out: 'animated rotateOutUpLeft'
      },
      {
        in: 'animated rotateInUpRight',
        out: 'animated rotateOutUpRight'
      },
      // bounce
      {
        in: 'animated bounceIn',
        out: 'animated bounceOut'
      },
      {
        in: 'animated bounceInUp',
        out: 'animated bounceOutDown'
      },
      {
        in: 'animated bounceInDown',
        out: 'animated bounceOutUp'
      },
      {
        in: 'animated bounceInRight',
        out: 'animated bounceOutLeft'
      },
      {
        in: 'animated bounceInLeft',
        out: 'animated bounceOutRight'
      },
      // fade
      {
        in: 'animated fadeIn',
        out: 'animated fadeOut'
      },
      {
        in: 'animated fadeInDown',
        out: 'animated fadeOutUp'
      },
      {
        in: 'animated fadeInDownBig',
        out: 'animated fadeOutUpBig'
      },
      {
        in: 'animated fadeInLeft',
        out: 'animated fadeOutRight'
      },
      {
        in: 'animated fadeInLeftBig',
        out: 'animated fadeOutRightBig'
      },
      {
        in: 'animated fadeInRight',
        out: 'animated fadeOutLeft'
      },
      {
        in: 'animated fadeInRightBig',
        out: 'animated fadeOutLeftBig'
      },
      {
        in: 'animated fadeInUp',
        out: 'animated fadeOutDown'
      },
      {
        in: 'animated fadeInUpBig',
        out: 'animated fadeOutDownBig'
      },
      // flip
      {
        in: 'animated flipInX',
        out: 'animated flipOutX'
      },
      {
        in: 'animated flipInY',
        out: 'animated flipOutY'
      },
      // lightspeed
      {
        in: 'animated lightSpeedIn',
        out: 'animated lightSpeedOut'
      },
      // roll
      {
        in: 'animated rollIn',
        out: 'animated rollOut'
      },
      // zoom
      {
        in: 'animated zoomIn',
        out: 'animated zoomOut'
      },
      {
        in: 'animated zoomInDown',
        out: 'animated zoomOutUp'
      },
      {
        in: 'animated zoomInLeft',
        out: 'animated zoomOutRight'
      },
      {
        in: 'animated zoomInRight',
        out: 'animated zoomOutLeft'
      },
      {
        in: 'animated zoomInUp',
        out: 'animated zoomOutDown'
      },
      // slide
      {
        in: 'animated slideInDown',
        out: 'animated slideOutUp'
      },
      {
        in: 'animated slideInUp',
        out: 'animated slideOutDown'
      },
      {
        in: 'animated slideInLeft',
        out: 'animated slideOutRight'
      },
      {
        in: 'animated slideInRight',
        out: 'animated slideOutLeft'
      }
    ],
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
        LANDING: 'api/xlsx/landing.php'
      },
      JSON: {
        QUERY: 'api/query_json_api.php',
        STATS: 'api/stats_json_api.php',
        SWITCH: 'api/switch_json_api.php',
        USER: 'api/user_json_api.php',
        MSSQL: 'api/mssql_json_api.php',
        LXHWEB: 'api/lxhweb_json_api.php'
      },
      FILE: {
        LOAD: 'api/load_file_api.php',
        EXPORT: 'api/export_file_api.php',
        XLSX: 'api/export_xlsx_api.php',
        TXT: 'api/export_tmp_txt.php',
        CSV: 'api/export_tmp_csv.php',
        DATA: 'api/export_txt_data.php'
      }
    }
  }),
  watch: {
    isBusy (flag) {
      flag ? this.busyOn(this.$el) : this.busyOff(this.$el)
    }
  },
  computed: {
    viewportRatio () {
      return ((window.innerWidth) * 1.08).toFixed(2) / (window.innerHeight - 85 - 20).toFixed(2)
    }
  },
  methods: {
    toggleBusy (opts = {}) {
      opts = Object.assign({
        selector: 'body',
        style: 'ld-over', // ld-over, ld-over-inverse, ld-over-full, ld-over-full-inverse
        forceOff: false,
        forceOn: false
      }, opts)
      const container = $(opts.selector)
      if (container.length > 0) {
        const removeSpinner = () => {
          container.removeClass(opts.style)
          container.find('.auto-add-spinner').remove()
          container.removeClass('running')
        }
        const addSpinner = () => {
          container.addClass(opts.style)
          container.addClass('running')

          // randomize loading.io css for fun
          const coverEl = $(jQuery.parseHTML('<div class="ld auto-add-spinner"></div>'))
          coverEl.addClass(this.LOADING_PREDEFINED[this.rand(this.LOADING_PREDEFINED.length)]) // predefined pattern
            .addClass(this.LOADING_SHAPES_COLOR[this.rand(this.LOADING_SHAPES_COLOR.length)]) // color
          switch (opts.size) {
            case 'xs':
              coverEl.addClass('fa-xs')
              break
            case 'sm':
              coverEl.addClass('fa-sm')
              break
            case 'md':
              coverEl.addClass('fa-3x')
              break
            case 'lg':
              coverEl.addClass('fa-5x')
              break
            case 'xl':
              coverEl.addClass('fa-10x')
              break
            default:
              coverEl.addClass(`fa-${opts.size === undefined ? '2x' : opts.size}`)
              break
          }
          container.append(coverEl)
        }
        if (opts.forceOff) {
          removeSpinner()
          return
        }
        if (opts.forceOn) {
          removeSpinner()
          addSpinner()
          return
        }
        if (container.hasClass(opts.style)) {
          removeSpinner()
        } else {
          addSpinner()
        }
      }
    },
    busyOn (el = 'body') {
      this.toggleBusy({
        selector: el,
        forceOn: true,
        size: this.busyIconSize
      })
      this.$emit('busyOn', this)
    },
    busyOff (el = 'body') {
      this.toggleBusy({
        selector: el,
        forceOff: true
      })
      this.$emit('busyOff', this)
    },
    rand (range) {
      return Math.floor(Math.random() * Math.floor(range || 100))
    },
    empty (variable) {
      if (
        variable === null || variable === undefined || variable === false ||
        (typeof variable === 'object' && variable.length === 0) ||
        (Array.isArray(variable) && variable.length === 0) ||
        ($.trim(variable) === '')
      ) {
        return true
      }
      return false
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
    openNewWindow (url, e) {
      if (window) {
        const win = window.open(url, '_blank')
        win.focus()
      }
    },
    animated (selector, opts) {
      const node = $(selector)
      if (node) {
        opts = Object.assign({
          name: this.ANIMATED_PATTERNS[this.rand(this.ANIMATED_PATTERNS.length)],
          duration: 'once-anim-cfg' // a css class to control speed
        }, opts)
        node.addClass(`animated ${opts.name} ${opts.duration}`)
        node.on('animationend', () => {
          if (typeof opts.callback === 'function') {
            opts.callback.apply(this, arguments)
          }
          node.removeClass(`animated ${opts.name} ${opts.duration}`)
          node.off('animationend')
          // clear ld animation also
          $(selector || '*').removeClass('ld').attr('class', function (i, c) {
            return c ? c.replace(/(^|\s+)ld-\S+/g, '') : ''
          })
        })
      }
      return node
    },
    responseMessage (statusCode) {
      switch (statusCode) {
        case 0:
          return `失敗【${this.XHR_STATUS_CODE.DEFAULT_FAIL}, DEFAULT_FAIL】`
        case 1:
          return `成功【${this.XHR_STATUS_CODE.SUCCESS_NORMAL}, SUCCESS_NORMAL】`
        case 2:
          return `成功(回傳多筆資料)【${this.XHR_STATUS_CODE.SUCCESS_WITH_MULTIPLE_RECORDS}, SUCCESS_WITH_MULTIPLE_RECORDS】`
        case 3:
          return `成功(無資料)【${this.XHR_STATUS_CODE.SUCCESS_WITH_NO_RECORD}, SUCCESS_WITH_NO_RECORD】`
        case -1:
          return `失敗(不支援)【${this.XHR_STATUS_CODE.UNSUPPORT_FAIL}, UNSUPPORT_FAIL】`
        case -2:
          return `失敗(本地端無資料)【${this.XHR_STATUS_CODE.FAIL_WITH_LOCAL_NO_RECORD}, FAIL_WITH_LOCAL_NO_RECORD】`
        case -3:
          return `失敗(非正確伺服主機)【${this.XHR_STATUS_CODE.FAIL_NOT_VALID_SERVER}, FAIL_NOT_VALID_SERVER】`
        case -4:
          return `失敗(遠端無資料)【${this.XHR_STATUS_CODE.FAIL_WITH_REMOTE_NO_RECORD}, FAIL_WITH_REMOTE_NO_RECORD】`
        case -5:
          return `授權失敗【${this.XHR_STATUS_CODE.FAIL_NO_AUTHORITY}, FAIL_NO_AUTHORITY】`
        case -6:
          return `JSON編碼失敗【${this.XHR_STATUS_CODE.FAIL_JSON_ENCODE}, FAIL_JSON_ENCODE】`
        case -7:
          return `找不到資料失敗【${this.XHR_STATUS_CODE.FAIL_NOT_FOUND}, FAIL_NOT_FOUND`
        case -8:
          return `讀取檔案失敗【${this.XHR_STATUS_CODE.FAIL_LOAD_ERROR}, FAIL_LOAD_ERROR`
        case -9:
          return `動作請求逾時【${this.XHR_STATUS_CODE.FAIL_TIMEOUT}, FAIL_TIMEOUT`
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
    timeout (func, ms) {
      return setTimeout(func, ms)
    },
    async setCache (key, val, expire_timeout = 0) {
      if (this.empty(key) || this.empty(val)) { return false }
      try {
        const item = {
          key,
          value: val,
          timestamp: +new Date(), // == new Date().getTime()
          expire_ms: expire_timeout // milliseconds
        }
        await this.$localForage.setItem(key, item)
      } catch (err) {
        console.error(err)
        return false
      }
      return true
    },
    async getCache (key) {
      if (this.empty(key)) { return false }
      try {
        const item = await this.$localForage.getItem(key)
        if (this.empty(item)) { return false }
        const ts = item.timestamp
        const expireTime = item.expire_ms || 0
        const now = +new Date()
        // console.log(`get ${key} value. (expireTime: ${expireTime}), now - ts == ${now - ts}`, item.value)
        if (expireTime !== 0 && now - ts > expireTime) {
          await this.$localForage.removeItem(key)
          // console.log(`${key} is removed. (expireTime: ${expireTime}), now - ts == ${now - ts}`)
          return false
        } else {
          return item.value
        }
      } catch (err) {
        console.error(err)
      }
      return false
    },
    async getCacheExpireRemainingTime (key) {
      if (this.empty(key)) { return false }
      try {
        const item = await this.$localForage.getItem(key)
        if (this.empty(item)) { return false }
        const ts = item.timestamp
        const expireTime = item.expire_ms || 0
        const now = +new Date()
        // console.log(`get ${key} value. (expireTime: ${expireTime}), now - ts == ${now - ts}`, item.value)
        if (expireTime === 0) {
          return false
        } else {
          return expireTime - (now - ts) // milliseconds
        }
      } catch (err) {
        console.error(err)
      }
      return false
    },
    removeLocalCache (key) {
      if (this.empty(key)) { return false }
      try {
        this.$localForage.removeItem(key)
      } catch (err) {
        console.error(err)
      }
      return true
    }
  },
  created () {
    this.$axios.defaults.transformRequest = [data => $.param(data)]
  }
}
