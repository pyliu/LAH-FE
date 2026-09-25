<template lang="pug">
b-avatar(
  :src="avatarSrc"
  :size="size"
  :title="nametag"
  v-b-popover.hover.topright="{ content: logon }"
  button
  @click="click"
)
</template>

<script>
import lahMessengerBase from '~/mixins/lah-messenger-base'
import LahMessengerUserCard from '~/components/lah-messenger-user-card.vue'

export default {
  name: 'LahMessengerUserAvatar',
  components: { LahMessengerUserCard },
  mixins: [lahMessengerBase],
  props: {
    userData: { type: Object, required: true },
    size: { type: String, default: '2rem' }
  },
  computed: {
    uid () { return this.userData?.userid },
    uname () { return this.userData?.username || this.userMap[this.userData?.userid] || this.userData?.userid },
    nametag () { return this.uid === this.uname ? this.uid : `${this.uid} ${this.uname}` },
    logon () {
      if (!this.userData?.timestamp) return '上線時間未提供'
      return `登入時間：${this.$utils.toADDate(this.userData.timestamp).split(' ')[1]} (${this.$utils.formatDistanceToNow(this.userData.timestamp)})`
    },
    avatarSrc () { return `${this.apiQueryUrl}/get_user_img.php?id=${this.uid}_avatar&name=${this.uname}_avatar` }
  },
  methods: {
    click (event) {
      event.stopPropagation()
      event.preventDefault()
      this.modal(this.$createElement(LahMessengerUserCard, {
        props: {
          id: this.uid,
          name: this.uname
        }
      }), {
        title: this.uname,
        size: 'xl'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
