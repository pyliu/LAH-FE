<template lang="pug">
b-card
  template(#header): .d-flex.justify-content-between
    lah-fa-icon(icon="circle", :variant="light")
    strong {{ header }}
    b-button-group.ml-auto(
      size="sm"
    )
      lah-button(
        icon="sync-alt",
        action="ld-cycle",
        variant="outline-secondary",
        no-border,
        no-icon-gutter,
        @click="reload",
        title="重新讀取"
      )
      lah-button(
        icon="question",
        action="breath",
        variant="outline-success",
        no-border,
        no-icon-gutter,
        @click="showModalById(modalId)",
        title="說明"
      )
    lah-help-modal(:modal-id="modalId", :modal-title="`${header} 說明`")
      h6 顯示資料庫 Data Guard 狀態
      hr
      div 👉🏻 點擊紀錄內容開啟詳細記錄視窗
      div 🟢 表示一切正常
      div 🟡 表示超過一天未更新
      div 🔴 表示狀態錯誤
  slot
  ul: li(v-for="(item, idx) in headMessages")
    .d-flex.justify-content-between
      a.truncate-short(
        href="#",
        @click="popupLogContent(item)",
        title="顯示詳細記錄"
      ) {{ item.subject }}
      lah-fa-icon.small.my-auto.text-nowrap(icon="clock", regular) {{ displayDatetime(item.timestamp) }}
    .truncate.text-muted.small {{ keyMessage(item) }}
  template(#footer): .d-flex.justify-content-between.small.text-muted
    span {{ site }}
    span {{ updatedTimestamp }}
</template>

<script>
export default {
  data: () => ({
    header: '資料庫 Data Guard',
    modalId: 'tmp-id',
    messages: [],
    updatedTimestamp: ''
  }),
  computed: {
    headMessages () {
      return this.messages.filter((item, idx, arr) => idx < 3)
    },
    today () {
      // e.g. 2021-12-27
      const now = new Date()
      return (
        now.getFullYear() +
        '-' +
        ('0' + (now.getMonth() + 1)).slice(-2) +
        '-' +
        ('0' + now.getDate()).slice(-2)
      )
    },
    light () {
      if (this.headMessages.length === 0) {
        return 'warning'
      }
      const criteria = this.keyMessage(this.headMessages[0])
      const ans = this.headMessages.every((item, index, array) => {
        return criteria === this.keyMessage(item)
      })
      return ans ? 'success' : 'danger'
    }
  },
  created () {
    this.modalId = this.$utils.uuid()
    this.reload()
  },
  methods: {
    keyMessage (item) {
      // console.log(item.message)
      const regex = /Current\s+log\s+sequence\s+\d+/gm
      let m
      let found = '找不到相關文字'
      while ((m = regex.exec(item.message)) !== null && found === '找不到相關文字') {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
          regex.lastIndex++
        }
        // The result can be accessed through the `m`-variable.
        m.forEach((match, groupIndex) => {
          found = match
        })
      }
      return found
    },
    truncate (content) {
      return content?.substring(0, 100).replaceAll('\n', '<br/>') + ' ...'
    },
    displayDatetime (ts) {
      const fullDt = this.$utils.tsToAdDateStr(ts, true)
      return fullDt.replace(this.today, '')
    },
    popupLogContent (item) {
      this.modal(item.message?.replaceAll('\n', '<br/>'), {
        title: `${this.header} - ${item.subject}`,
        size: 'lg',
        html: true
      })
    },
    reload () {
      this.isBusy = true
      // to update untaken data in sqlite db
      this.$axios
        .post(this.$consts.API.JSON.MONITOR, {
          type: 'subject',
          keyword: 'DataGuard'
        })
        .then(({ data }) => {
          if (this.$utils.statusCheck(data.status)) {
            this.messages = [...data.raw]
          } else {
            this.warning(data.message)
          }
        })
        .catch((err) => {
          this.alert(err.message)
          this.$utils.error(err)
        })
        .finally(() => {
          this.isBusy = false
          this.updatedTimestamp = this.$utils.now()
        })
    }
  }
}
</script>

<style lang="scss" scoped>
@mixin truncateBase() {
  width: calc((100vw - 300px) / 3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.truncate {
  @include truncateBase();
  p {
    margin-bottom: 0px !important;
  }
}
.truncate-short {
  @include truncateBase();
  width: calc((100vw - 350px) / 4);
}
ul {
  padding-left: 21.25px;
}
</style>
