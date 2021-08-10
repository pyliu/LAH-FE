<template lang="pug">
  b-card()
    b-input(v-model="keyword" trim)
    b-button.m-1(
      v-for="id in filtered"
      :key="id"
      :title="id"
      rounded
      variant="outline-primary"
    ) {{ userNames[id].replace(/^(桃園|中壢|大溪|楊梅|蘆竹|八德|平鎮|龜山|龍潭|復興)/g, '').replace(/^(所)/g, '') }}
</template>

<script>
export default {
  data: () => ({
    keyword: ''
  }),
  fetch () {
  },
  computed: {
    filtered () {
      const re = new RegExp(`^${this.keyword}`, 'gi')
      return Object.keys(this.userNames).filter((id) => {
        return id.match(re) && !this.userNames[id].match(/^(登記|地價|測量|資訊|主任|秘書|第|服|會|地|TEST|HH|建)/gi)
      })
    }
  },
  watch: {
  },
  created () {
    this.keyword = this.site
  },
  methods: {
  }
}
</script>

<style lang="scss" scoped>
</style>
