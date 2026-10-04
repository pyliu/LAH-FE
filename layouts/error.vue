<template lang="pug">
div
  lah-error-view(:error="error")
</template>

<script>
import LahErrorView from '~/components/lah-error-view.vue'

export default {
  components: { LahErrorView },
  layout: 'default',
  props: {
    error: {
      type: Object,
      default: () => null
    }
  },
  head () {
    return {
      title: `${this.error?.statusCode || 500} 錯誤訊息 - 桃園市地政局`
    }
  }
}
</script>
