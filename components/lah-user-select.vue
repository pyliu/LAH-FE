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
      ) {{ id }}:{{ names[id] }}
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
          this.keyword?.replace(/[^\x00-\xFF]/g, 'xx').length < 2
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
    names (val) {
      this.$utils.warn(val)
    }
  },
  created () {
    this.keyword = this.initKeyword || this.site
  },
  mounted () {
    this.fetchUsers()
  },
  methods: {
    async fetchUsers () {
      const cached = await this.getCache('lah-user-select-users')
      if (cached) {
        this.prepareNames(cached)
      } else {
        this.isBusy = true
        this.users = []
        this.$axios.post(this.$consts.API.JSON.USER, {
          type: 'department_users',
          valid: true,
          department: 'all'
        }).then(({ data }) => {
          if (this.$utils.statusCheck(data.status)) {
            // set cache to one day
            this.setCache('lah-user-select-users', data.raw, 86400 * 1000)
            this.prepareNames(data.raw)
          } else {
            this.notify(data.message, { type: 'warning' })
          }
        }).catch((err) => {
          this.$utils.error(err)
        }).finally(() => {
          this.isBusy = false
        })
      }
    },
    prepareNames (sqliteUsers) {
      const resultObject = sqliteUsers?.reduce((acc, item) => {
        acc[item.id] = item.name
        return acc
      }, {})
      this.names = { ...resultObject }
    },
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
