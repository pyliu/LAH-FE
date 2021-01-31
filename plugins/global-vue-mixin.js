import Vue from 'vue'
import $ from 'jquery'
// inject to all Vue instances
Vue.mixin({
  data: () => ({
    isBusy: false,
    busyIconSize: undefined
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
    }
  },
  computed: {
    viewportRatio () { return ((window.innerWidth) * 1.08).toFixed(2) / (window.innerHeight - 85 - 20).toFixed(2) },
    ip () { return this.$store.getters.ip },
    site () {
      if (/(^220\.1\.33\.|^192\.168\.[0-9]\.)/g.test(this.apiSvrIp)) {
        return 'H0'
      }
      if (/(^220\.1\.34\.|^192\.168\.1[0-9]\.)/g.test(this.apiSvrIp)) {
        return 'HA'
      }
      if (/(^220\.1\.35\.|^192\.168\.2[0-9]\.)/g.test(this.apiSvrIp)) {
        return 'HB'
      }
      if (/(^220\.1\.36\.|^192\.168\.3[0-9]\.)/g.test(this.apiSvrIp)) {
        return 'HC'
      }
      if (/(^220\.1\.37\.|^192\.168\.4[0-9]\.)/g.test(this.apiSvrIp)) {
        return 'HD'
      }
      if (/(^220\.1\.38\.|^192\.168\.5[0-9]\.)/g.test(this.apiSvrIp)) {
        return 'HE'
      }
      if (/(^220\.1\.39\.|^192\.168\.6[0-9]\.)/g.test(this.apiSvrIp)) {
        return 'HF'
      }
      if (/(^220\.1\.40\.|^192\.168\.7[0-9]\.)/g.test(this.apiSvrIp)) {
        return 'HG'
      }
      if (/(^220\.1\.41\.|^192\.168\.8[0-9]\.)/g.test(this.apiSvrIp)) {
        return 'HG'
      }
      return this.svr ? (this.svr.config ? this.svr.config.site : 'HB') : 'HB'
    },
    svr () { return this.$store.getters.svr },
    authority () {
      return this.svr ? this.svr.config.authority : {
        isAdmin: false,
        isChief: false,
        isGA: false,
        isRAE: false,
        isSuper: false
      }
    },
    myinfo () {
      return this.svr.user
    },
    webapIp () { return this.svr ? (this.svr.config ? this.svr.config.webap_ip : '127.0.0.1') : '127.0.0.1' },
    apiSvrIp () {
      if (this.svr && Array.isArray(this.svr.ips) && this.svr.ips.length > 0) {
        return this.svr.ips[this.svr.ips.length - 1]
      }
      return '127.0.0.1'
    },
    apiSvrPort () {
      if (this.svr && typeof this.svr.server === 'object') {
        return this.svr.server.SERVER_PORT
      }
      return '80'
    },
    apiSvrHttpUrl () {
      return `http://${this.apiSvrIp}:${this.apiSvrPort}`
    },
    toastCounter () { return this.$store.getters.toastCounter }
  },
  methods: {
    $,  // jQuery '$',
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
          coverEl.addClass(this.$consts.loadingShapeSet[this.$utils.rand(this.$consts.loadingShapeSet.length)]) // shape
            .addClass(this.$consts.loadingShapeColor[this.$utils.rand(this.$consts.loadingShapeColor.length)]) // color
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
    timeout (func, ms) {
      return new Promise((resolve, reject) => {
        if (parseInt(ms) === NaN || parseInt(ms) < 1) {
          reject(new Error('timeout function second param should be an integer that is greater than 0'))
        } else if (typeof func !== 'function') {
          reject(new Error('timeout function first param should be a function'))
        } else {
          resolve(setTimeout(func, ms))
        }
      })
    },
    makeToast (message, opts = {}) {
      return new Promise((resolve, reject) => {
        if (this.$isServer) {
          reject('Server side doesn\'t use  toast')
        } else if (this.$bvToast) {
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
              // override the position by type/variant
              switch(opts.variant) {
                case 'danger':
                case 'red':
                  // opts.toaster = 'b-toaster-bottom-center'
                  // break
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
            subtitle: this.$utils.now().split(' ')[1],
            href: '',
            noAutoHide: false,
            autoHideDelay: 5000,
            solid: true,
            toaster: 'b-toaster-bottom-right',
            appendToast: true,
            variant: 'info'
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

          if (this.$store) {
            this.$store.commit('addToastCounter')
          }
          // resolve the final opts back
          merged.message = message
          resolve(merged)
        } else {
          reject(new Error('No this.$bvToast, toast window can not be shown'))
        }
      })
    },
    notify (msg, opts = { title: '通知' }) {
      return new Promise((resolve, reject) => {
        if (typeof msg !== 'string' && typeof opts !== 'object') {
          reject(`notify 傳入參數有誤: msg:${msg}, opts: ${opts}`)
        } else {
          const defDelay = (opts.variant === 'danger' ? 7500 : (opts.variant === 'warning' ? 6250 : 5000))
          if (typeof msg === 'string') {
            opts.variant = opts.type || opts.variant || 'default'
            opts.autoHideDelay = opts.duration || opts.delay || defDelay
          } else if (typeof msg === 'object') {
            opts = msg
            // previous API only use one object param
            msg = opts.body || opts.message
            opts.variant = opts.type || opts.variant || 'default'
            opts.autoHideDelay = opts.duration || opts.delay || defDelay
          }
          this.makeToast(msg, opts).then((config) => {
            resolve(config)
          }).catch((err) => {
            this.$utils.error(err)
            reject(err)
          })
        }
      })
    },
    warning (message, opts = {}) {
      if (!this.$utils.empty(message)) {
        const merged = Object.assign({
          title: '警示',
          autoHideDelay: 7500,
          pos: 'bl',
          variant: 'warning'
        }, opts)
        this.notify(message, merged)
      }
    },
    alert (message, opts = {}) {
      if (!this.$utils.empty(message)) {
        opts.pos = (opts && opts.pos === 'bottom') ? 'bf' : 'tf'
        const merged = Object.assign({
          title: '錯誤',
          autoHideDelay: 10000,
          variant: 'danger'
        }, opts)
        this.notify(message, merged)
      }
    },
    attention (selector, opts = { name: 'flash', speed: 'faster' }) {
      return this.$utils.animated(selector, opts)
    },
    showModalById (id) {
      this.$bvModal && this.$bvModal.show(id)
    },
    hideModalById (id) {
      this.$bvModal && this.$bvModal.hide(id)
    },
    modal (message, opts) {
      return new Promise((resolve, reject) => {
        if (this.$isServer) {
          reject('Server side doesn\'t use modal')
        } else if (this.$bvModal) {
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
            noFade: false,
            contentClass: 'shadow',
            html: false,
            root: false
          }, opts)
          // use d-none to hide footer
          merged.footerClass = merged.hideFooter ? 'd-none' : 'p-2'
          if (typeof message === 'object') {
            // assume the message is VNode
            message = [message]
          } else if (merged.html) {
            // HTML message content
            merged.titleHtml = merged.title
            merged.title = undefined
            const msgVNode = this.$createElement('div', { domProps: { innerHTML: message } })
            message = [msgVNode]
          }
          // https://bootstrap-vue.org/docs/components/modal#modal-message-boxes
          const modal = merged.root ? this.$root.$bvModal : this.$bvModal
          modal.msgBoxOk(message, merged).then((val) => {
            // val will be always true from $bvModal.msgBoxOk window closed
          }).catch(err => {
            reject(err)
          })
          // resolve the final opts back
          merged.message = message
          resolve(merged)
        } else {
          reject(new Error('No this.$bvModal, modal window can not be shown'))
        }
      })
    },
    confirm (message, opts = {}) {
      return new Promise((resolve, reject) => {
        if (this.$isServer) {
          reject('Server side doesn\'t use confirm')
        } else if (this.$bvModal) {
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
          const msgVNode = h('div', { domProps: { innerHTML: message } })
          this.$bvModal.msgBoxConfirm([msgVNode], merged).then((value) => {
            resolve(value)  // true, false or null
          }).catch((err) => {
            reject(err)
          })
        } else {
          reject(new Error('No this.$bvModal, confirm window can not be shown'))
        }
      })
    },
    trigger (evtName, payload) {
      if (CustomEvent) {
        let evt = new CustomEvent(evtName, {
          detail: payload,
          bubbles: true
        });
        Object.defineProperty(evt, 'target', {writable: false, value: this.$el});
        this.$emit(evtName, evt)
        return evt
      } else {
        console.warning('CustomEvent not defined?')
      }
    },
    async setCache (key, val, expire_timeout = 0) {
      if (this.$utils.empty(key) || this.$localForage === undefined) { return false }
      try {
        const item = {
          key,
          value: val,
          timestamp: +new Date(), // == new Date().getTime()
          expire_ms: expire_timeout // milliseconds
        }
        this.$localForage.setItem(key, item).then((value) => {
          // Do other things once the value has been saved.
        }).catch((err) => {
          // This code runs if there were any errors
          this.$utils.error(err)
        })
      } catch (err) {
        this.$utils.error(err)
        return false
      }
      return true
    },
    async getCache (key) {
      if (this.$utils.empty(key) || this.$localForage === undefined) { return false }
      try {
        const item = await this.$localForage.getItem(key)
        if (this.$utils.empty(item)) { return false }
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
      if (this.$utils.empty(key) || this.$localForage === undefined) { return false }
      try {
        const item = await this.$localForage.getItem(key)
        if (this.$utils.empty(item)) { return false }
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
      if (this.$utils.empty(key) || this.$localForage === undefined) { return false }
      try {
        await this.$localForage.removeItem(key)
      } catch (err) {
        console.error(err)
      }
      return true
    },
    async clearCache () {
      await this.$localForage.clear()
    }
  }
})
