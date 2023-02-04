<template lang="pug">
b-modal(
  ref="modal",
  center,
  hide-footer,
  :title="title",
  :size="size"
)
  b-input.w-100.mb-2(ref="keyword", v-model="keyword", placeholder="篩選關鍵字")
  transition-group(name="list", mode="out-in"): lah-button.float-left.mr-1.mb-1(
    v-for="(item, idx) in tmp",
    :key="`list_${item.label}_${idx}`",
    @click="emitSelection(item)",
    :pill="pill"
  ) {{ item.label }}
</template>

<script>
export default {
  emit: ['select'],
  props: {
    /**
     * list item: {
     *   label: 'XXXX',
     *   value: 'OOOO',
     *   raw
     * }
     */
    list: { type: Array, default: () => [] },
    size: { type: String, default: 'md' },
    pill: { type: Boolean, default: false },
    title: { type: String, default: '選擇欲指定的資料' },
    delay: { type: Number, default: 400 }
  },
  data: () => ({
    keyword: '',
    tmp: []
  }),
  computed: {},
  watch: {
    keyword (val) {
      this.filter(val)
    }
  },
  created () {
    this.tmp = [...this.list]
    this.filter = this.$utils.debounce((val) => {
      this.tmp = this.list.filter((item) => {
        if (this.$utils.empty(val)) {
          return true
        }
        return item.label.includes(val)
      })
    }, this.delay)
  },
  mounted () {
    this.filter()
  },
  methods: {
    emitSelection (payload) {
      this.$emit('select', payload)
    },
    show () {
      this.$refs.modal.show()
    },
    hide () {
      this.$refs.modal.hide()
    },
    filterKeyword (key, name, keyword) {
      if (this.$utils.empty(keyword)) {
        return true
      }
      return key.includes(keyword) || name.includes(keyword)
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
