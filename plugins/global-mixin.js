import Vue from 'vue'
import $ from 'jquery'

// inject to all Vue instances
Vue.mixin({
    data: () => ({
      isBusy: false,
      busyIconSize: undefined,
      callbackQueue: [],
      confirmAns: false,
      confirmOpen: false,
      cachedResponse: undefined
    }),
    watch: {
      isBusy (flag) {
        if (flag) {
          this.toggleBusy({
            selector: this.$el,
            forceOn: true,
            size: this.busyIconSize
          })
        } else {
          this.toggleBusy({
            selector: this.$el,
            forceOff: true
          })
        }
      },
      cachedResponse(nJson, oJson) {
        if (nJson && nJson.status < 1) {
          this.notify(nJson.message, { title:'API警示', type: 'warning', pos: 'bl' })
        } else {
          // TODO hide this on prod env
          this.notify(nJson.message)
        }
      }
    },
    computed: {
      viewportRatio () {
        return ((window.innerWidth) * 1.08).toFixed(2) / (window.innerHeight - 85 - 20).toFixed(2)
      },
      dayMilliseconds () { return this.$store ? this.$store.getters.dayMilliseconds : undefined },
      LOADING_PATTERNS () { return this.$store ? this.$store.getters.loadingPatterns : undefined },
      LOADING_PREDEFINED () { return this.$store ? this.$store.getters.loadingPredefined : undefined },
      LOADING_SHAPES_COLOR () { return this.$store ? this.$store.getters.loadingShapeColor : undefined },
      ANIMATED_PATTERNS () { return this.$store ? this.$store.getters.animatedPatterns : undefined },
      ANIMATED_TRANSITIONS () { return this.$store ? this.$store.getters.animatedTransitions : undefined },
      XHR_STATUS_CODE () { return this.$store ? this.$store.getters.xhrStatusCode : undefined },
      API () { return this.$store ? this.$store.getters.apiEp : undefined },
      animTransition () {
        if (this.ANIMATED_TRANSITIONS) {
          return this.ANIMATED_TRANSITIONS[this.rand(this.ANIMATED_TRANSITIONS.length)]
        }
        return undefined
      },
      toastCounter () { return this.$store ? this.$store.getters.toastCounter : 0 }
    },
    methods: {
      $,  // jQuery '$'
      paramize (obj_in) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(obj_in)) {
          params.append(key, value);
        }
        return params;
      },
      parseHTML (string) {
        const context = document.implementation.createHTMLDocument()
        // Set the base href for the created document so any parsed elements with URLs
        // are based on the document's URL
        const base = context.createElement('base')
        base.href = document.location.href
        context.head.appendChild(base)
        context.body.innerHTML = string
        return context.body.children
      },
      toggleBusy (opts = {}) {
        opts = Object.assign({
          selector: 'body',
          style: 'ld-over', // ld-over, ld-over-inverse, ld-over-full, ld-over-full-inverse
          forceOff: false,
          forceOn: false
        }, opts)
        const container = this.$(opts.selector)
        if (container.length) {
          const removeSpinner = (element, style) => {
            element.removeClass(style)
            element.find('.auto-add-spinner').remove()
            element.removeClass('running')
          }
          const addSpinner = (element, style) => {
            element.addClass(style)
            element.addClass('running')
  
            // randomize loading.io css for fun
            const coverEl = this.$(this.parseHTML('<div class="ld auto-add-spinner"></div>'))
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
            removeSpinner(container, opts.style)
            this.$emit('busyOff', this)
          } else if (opts.forceOn) {
            removeSpinner(container, opts.style)
            addSpinner(container, opts.style)
            this.$emit('busyOn', this)
          } else if (container.hasClass(opts.style)) {
            removeSpinner(container, opts.style)
            this.$emit('busyOff', this)
          } else {
            addSpinner(container, opts.style)
            this.$emit('busyOn', this)
          }
        }
      },
      rand (range) {
        return Math.floor(Math.random() * Math.floor(range || 100))
      },
      trim (x) { return x.replace(/^\s+|\s+$/gm,'') },
      empty (variable) {
        if (
          variable === null || variable === undefined || variable === false ||
          (typeof variable === 'object' && variable.length === 0) ||
          (Array.isArray(variable) && variable.length === 0) ||
          (this.trim(variable) === '')
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
      timeout (func, ms) {
        return setTimeout(func, ms)
      },
      makeToast (message, opts = {}) {
        // position adapter
        switch (opts.pos) {
          case 'tr':
            opts.toaster = 'b-toaster-top-right'
            break
          case 'tl':
            opts.toaster = 'b-toaster-top-left'
            break
          case 'br':
            opts.toaster = 'b-toaster-bottom-right'
            break
          case 'bl':
            opts.toaster = 'b-toaster-bottom-left'
            break
          case 'tc':
            opts.toaster = 'b-toaster-top-center'
            break
          case 'tf':
            opts.toaster = 'b-toaster-top-full'
            break
          case 'bc':
            opts.toaster = 'b-toaster-bottom-center'
            break
          case 'bf':
            opts.toaster = 'b-toaster-bottom-full'
            break
          default:
            switch(opts.type) {
              case 'danger':
              case 'red':
                opts.toaster = 'b-toaster-top-full'
                break
              case 'warning':
              case 'yellow':
                opts.toaster = 'b-toaster-bottom-left'
                break
              default:
                opts.toaster = 'b-toaster-bottom-right'
            }
        }
        // merge default setting
        const merged = Object.assign({
          title: '通知',
          subtitle: this.now().split(' ')[1],
          href: '',
          noAutoHide: false,
          autoHideDelay: 5000,
          solid: true,
          toaster: 'b-toaster-bottom-right',
          appendToast: true,
          variant: 'default'
        }, opts)
        // Use a shorter name for this.$createElement
        const h = this.$createElement
        // Create the title
        const vNodesTitle = h(
          'div', {
            class: ['d-flex', 'flex-grow-1', 'align-items-baseline', 'mr-2']
          },
          [
            h('strong', {
              class: 'mr-2'
            }, merged.title),
            h('small', {
              class: 'ml-auto text-italics'
            }, merged.subtitle)
          ]
        )
        // Pass the VNodes as an array for title
        merged.title = [vNodesTitle]
        // use vNode for HTML content
        const msgVNode = h('div', {
          domProps: {
            innerHTML: message
          }
        })
        this.$bvToast.toast([msgVNode], merged)
  
        if (typeof merged.callback === 'function') {
          this.timeout(() => merged.callback.apply(this, arguments), 100)
        }

        if (this.$store) {
          this.$store.commit('addToastCounter')
        }
      },
      animated (selector, opts) {
        const node = this.$(selector)
        if (node.length > 0) {
          opts = Object.assign({
            name: this.ANIMATED_PATTERNS[this.rand(this.ANIMATED_PATTERNS.length)],
            duration: 'once-anim-cfg' // a css class to control speed
          }, opts)
          node.removeClass('hide')
          node.addClass(`animated ${opts.name} ${opts.duration}`)
          node.on('animationend', () => {
            if (typeof opts.callback === 'function') {
              opts.callback.apply(this, arguments)
            }
            node.removeClass(`animated ${opts.name} ${opts.duration}`)
            node.off('animationend')
            // clear ld animation also
            this.$(selector || '*').removeClass('ld').attr('class', function (i, c) {
              return c ? c.replace(/(^|\s+)ld-\S+/g, '') : ''
            })
          })
        }
        return node
      },
      notify (msg, opts = {}) {
        // previous only use one object param
        if (typeof msg === 'object') {
          const message = msg.body || msg.message
          msg.variant = msg.type || 'default'
          msg.autoHideDelay = msg.duration || msg.delay || 5000
          this.makeToast(message, msg)
        } else if (typeof msg === 'string') {
          this.makeToast(msg, opts)
        } else {
          this.alert(`notify 傳入參數有誤: msg:${msg}, opts: ${opts}`)
          this.$error(`notify 傳入參數有誤: msg:${msg}, opts: ${opts}`)
        }
      },
      alert (message, opts = {}) {
        if (!this.empty(message)) {
          opts.pos = (opts && opts.pos === 'bottom') ? 'bf' : 'tf'
          const merged = Object.assign({
            title: '警示',
            autoHideDelay: 10000,
            variant: 'danger'
          }, opts)
          this.notify(message, merged)
        }
      },
      modal (message, opts) {
        const merged = Object.assign({
          title: '訊息',
          size: 'md',
          buttonSize: 'sm',
          okVariant: 'outline-secondary',
          okTitle: '關閉',
          hideHeaderClose: false,
          centered: true,
          scrollable: true,
          hideFooter: true,
          noCloseOnBackdrop: false,
          contentClass: 'shadow hide', // add hide class to .modal-content then use Animated.css for animation show up
          html: false
        }, opts)
        // use d-none to hide footer
        merged.footerClass = merged.hideFooter ? 'd-none' : 'p-2'
        if (merged.html) {
          merged.titleHtml = merged.title
          merged.title = undefined
          if (typeof message === 'object') {
            // assume the message is VNode
            this.$bvModal.msgBoxOk([message], merged)
          } else {
            const h = this.$createElement
            const msgVNode = h('div', {
              domProps: {
                innerHTML: message
              }
            })
            this.$bvModal.msgBoxOk([msgVNode], merged)
          }
          // you can do additional process after modal is opened
          if (merged.callback && typeof merged.callback === 'function') {
            this.callbackQueue.push(merged.callback)
          }
        } else {
          this.$bvModal.msgBoxOk(message, merged)
        }
      },
      confirm (message, opts) {
        this.confirmAnswer = false
        this.openConfirm = true
        const merged = Object.assign({
          title: '請確認',
          size: 'sm',
          buttonSize: 'sm',
          okVariant: 'outline-success',
          okTitle: '確定',
          cancelVariant: 'secondary',
          cancelTitle: '取消',
          footerClass: 'p-2',
          hideHeaderClose: false,
          noCloseOnBackdrop: false,
          centered: true,
          contentClass: 'shadow'
        }, opts)
        // use HTML content
        const h = this.$createElement
        const msgVNode = h('div', {
          domProps: {
            innerHTML: message
          }
        })
        this.$bvModal.msgBoxConfirm([msgVNode], merged)
          .then((value) => {
            this.confirmAnswer = value
            if (this.confirmAnswer && merged.callback && typeof merged.callback === 'function') {
              merged.callback.apply(this, arguments)
            }
          }).catch((err) => {
            this.$error(err)
          })
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
      async removeCache (key) {
        if (this.empty(key)) { return false }
        try {
          await this.$localForage.removeItem(key)
        } catch (err) {
          console.error(err)
        }
        return true
      },
      openNewWindow (url, e) {
        if (window) {
          const win = window.open(url, '_blank')
          win.focus()
        }
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
      }
    }
  })
