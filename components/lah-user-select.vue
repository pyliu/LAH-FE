<template lang="pug">
div
  .d-flex.mb-2
    b-input.mr-1(
      v-model="keyword"
      placeholder="請輸入關鍵字 ... "
      trim
    )
    lah-button(icon="times" variant="outline-danger" @click="clean") 清除
  div(v-if="filtered.length > 0")
    transition-group(name="list")
      b-button.m-1(
        v-for="id in filtered"
        :key="id"
        :title="id"
        variant="outline-primary"
        rounded
        @click="update(id)"
      ) {{ id }}:{{ siteUserNames[id].replace(/^(桃園|中壢|大溪|楊梅|蘆竹|八德|平鎮|龜山|龍潭|復興)/g, '').replace(/^(所)/g, '').replace(/([1-9_\s]|離職|分機)/g, '') }}
  h4.center.mt-1(v-else) 查無資料
</template>

<script>
export default {
  props: {
    initKeyword: { type: String, default: '' }
  },
  data: () => ({
    keyword: '',
    names: {}
  }),
  fetch () {
  },
  computed: {
    filtered () {
      if (this.$utils.empty(this.keyword) ||
          // chinese chars length hack
          this.keyword.replace(/[^\x00-\xFF]/g, 'xx').length < 2
      ) {
        return []
      }
      const idRE = new RegExp(`^${this.keyword}`, 'gi')
      const nameRE = new RegExp(`${this.keyword}`, 'gi')
      return Object.keys(this.names).filter((id) => {
        return (id.match(idRE) && !this.names[id].match(/^(登記|地價|測量|資訊|主任|秘書|第|服|會|地|TEST|HH|建)/gi)) ||
               (this.names[id] && this.names[id].match(nameRE))
      })
    }
  },
  watch: {
    siteUserNames (val) {
      this.names = { ...val }
    }
  },
  created () {
    this.keyword = this.initKeyword || this.site
  },
  mounted () {
    this.names = { ...this.siteUserNames }
  },
  methods: {
    update (id) {
      this.trigger('update', id)
      this.keyword = id
    },
    clean () {
      this.trigger('clean')
      this.keyword = this.site
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
