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
  font-weight: 900;
  position: fixed;
  right: 10px;
  bottom: 10px;
  background-color: white;
  padding: 5px;
  border: 1px solid black;
  border-radius: 10px;
  font-size: smaller;
  /* 修改：設置初始很透明 */
  opacity: 0.125;
  /* 修改：添加過渡動畫效果 */
  transition: opacity 0.3s ease;

  /* 修改：滑鼠懸停時變不透明 */
  &:hover {
    opacity: 1;
  }
}
</style>
