<template lang="pug">
b-container(v-cloak fluid)
  Nuxt
  lah-footer
  .version.shadow v{{ $config.pkgVersion }}
</template>

<script>
export default {
  data () {
    return {
      // Konami Code sequences and their identifiers
      konamiCodes: [
        {
          name: 'default',
          sequence: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']
        },
        {
          name: 'adminToggle',
          sequence: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'B', 'A']
        }
      ],
      userInputSequence: []
    }
  },
  computed: {
    isAdmin () {
      return this.$store.getters.authority?.isAdmin
    }
  },
  created () {
    // this.$acts.cancel('page cahnged ... previous axios request has been cancelled!')
    this.login()
  },
  async mounted () {
    // userNames initial value is undefined
    if (this.userNames === undefined && this.userNames !== null) {
      try {
        // flag to ensure doing this task once
        this.$store.commit('userNames', null)
        const json = await this.getCache('userNames')
        if (json !== false) {
          // within a day use the cached data
          this.$store.commit('userNames', json || {})
        } else {
          await this.$axios.post(this.$consts.API.JSON.USER, {
            type: 'user_mapping'
          }).then(({ data }) => {
            const json = data.data
            // one day in milliseconds
            this.setCache && this.setCache('userNames', json, 24 * 60 * 60 * 1000)
            this.$store.commit('userNames', json || {})
          }).catch((err) => {
            console.error(err)
            this.$store.commit('userNames', {})
          })
        }
      } catch (e) {
        console.error('讀取 userNames 失敗', e)
      }
    }
    // debug for runtime config
    this.$utils.warn(this.$config)
    window.addEventListener('keydown', this.handleKeydown)
  },
  beforeDestroy () {
    window.removeEventListener('keydown', this.handleKeydown)
  },
  methods: {
    handleKeydown (e) {
      // Ignore modifier keys like Shift if they are pressed alone
      if (e.key === 'Shift') {
        return
      }

      const key = e.key
      this.userInputSequence.push(key)

      // Check against all konami codes
      this.konamiCodes.forEach((code) => {
        // Check if the end of the user sequence matches the code sequence
        const userSequenceEnd = this.userInputSequence.slice(-code.sequence.length)
        if (JSON.stringify(userSequenceEnd) === JSON.stringify(code.sequence)) {
          if (code.name === 'default') {
            this.toggleAdminSecret()
          } else if (code.name === 'adminToggle') {
            this.konamiSecret()
          }
          // Reset sequence to prevent multiple triggers
          this.userInputSequence = []
        }
      })

      // Optional: limit the size of userInputSequence to prevent it from growing indefinitely
      const longestCodeLength = Math.max(...this.konamiCodes.map(c => c.sequence.length))
      if (this.userInputSequence.length > longestCodeLength) {
        this.userInputSequence.shift()
      }
    },
    konamiSecret () {
      this.$axios.cancelAll('KONAMI：取消目前所有XHR請求')
      this.clearCache()
      this.confirm('想要重新整理頁面嗎？', { title: '🎉 KONAMI 彩蛋 🎉' }).then((YN) => {
        if (YN) {
          window.location.reload()
        }
      })
    },
    toggleAdminSecret () {
      // Toggle admin status
      const newAdminState = !this.isAdmin
      this.$store.commit('admin', newAdminState)
      // Notify user
      if (newAdminState) {
        this.success('🎉 管理者權限已開啟 🎉', {
          title: 'KONAMI +30 Lifes'
        })
      } else {
        this.warning('管理者權限已關閉', {
          title: 'KONAMI -30 Lifes'
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.version {
  position: fixed;
  right: 15px;
  bottom: 15px;
  font-weight: bold;
  font-size: 0.75rem;
  letter-spacing: 0.5px;

  /* 預設狀態：幽靈標籤風格 (Ghost Badge)，低調且適應亮/暗背景 */
  color: rgba(150, 150, 150, 0.8);
  background-color: rgba(150, 150, 150, 0.1);
  border: 1px solid rgba(150, 150, 150, 0.3);
  padding: 0.25rem 0.5rem;
  border-radius: 0.35rem;
  z-index: 9999;
  transition: all 0.3s ease-in-out;
  cursor: default;

  &:hover {
    /* 懸停狀態：高對比實體化 + 白色外發光，確保暗色系中絕對清晰可見 */
    color: #ffffff !important;
    background-color: #343a40 !important;
    border-color: #ffffff;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.6);
    transform: translateY(-2px); /* 微微上浮增加互動感 */
  }
}
</style>
