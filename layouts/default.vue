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
      // Konami Code sequence
      konamiCode: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'],
      userInputSequence: []
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
      if (this.konamiCode.includes(e.key)) {
        this.userInputSequence.push(e.key)
        // Trim the sequence to the length of the Konami code
        if (this.userInputSequence.length > this.konamiCode.length) {
          this.userInputSequence.shift()
        }
        // Check if the sequence matches
        if (JSON.stringify(this.userInputSequence) === JSON.stringify(this.konamiCode)) {
          this.konamiSecret()
          // Reset sequence after activation
          this.userInputSequence = []
        }
      } else {
        // Reset if the wrong key is pressed
        this.userInputSequence = []
      }
    },
    konamiSecret () {
      this.success('🎉 KONAMI 彩蛋 🎉')
      this.$axios.cancelAll('KONAMI：取消目前所有XHR請求')
      this.clearCache()
      this.confirm('想要重新整理頁面嗎？', { title: 'KONAMI +30 Lifes' }).then((YN) => {
        if (YN) {
          window.location.reload()
        }
      })
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
}
</style>
