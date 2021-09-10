<template lang="pug">
  span
    b-avatar.my-auto(
      v-if="enableAvatar"
      button
      :variant="variant"
      :size="`${size}em`"
      :src="avatarSrc"
      :title="`${userId} ${userName}`"
      @click="photoClick($event)"
      @img-error="srcNotAvailable"
    )
    slot
</template>

<script>
import lahUserPhoto from '~/components/lah-user-photo.vue'

export default {
  components: { lahUserPhoto },
  props: {
    userData: { type: Object, default: () => ({}) },
    id: { type: String, default: '' },
    name: { type: String, default: '' },
    size: { type: String, default: '1.3' },
    variant: { type: String, default: 'light' },
    ignoreSystemConfig: { type: Boolean, default: false }
  },
  computed: {
    userId () {
      return this.userData.id || this.id
    },
    userName () {
      return this.userData.name || this.userNames[this.id] || this.name
    },
    avatarSrc () {
      return `${this.apiSvrHttpUrl}/get_user_img.php?id=${this.userId}_avatar&name=${this.userName}_avatar`
    },
    enableAvatar () {
      if (this.ignoreSystemConfig) { return true }
      if (this.systemConfigs) { return this.systemConfigs.avatar === true || this.systemConfigs.avatar === 'true' }
      return false
    }
  },
  methods: {
    photoClick (evt) {
      evt && evt.stopPropagation()
      this.modal(this.$createElement('lah-user-photo', {
        props: {
          userData: this.userData,
          id: this.id,
          name: this.name,
          center: true,
          rounded: true
        }
      }), {
        title: `${this.userId} ${this.userName} 照片`,
        size: 'lg'
      })
    },
    srcNotAvailable (evt) {

    }
  }
}
</script>

<style lang="scss" scoped>
</style>
