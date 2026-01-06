<template lang="pug">
  div
    lah-header: lah-transition(appear): .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto IP對應表管理
        lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'"): ol
          li 管理靜態IP對應表(供系統識別使用)
          li 查看即時通使用者回報IP紀錄
            ul: li 電腦端需安裝 #[b 桃園即時通] 並正常連線才能正常回報電腦IP
      .d-flex

    b-card-group(deck)
      //- 左側：靜態 IP 對應表
      b-card.fixed-vh
        template(#header): .d-flex.justify-content-between
          h4 靜態IP對應表
          lah-button(icon="plus" variant="outline-primary" title="新增靜態IP對應資料" no-icon-gutter v-b-modal.replace-static-modal pill)
        b-table.b-table-max-height(
          striped
          hover
          responsive
          bordered
          caption-top
          no-border-collapse
          small
          selectable
          sticky-header
          head-variant="dark"
          select-mode="single"
          selected-variant="warning"
          :items="static"
          :fields="staticFields"
        )
          template(#cell(timestamp)="{ item }"): .text-nowrap {{ $utils.phpTsToAdDateStr(item.timestamp, false) }}
          template(#cell(entry_type)="{ item }"): div {{ item.entry_type === 'SERVER' ? '伺服器' : '其他終端' }}
          template(#cell(操作)="{ item }")
            b-button-group
              lah-button.mr-1(icon="edit" variant="outline-primary" no-icon-gutter title="編輯" @click="edit(item)" pill)
              lah-button(icon="times" variant="outline-danger" no-icon-gutter title="移除" @click="remove(item)" pill)

      //- 右側：使用者回報 IP 對應表
      b-card.fixed-vh
        template(#header)
          h4 使用者回報IP對應表
        b-table.b-table-max-height(
          striped
          hover
          responsive
          bordered
          caption-top
          no-border-collapse
          small
          selectable
          sticky-header
          head-variant="dark"
          select-mode="single"
          selected-variant="warning"
          :items="dynamic"
          :fields="dynamicFields"
        )
          template(#cell(序號)="{ index }") {{ index + 1 }}
          template(#cell(timestamp)="{ item }"): .text-nowrap {{ time(item) }}
          template(#cell(entry_desc)="{ item }"): .text-nowrap {{ userNames ? userNames[item.entry_id] : item.entry_desc }}

          //- [修改] IP 欄位：按鈕換成 upload icon
          template(#cell(ip)="{ item }")
            .d-flex.justify-content-between.align-items-center
              span {{ item.ip }}
              lah-button(
                icon="upload"
                variant="outline-secondary"
                size="sm"
                no-icon-gutter
                pill
                title="將此 IP 更新至使用者資料"
                @click="updateUserIp(item)"
              )

    //- Modal 區塊保持不變
    b-modal(
      id="replace-static-modal"
      hide-footer
      scrollable
      no-close-on-backdrop
    )
      template(#modal-title) 編輯靜態IP對應資料
      b-input-group(prepend="ＩＰ位址"): b-input(v-model="staticEntry.ip" :state="isStaticIPv4" placeholder="... 220.1.3X.XX ...")
      b-input-group.my-1(prepend="　　類別"): b-select(v-model="staticEntry.entry_type" :options="[{ value: 'SERVER', text: '伺服器' }, { value: 'OTHER_EP', text: '其他終端' }]" :state="staticTypeCheck")
      b-input-group.my-1(prepend="　　名稱"): b-input(v-model="staticEntry.entry_desc" :state="staticNameCheck")
      b-input-group.my-1(prepend="　　備註"): b-input(v-model="staticEntry.note")
      b-button-group.center: lah-button(icon="save" no-icon-gutter :disabled="staticSaveDisabled" @click="replace") 儲存

    b-modal(
      ref="editModal"
      hide-footer
      scrollable
      no-close-on-backdrop
    )
      template(#modal-title) 編輯靜態IP資訊
      b-input-group(prepend="ＩＰ位址"): b-input(v-model="editEntry.ip" :state="isEditIPv4" placeholder="... 220.1.3X.XX ...")
      b-input-group.my-1(prepend="　　類別"): b-select(v-model="editEntry.entry_type" :options="[{ value: 'SERVER', text: '伺服器' }, { value: 'OTHER_EP', text: '其他終端' }]" :state="editTypeCheck")
      b-input-group.my-1(prepend="　　名稱"): b-input(v-model="editEntry.entry_desc" :state="editNameCheck")
      b-input-group.my-1(prepend="　　備註"): b-input(v-model="editEntry.note")
      b-button-group.center: lah-button(icon="save" no-icon-gutter :disabled="editSaveDisabled" @click="saveEdit") 儲存
</template>

<script>
export default {
  middleware: ['isAdmin'],
  asyncData ({ store, redirect, error }) { return {} },
  data: () => ({
    staticEntry: {
      ip: '',
      entry_type: '',
      entry_desc: '',
      note: ''
    },
    editEntry: {
      orig_ip: '',
      orig_added_type: 'STATIC',
      orig_entry_type: '',
      ip: '',
      entry_type: '',
      entry_desc: '',
      note: ''
    },
    entries: [],
    staticFields: [
      '操作',
      { key: 'ip', label: '設定位址', sortable: true },
      { key: 'entry_type', label: '類型', sortable: true },
      { key: 'entry_desc', label: '設定名稱', sortable: true },
      { key: 'timestamp', label: '更新日期', sortable: true },
      { key: 'note', label: '備註', sortable: true }
    ],
    // [修改] 移除 action 欄位，保留 ip 欄位
    dynamicFields: [
      '序號',
      { key: 'ip', label: '連線位址', sortable: true },
      { key: 'entry_id', label: '登入帳號', sortable: true },
      { key: 'entry_desc', label: '登入名稱', sortable: true },
      { key: 'timestamp', label: '登入日期', sortable: true }
    ]
  }),
  fetchOnServer: false,
  fetch () {
    this.$axios.post(this.$consts.API.JSON.IP, {
      type: 'ip_entries'
    }).then(({ data }) => {
      this.entries = [...data.raw]
    }).catch((err) => {
      this.alert(err)
    }).finally(() => {
    })
  },
  head: {
    title: 'IP對應表管理'
  },
  computed: {
    isStaticIPv4 () { return this.$utils.isIPv4(this.staticEntry.ip) },
    isEditIPv4 () { return this.$utils.isIPv4(this.editEntry.ip) },
    staticTypeCheck () { return ['SERVER', 'OTHER_EP'].includes(this.staticEntry.entry_type) },
    editTypeCheck () { return ['SERVER', 'OTHER_EP'].includes(this.editEntry.entry_type) },
    staticNameCheck () { return !this.$utils.empty(this.staticEntry.entry_desc) },
    editNameCheck () { return !this.$utils.empty(this.editEntry.entry_desc) },
    staticSaveDisabled () { return !this.isStaticIPv4 || !this.staticTypeCheck || !this.staticNameCheck },
    editSaveDisabled () { return !this.isEditIPv4 || !this.editTypeCheck || !this.editNameCheck },
    static () {
      return this.entries.filter((entry, idx, arr) => {
        return entry.added_type === 'STATIC'
      })
    },
    dynamic () {
      return this.entries.filter((entry, idx, arr) => {
        return entry.added_type === 'DYNAMIC'
      })
    }
  },
  watch: {
  },
  created () {
  },
  mounted () { setInterval(this.$fetch, 60 * 1000) },
  methods: {
    replace () {
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.IP, {
        type: 'add_static_ip_entry',
        ...this.staticEntry
      }).then(({ data }) => {
        if (data.status < 1) {
          this.alert(data.message)
        } else {
          this.notify(data.message, { type: 'success' })
          this.staticEntry = {
            ...{
              ip: '',
              entry_type: '',
              entry_desc: '',
              note: ''
            }
          }
          this.$fetch()
          this.$bvModal.hide('replace-static-modal')
        }
      }).catch((error) => {
        console.error(error)
      }).finally(() => {
        this.isBusy = false
      })
    },
    edit (record) {
      this.editEntry = {
        orig_ip: record.ip,
        orig_entry_type: record.entry_type,
        orig_added_type: record.added_type,
        ...record
      }
      this.$refs.editModal?.show()
    },
    saveEdit () {
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.IP, {
        type: 'edit_static_ip_entry',
        ...this.editEntry
      }).then(({ data }) => {
        if (data.status < 1) {
          this.alert(data.message)
        } else {
          this.success(data.message)
          this.editEntry = {
            ...{
              orig_ip: '',
              orig_added_type: 'STATIC',
              orig_entry_type: '',
              ip: '',
              entry_type: '',
              entry_desc: '',
              note: ''
            }
          }
          this.$fetch()
          this.$refs.editModal?.hide()
        }
      }).catch((error) => {
        console.error(error)
      }).finally(() => {
        this.isBusy = false
      })
    },
    remove (record) {
      this.confirm(`確定要刪除 ${record.ip}, ${record.added_type}, ${record.entry_type} 資料?`).then((YN) => {
        if (YN) {
          this.$axios.post(this.$consts.API.JSON.IP, {
            type: 'remove_ip_entry',
            ip: record.ip,
            added_type: record.added_type,
            entry_type: record.entry_type
          }).then(({ data }) => {
            if (this.$utils.statusCheck(data.status)) {
              this.notify(data.message, { type: 'success' })
              this.$fetch()
            } else {
              this.alert(data.message)
            }
          })
        }
      })
    },
    time (item) {
      const full = this.$utils.phpTsToAdDateStr(item.timestamp, true)
      const date = full.split(' ')[0]
      const time = full.split(' ')[1]
      const now = this.$utils.now()
      return now.startsWith(date) ? time : date
    },
    // [更新] 更新使用者 IP 資訊 (upd_ip)
    updateUserIp (item) {
      if (this.isBusy) { return }

      this.confirm(`確定要將使用者 ${item.entry_id} 的 IP 更新為 ${item.ip} 嗎？`).then((ans) => {
        if (ans) {
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.USER, {
            type: 'upd_ip', // 修改為 upd_ip
            id: item.entry_id,
            ip: item.ip
          }).then(({ data }) => {
            if (this.$utils.statusCheck(data.status)) {
              this.notify(data.message, { type: 'success' })
            } else {
              this.warning(data.message)
            }
          }).catch((err) => {
            this.$utils.error(err)
          }).finally(() => {
            this.isBusy = false
          })
        }
      })
    }
  }
}
</script>

<style scoped lang="scss">
.fixed-vh {
  height: calc(100vh - 100px);
  overflow: hidden;
}
.b-table-max-height {
  max-height: calc(100vh - 205px);
}
</style>
