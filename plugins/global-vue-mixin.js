/* eslint-disable prefer-promise-reject-errors */
import $ from 'jquery'
import isEmpty from 'lodash/isEmpty'
import Vue from 'vue'
import { mapActions, mapGetters } from 'vuex'

// inject to all Vue instances
Vue.mixin({
  data: () => ({
    isBusy: false,
    busyIconSize: undefined
  }),
  computed: {
    ...mapGetters([
      'loggedIn',
      'ip',
      'apiSvrIps',
      'apiSvrIp',
      'apiSvrPort',
      'lastMessage',
      'systemConfigs',
      'apiHost',
      'apiPort',
      'wsHost',
      'wsPort',
      'user',
      'userNames',
      'siteUserNames',
      'authority',
      'server',
      'topXap',
      'xapMap',
      'timestamp',
      'imageMemento',
      'imageMementoCapacity',
      'imageMementoCacheKey',
      'latestImageMemento',
      'messageMemento',
      'messageMementoCapacity',
      'messageMementoCacheKey',
      'latestMessageMemento',
      'fetchingMonitorMail',
      'fetchedMonitorMailCount'
    ]),
    site () {
      if (this.systemConfigs && this.systemConfigs.site) {
        return this.systemConfigs.site
      }
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
      return 'HA'
    },
    siteName () {
      return this.$consts.siteMap.get(this.site)?.name || '未知所別'
    },
    isDevOffice () {
      return this.site === 'HA'
    },
    myinfo () { return isEmpty(this.user) ? { id: '', name: '' } : this.user },
    myid () { return this.user.id },
    myname () { return this.user.name },
    webapIp () { return isEmpty(this.systemConfigs.webap_ip) ? '127.0.0.1' : this.systemConfigs.webap_ip },
    legacyUrl () { return `http://${this.apiSvrIp}:${this.apiSvrPort}` },
    componentName () { return this.$options.name || this.$ooptions._componentTag },
    isSur () { return this.myinfo?.unit === '測量課' },
    isVal () { return this.myinfo?.unit === '地價課' },
    isInf () { return this.myinfo?.unit === '資訊課' },
    isReg () { return this.myinfo?.unit === '登記課' },
    isAdm () { return this.myinfo?.unit === '行政課' }
  },
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
  methods: {
    ...mapActions([
      'login'
    ]),
    $, // jQuery '$'
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
    parseHTML (string) {
      if (document) {
        const context = document.implementation.createHTMLDocument()
        // Set the base href for the created document so any parsed elements with URLs
        // are based on the document's URL
        const base = context.createElement('base')
        base.href = document.location.href
        context.head.appendChild(base)
        context.body.innerHTML = string
        return context.body.children
      }
    },
    pasteImage (pasteEvent, callback) {
      // pasteEvent.stopPropagation()
      // pasteEvent.preventDefault()
      const items = (pasteEvent.clipboardData || pasteEvent.originalEvent.clipboardData).items
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.includes('image')) {
          this.$utils.log('剪貼版發現影像資料，準備直接轉換成base64影像資料 ... ')
          const file = item.getAsFile()
          this.uploadImage(file, callback)
        }
      }
    },
    uploadImage (file, callback) {
      this.isBusy = true
      const formData = new FormData()
      formData.append('file', file)
      formData.append('width', 1920)
      formData.append('height', 1080)
      formData.append('quality', 80)
      this.$upload.post(this.$consts.API.FILE.BASE64, formData).then(({ data }) => {
        if (!this.$utils.empty(data.encoded) && !this.$utils.empty(data.uri)) {
          const encoded = `${data.uri}${data.encoded}`
          this.$store.commit('addImageMemento', encoded)
          callback && callback(encoded)
          if (!this.$utils.statusCheck(data.status)) {
            this.warning(data.message, { title: '上傳圖檔結果' })
          }
        } else {
          this.warning('回傳的影像編碼有誤', { title: '貼上的影像處理結果' })
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    },
    toggleBusy (opts = {}) {
      const def = {
        selector: 'body',
        style: 'ld-over', // ld-over, ld-over-inverse, ld-over-full, ld-over-full-inverse
        forceOff: false,
        forceOn: false
      }
      opts = { ...def, ...opts }
      const container = this.$(opts.selector)
      if (container.length > 0) {
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
      } else {
        console.error(`${opts.selector} not found in DOM`)
      }
    },
    timeout (func, ms) {
      return new Promise((resolve, reject) => {
        const delayMs = parseInt(ms)
        if (isNaN(delayMs) || delayMs < 0) {
          reject(new Error('timeout function second param should be an integer'))
        } else if (typeof func !== 'function') {
          reject(new Error('timeout function first param should be a function'))
        } else {
          resolve(setTimeout(func, ms))
        }
      })
    },
    makeToast (message, opts = {}) {
      if (document) {
        // skip making toast when document is not visible
        if (document.hidden) {
          this.$utils.warn('document is hidden ... skip makeToast message', message)
          return
        }
        return new Promise((resolve, reject) => {
          if (this.$isServer) {
            reject('Server side doesn\'t use toast')
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
                switch (opts.variant) {
                  case 'danger':
                  case 'red':
                    opts.toaster = 'b-toaster-top-center'
                    break
                  case 'warning':
                  case 'yellow':
                    opts.toaster = 'b-toaster-top-right'
                    break
                  default:
                    opts.toaster = 'b-toaster-top-right'
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

            // resolve the final opts back
            merged.message = message
            resolve(merged)
          } else {
            reject(new Error('No this.$bvToast, toast window can not be shown'))
          }
        })
      }
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
    info (message, opts = {}) {
      if (!isEmpty(message)) {
        const merged = Object.assign({
          title: '訊息',
          autoHideDelay: 5000,
          variant: 'info'
        }, opts)
        this.notify(message, merged)
      }
    },
    success (message, opts = {}) {
      if (!isEmpty(message)) {
        const merged = Object.assign({
          title: '成功',
          autoHideDelay: 5000,
          variant: 'success'
        }, opts)
        this.notify(message, merged)
      }
    },
    warning (message, opts = {}) {
      if (!isEmpty(message)) {
        const merged = Object.assign({
          title: '警示',
          autoHideDelay: 7500,
          variant: 'warning'
        }, opts)
        this.notify(message, merged)
        this.$utils.warn(message)
      }
    },
    alert (message, opts = {}) {
      if (!isEmpty(message)) {
        if (opts && opts.pos === 'bottom') {
          opts.pos = 'bf'
        } else if (opts && opts.pos === 'top') {
          opts.pos = 'tf'
        }
        const merged = Object.assign({
          title: '錯誤',
          autoHideDelay: 10000,
          variant: 'danger'
        }, opts)
        this.notify(message, merged)
        this.$utils.error(message)
      }
    },
    attention (selector, opts = { name: 'flash', speed: 'faster' }) {
      return process.client && this.$utils.animated(selector, opts)
    },
    showModalById (id) {
      this.$bvModal && this.$bvModal.show(id)
    },
    hideModalById (id) {
      this.$bvModal && this.$bvModal.hide(id)
    },
    showModal (id) {
      this.showModalById(id || 'dynamic-modal-control')
    },
    hideModal (id) {
      this.hideModalById(id || 'dynamic-modal-control')
    },
    modal (message, opts) {
      return new Promise((resolve, reject) => {
        if (this.$isServer) {
          reject('Server side doesn\'t use modal')
        } else if (this.$bvModal) {
          const merged = Object.assign({
            id: 'dynamic-modal-control', // used for show/close by programming
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
          }).catch((err) => {
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
    userinfo (name, id = '') {
      const props = {}
      // 判斷有無中文
      if (/[\u4E00-\u9FFF]/.test(name)) {
        props.name = name
      } else {
        props.id = name
      }
      if (!isEmpty(id)) {
        props.id = id
      }
      const h = this.$createElement
      name !== 'XXXXXXXX' && this.modal(h('lah-user-card', { props }), {
        title: `${name} 使用者資訊${this.$utils.empty(id) ? '' : ` (${id})`}`
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
            resolve(value) // true, false or null
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
        const evt = new CustomEvent(evtName, {
          detail: payload,
          bubbles: true
        })
        Object.defineProperty(evt, 'target', { writable: false, value: this.$el })
        this.$emit(evtName, evt)
        return evt
      } else {
        console.warn('CustomEvent not defined?')
      }
    },
    post (apiEP, params, busy = true) {
      return new Promise((resolve, reject) => {
        if (busy) {
          this.isBusy = true
        }
        this.$axios.post(apiEP, params).then(({ data }) => {
          resolve(data)
        }).catch((error) => {
          reject(error)
        }).finally(() => {
          if (busy) {
            this.isBusy = false
          }
        })
      })
    },
    get (apiEP, params, busy = false) {
      return new Promise((resolve, reject) => {
        if (busy) {
          this.isBusy = true
        }
        this.$axios.get(apiEP, { params }).then(({ data }) => {
          resolve(data)
        }).catch((error) => {
          reject(error)
        }).finally(() => {
          if (busy) {
            this.isBusy = false
          }
        })
      })
    },
    setCache (key, val, expire_timeout = 0) {
      if (isEmpty(key) || this.$localForage === undefined) { return false }
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
        // cache is possibly full, so lets clear it
        this.clearCache()
        this.$utils.error(err)
        return false
      }
      return true
    },
    async getCache (key) {
      if (isEmpty(key) || this.$localForage === undefined) { return false }
      try {
        const item = await this.$localForage.getItem(key)
        if (isEmpty(item)) { return false }
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
        // cache is possibly full, so lets clear it
        this.clearCache()
        console.error(err)
      }
      return false
    },
    async getCacheExpireRemainingTime (key) {
      if (isEmpty(key) || this.$localForage === undefined) { return false }
      try {
        const item = await this.$localForage.getItem(key)
        if (isEmpty(item)) { return false }
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
        // cache is possibly full, so lets clear it
        this.clearCache()
        console.error(err)
      }
      return false
    },
    async removeCache (key) {
      if (isEmpty(key) || this.$localForage === undefined) { return false }
      try {
        await this.$localForage.removeItem(key)
      } catch (err) {
        // cache is possibly full, so lets clear it
        this.clearCache()
        console.error(err)
      }
      return true
    },
    async clearCache () {
      try {
        await this.$localForage.clear()
      } catch (err) {
        console.error(err)
      }
    }
  }
})
