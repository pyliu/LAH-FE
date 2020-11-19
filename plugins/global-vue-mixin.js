import Vue from 'vue'
import $ from 'jquery'
// inject to all Vue instances
Vue.mixin({
    data: () => ({
      isBusy: false,
      busyIconSize: undefined,
      confirmAns: false,
      confirmOpen: false
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
      ip () { return this.$store.getters.ip },
      viewportRatio () { return ((window.innerWidth) * 1.08).toFixed(2) / (window.innerHeight - 85 - 20).toFixed(2) },
      dayMilliseconds () { return this.$store.getters.dayMilliseconds },
      toastCounter () { return this.$store.getters.toastCounter },
      xhrResponse () { return this.$store.getters.xhrResponse },
      xhrRequest () { return this.$store.getters.xhrRequest }
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
            switch(opts.variant) {
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
          subtitle: this.$utils.now().split(' ')[1],
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
      notify (msg, opts = { title: '通知' }) {
        if (typeof msg === 'string') {
          opts.variant = opts.type || opts.variant || 'default'
          opts.autoHideDelay = opts.duration || opts.delay || 5000
          this.makeToast(msg, opts)
        } else if (typeof msg === 'object') {
          // previous API only use one object param
          const message = msg.body || msg.message
          msg.variant = msg.type || msg.variant || 'default'
          msg.autoHideDelay = msg.duration || msg.delay || 5000
          this.makeToast(message, msg)
        } else  {
          this.alert(`notify 傳入參數有誤: msg:${msg}, opts: ${opts}`)
          this.$error(`notify 傳入參數有誤: msg:${msg}, opts: ${opts}`)
        }
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
      modal (message, opts) {
        return new Promise((resolve, reject) => {
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
          } else {
            this.$bvModal.msgBoxOk(message, merged)
          }
          // TODO: use modalId to resolve ... 
          resolve('modal shown')
        })
      },
      confirm (message, opts) {
        this.confirmAns = false
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
            this.confirmAns = value
            if (this.confirmAns && merged.callback && typeof merged.callback === 'function') {
              merged.callback.apply(this, arguments)
            }
          }).catch((err) => {
            this.$error(err)
          })
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
            this.$error(err)
          })
        } catch (err) {
          this.$error(err)
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
      }
    }
  })
