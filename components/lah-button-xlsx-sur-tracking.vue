<template lang="pug">
lah-button(
  icon="file-excel",
  regular,
  :title="title",
  :action="action",
  :size="size",
  :variant="variant",
  :no-icon-gutter="noIconGutter",
  :disabled="disabled",
  :pill="pill",
  @click="download"
): slot
</template>

<script>
import lahXlsxSurTrackingDownload from '~/components/lah-xlsx-sur-tracking-download.vue'
export default {
  components: { lahXlsxSurTrackingDownload },
  props: {
    jsons: { type: Array, default: () => ([]) },
    header: { type: String, default: '匯出XLSX檔案' },
    noIconGutter: { type: Boolean, default: true },
    variant: { type: String, default: 'outline-success' },
    size: { type: String, default: 'lg' },
    action: { type: String, default: 'move-fade-ltr' },
    title: { type: String, default: '匯出EXCEL' },
    pill: { type: Boolean, default: false }
  },
  computed: {
    dataCount () {
      return this.jsons.length
    },
    disabled () {
      return this.dataCount === 0
    }
  },
  methods: {
    download () {
      this.modal(this.$createElement(lahXlsxSurTrackingDownload, {
        props: {
          header: this.header,
          jsonArray: this.jsons || []
        }
      }), {
        title: `產製 - ${this.header}`
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
