<template>
  <span>
    <b-avatar
      button 
      :variant="variant" 
      :size="`${size}em`" 
      :src="avatarSrc" 
      @click="photoClick($event)"
      class="my-auto"
      :title="`${userId} ${userName}`"
    />
    <slot></slot>
  </span>
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
    variant: { type: String, default: 'light' }
  },
  computed: {
    userId () {
      return this.userData['id'] || this.id
    },
    userName () {
      return this.userData['name'] || this.name
    },
    avatarSrc () {
      return `${this.apiSvrHttpUrl}/get_user_img.php?id=${this.userId}_avatar&name=${this.userName}_avatar`
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
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
