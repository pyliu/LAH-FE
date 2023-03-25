<template lang="pug">
b-card
  template(#header)
    .d-flex.align-items-center
      h6.mb-0.mt-1.mr-1 #[lah-fa-icon(icon="rotate", size="lg", :variant="'info'", :action="isBusy ? 'spin-fast' : ''") 同步登記案件]
      a.text-primary.font-weight-bold(href="#", @click="detail", title="顯示案件詳情") {{ formattedID }}
      b-button-group.ml-auto(size="sm")
        b-checkbox(v-model="vertical", v-b-tooltip="'切換案件選擇介面橫豎顯示'", switch)
        lah-button(
          icon="question",
          action="breath",
          variant="outline-success",
          no-border,
          no-icon-gutter,
          @click="$refs.help.show()",
          title="同步登記案件說明"
        )
    lah-help-modal(ref="help", modal-title="同步登記案件說明")
      h5 將局端跨所資料同步回本所資料庫
      ul
        li: .d-flex.align-items-center
          span 選擇案件號後點選
          lah-button.mx-1(icon="code-compare", variant="outline-primary", pill) 比對
          span 即可顯示比對狀態。
        li: .d-flex.align-items-center
          span 點選
          lah-button.mx-1(icon="window-restore", variant="outline-success", pill) 詳情
          span 顯示詳細資料彈出視窗。
        li 跨縣市回寫機制會在#[b.text-primary 每分鐘(原則上)]自動回寫，故局端資料(約10分鐘更新)有可能會比較慢更新。【2019-06-26】
        li 局端針對遠端連線同步異動資料庫#[b.text-danger 有鎖連線IP]，故IP不在局端白名單內或不在集中化內的伺服器主機將無法使用本功能。【2020-07-15】
        //-   span 點選
        //-   lah-button.mx-1(icon="trash", variant="outline-secondary", pill) 詳情
        //-   span 清除搜尋資料。

  lah-transition: .d-flex.mb-2(v-if="!connectable")
    lah-fa-icon(icon="circle-exclamation", variant="danger")
      | L3HWEB資料庫({{ l3hwebIp }})無法連線！
    lah-button(icon="globe", variant="info", @click="ping", pill) 重新檢測

  lah-reg-case-input-group(
    v-model="caseId",
    :vertical="vertical",
    type="sync",
    prefix="case_sync",
    @enter="check"
  )
  //- <div>案件詳情：<a href='javascript:void(0)' id='sync_x_case_serial'>" + this.ID + '</a><div></div>
  .d-flex-column.my-1
    b-row(v-if="FAIL_WITH_REMOTE_NO_RECORD"): b-col: .d-flex ⚫ 同步異動無 {{ formattedID }} 案件資料！
    b-row(v-if="FAIL_WITH_LOCAL_NO_RECORD"): b-col: .d-flex
      .h5 🔴 本所無 {{ formattedID }} 案件資料！
      lah-button.ml-1(
        icon="cloud-arrow-down",
        variant="outline-primary",
        action="move-fade-ttb",
        title="於本所資料庫插入資料",
        @click="insert"
      ) 新增
    b-row(v-if="SUCCESS_DATA_SYNCED"): b-col: .d-flex
      lah-fa-icon(icon="check-double", variant="success", size="lg")
      a.text-primary.text-nowrap.font-weight-bold.ml-1(href="#", @click="detail", title="顯示案件詳情") {{ formattedID }}
      .ml-1 案件資料一致。
    b-row(v-if="dataCount > 0"): b-col: .d-flex.align-items-center.h5.mt-3.mb-0
      lah-fa-icon(icon="triangle-exclamation", size="lg")
      .mx-1 找到 #[b-badge(variant="warning", pill) {{ dataCount }}] 筆欄位不相符。
      lah-button(icon="window-restore", variant="outline-success", @click="popup") 顯示
      //- lah-button.ml-1(icon="arrows-rotate", variant="success", action="cycle") 同步全部欄位

  template(#footer)
    .d-flex.justify-content-center
      //- lah-button(v-if="dataReady", icon="window-restore", variant="outline-success", @click="popup", pill) 詳情
      lah-button(icon="code-compare", @click="check", :disabled="!validCaseId", pill) 比對
      lah-button.h-100.ml-1(icon="arrow-rotate-left", variant="outline-secondary", action="cycle-alt", @click="clear", pill) 清除

</template>

<script>
import lahMgmtBoardSyncRegCaseDetailVue from './lah-mgmt-board-sync-reg-case-detail.vue'
import lahRegCaseDetailVue from './lah-reg-case-detail.vue'

export default {
  components: { lahRegCaseDetailVue, lahMgmtBoardSyncRegCaseDetailVue },
  data: () => ({
    caseId: '',
    l3hwebIp: '',
    l3hwebData: null,
    vertical: false,
    connectable: false,
    FAIL_WITH_REMOTE_NO_RECORD: false,
    FAIL_WITH_LOCAL_NO_RECORD: false,
    SUCCESS_DATA_SYNCED: false
  }),
  computed: {
    formattedID () {
      return this.$utils.caseId(this.caseId)
    },
    dataReady () {
      return !this.$utils.empty(this.l3hwebData)
    },
    dataCount () {
      return this.l3hwebData?.length || 0
    },
    validCaseId () {
      if (this.$utils.empty(this.caseId)) {
        return false
      }
      if (this.caseId.length !== 13) {
        return false
      }
      const number = this.caseId.substring(7)
      if (parseInt(number) < 1) {
        return false
      }
      return true
    }
  },
  watch: {
    caseId (val) {
      this.clear()
    },
    l3hwebData (val) {
      // console.warn(val)
    },
    vertical (val) {
      this.setCache('lah-mgmt-board-sync-reg-case-vertical', val)
    }
  },
  async created () {
    this.vertical = await this.getCache('lah-mgmt-board-sync-reg-case-vertical') || false
    this.l3hwebIp = this.systemConfigs.l3hweb_db_ip || '220.1.33.5'
    this.ping()
  },
  methods: {
    check () {
      if (this.validCaseId) {
        this.clear()
        this.isBusy = true
        this.$axios.post(this.$consts.API.JSON.QUERY, {
          type: 'diff_xcase',
          id: this.caseId
        }).then((res) => {
          // let html = ''
          if (this.$utils.statusCheck(res.data.status)) {
            /**
             * raw example:
             * {
                  "RM30_1": {
                      "REMOTE": "HH10012940",
                      "LOCAL": "HA10057026",
                      "TEXT": "作業人員代號",
                      "COLUMN": "RM30_1"
                  }
             * }
             * After Arraylize:
             * [
                  [
                      "RM30_1",
                      {
                          "REMOTE": "HH10012940",
                          "LOCAL": "HA020242",
                          "TEXT": "作業人員代號",
                          "COLUMN": "RM30_1"
                      }
                  ]
             * ]
             */
            this.l3hwebData = [...Object.values(res.data.raw)]
            this.popup()
          } else if (res.data.status === this.$consts.XHR_STATUS_CODE.FAIL_WITH_LOCAL_NO_RECORD) {
            // need to add grab case back button
            this.FAIL_WITH_LOCAL_NO_RECORD = true
          } else if (res.data.status === this.$consts.XHR_STATUS_CODE.FAIL_WITH_REMOTE_NO_RECORD) {
            this.FAIL_WITH_REMOTE_NO_RECORD = true
          } else {
            this.SUCCESS_DATA_SYNCED = true
          }
        }).catch((err) => {
          this.$utils.error(err)
        }).finally(() => {
          this.isBusy = false
        })
      }
    },
    clear () {
      this.l3hwebData = null
      this.FAIL_WITH_REMOTE_NO_RECORD = false
      this.FAIL_WITH_LOCAL_NO_RECORD = false
      this.SUCCESS_DATA_SYNCED = false
    },
    detail () {
      if (this.validCaseId) {
        this.modal(this.$createElement(lahRegCaseDetailVue, {
          props: { caseId: this.caseId }
        }), {
          title: `登記案件詳情 ${this.$utils.caseId(this.caseId)}`,
          size: 'xl'
        })
      }
    },
    ping () {
      // ping to l3hweb
      this.isBusy = true
      this.connectable = false
      this.$axios.post(this.$consts.API.JSON.IP, {
        type: 'ping',
        ip: this.l3hwebIp,
        port: 1521 // db port
      }).then((res) => {
        if (this.$utils.statusCheck(res.data.status)) {
          this.connectable = true
        } else {
          this.warning(res.data.message, {
            title: '⚠️ 同步異動連線檢測',
            subtitle: this.l3hwebIp
          })
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    },
    insert () {
      this.confirm('確定要將同步異動資料新增於本所資料庫(CRSMS)？').then((YN) => {
        if (YN) {
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.QUERY, {
            type: 'inst_xcase',
            id: this.caseId
          }).then((res) => {
            if (this.$utils.statusCheck(res.data.status)) {
              this.success('新增成功', {
                title: '新增遠端案件資料',
                subtitle: this.caseId
              })
              this.clear()
            } else {
              this.warning(res.data.message, {
                title: '新增遠端案件資料',
                subtitle: this.caseId
              })
            }
          }).catch((err) => {
            this.$utils.error(err)
          }).finally(() => {
            this.isBusy = false
          })
        }
      })
    },
    popup () {
      if (this.dataReady) {
        this.modal(this.$createElement(lahMgmtBoardSyncRegCaseDetailVue, {
          props: {
            caseId: this.caseId,
            items: this.l3hwebData
          },
          on: {
            synced: (e) => {
              this.l3hwebData = this.l3hwebData?.filter((item, idx, arr) => item.COLUMN !== e.detail)
            },
            'all-synced': (e) => {
              this.timeout(() => this.hideModalById('sync-detail-modal'), 1000)
              this.clear()
            }
          }
        }), {
          id: 'sync-detail-modal',
          title: `同步狀態比對詳情 ${this.formattedID}`,
          size: 'lg'
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
