<template lang="pug">
b-card
  b-card-title {{ header }}
</template>

<script>
export default {
  props: {
    header: { type: String, default: '未設定 header' }
  },
  data: () => ({})
}
</script>

<style lang="scss" scoped>
</style>
