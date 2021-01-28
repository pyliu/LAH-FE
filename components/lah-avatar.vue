<template>
  <span>
    <b-avatar
      button 
      :variant="variant" 
      :size="`${size}em`" 
      :src="avatarSrc" 
      @click="photoClick($event)"
      class="my-auto"
    />
    <slot></slot>
  </span>
</template>

<script>
import lahUserPhoto from '~/components/lah-user-photo.vue'

export default {
  components: { lahUserPhoto },
  props: {
    userData: { type: Object, required: true },
    size: { type: String, default: '1.3' },
    variant: { type: String, default: 'light' }
  },
  computed: {
    avatarSrc () {
      return `${this.apiSvrHttpUrl}/get_user_img.php?id=${this.userData['id']}_avatar&name=${this.userData['name']}_avatar`
    }
  },
  methods: {
    photoClick (evt) {
      evt && evt.stopPropagation()
      this.modal(this.$createElement('lah-user-photo', {
        props: {
          userData: this.userData
        }
      }), {
        title: `${this.userData['id']} ${this.userData['name']} 照片`,
        size: 'lg'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
