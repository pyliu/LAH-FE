<template lang="pug">
  div
    lah-header: lah-transition(appear): .d-flex.justify-content-between.w-100
      .d-flex
        font-awesome-icon.my-auto.mx-1(:icon="['far', 'comments']" size="lg")
        .my-auto 傳送所內信差訊息
        lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'"): ol
          li 接收端電腦需安裝 #[b.text-primary 信差即時通程式] 並正常連線才能接收
          li 僅可送訊息給 #[b.text-danger 一個月內] 有使用 #[b.text-primary 信差即時通程式] 的使用者
          li 歷史資料儲存於瀏覽器端，最少顯示 #[b.text-info 3] 筆，最多顯示 #[b.text-info 10] 筆  ({{ memento.length }} / {{ mementoCapacity }})
          li 內容支援 Markdown 語法，請參考 #[a(href="https://bit.ly/mdcheat" target="_blank" rel="noopener noreferrer") #[b https://bit.ly/mdcheat]] 教學
      .d-flex

    b-card-group(deck)

      b-card(ref="addCard" border-variant="dark")
        template(#header): .d-flex.justify-content-between
          h4.my-auto 傳送訊息
          b-button-group
            lah-button.mx-1(icon="users" variant="outline-primary"  v-b-modal.sendtoModal pill title="顯示選擇視窗") 選擇傳送對象
            lah-button.mx-1(icon="caret-right" variant="outline-primary"  @click="allCandidatesToChoosed" action="slide-ltr" pill title="'傳送給所有活躍使用者'" :disabled="candidatesEntries.length === 0") 全選
            lah-button.mx-1(icon="undo-alt" variant="outline-secondary"  @click="reset" action="cycle-alt" pill title="'清除內文及已選擇對象'") 清除
            lah-button(icon="question" variant="outline-success" v-b-toggle.md-desc :pressed="helpSidebarFlag" pill no-icon-gutter title="'內容 Markdown 語法簡易說明'")

          b-modal(
            id="sendtoModal"
            size=""
            scrollable
            hide-footer
            no-close-on-backdrop
          )
            template(#modal-title) 選擇傳送對象
            .d-flex.justify-content-around
              h6 可選擇
              h6 已選擇
            .d-flex
              b-select.users-select-height(v-model="candidates" :options="candidatesOpts" multiple)
              .users-control-bar.users-select-height
                lah-button(block no-icon-gutter icon="angle-right" action="move-fade-ltr" @click="candidatesToChoosed")
                lah-button(block no-icon-gutter icon="angle-left" action="move-fade-rtl" @click="choosedToCandidates")
                lah-button(block no-icon-gutter icon="angle-double-right" action="move-fade-ltr" @click="allCandidatesToChoosed")
                lah-button(block no-icon-gutter icon="angle-double-left" action="move-fade-rtl" @click="allChoosedToCandidates")
              b-select.users-select-height(v-model="choosed" :options="choosedOpts" multiple)

        b-textarea.mb-3(
          v-model="dataJson.content"
          rows="5"
          max-rows="15"
          placeholder="... 支援 Markdown 語法 ... "
          :state="validContent"
        )

      lah-transition(appear): b-card(border-variant="success")
        template(#header): .d-flex.justify-content-between
          h4.my-auto.text-nowrap.mr-2 預覽
          .d-flex
            lah-fa-icon.my-auto(v-b-toggle.choosed-tags icon="caret-right" title="切換狗牌顯示") 已設定 #[b-badge(:variant="candidatesEntries.length === 0 ? 'danger' : 'info'" pill) {{ choosedSendtoCount }}] 人
            lah-button.ml-1(
              icon="paper-plane"
              action="slide-btt"
              :variant="sendButtonDisabled ? 'outline-primary' : 'primary'"
              :disabled="sendButtonDisabled"
              @click="add"
              pill
            ) 確定發送

        b-collapse(id="choosed-tags"): .d-flex
          b-button.my-auto.m-1(
            v-for="(id, idx) in choosedSendto"
            v-b-tooltip="`移除 ${id}`"
            variant="outline-success"
            size="sm"
            :key="`snedto-${idx}`"
            @click="removeSendto(id)"
            pill
          )
            lah-avatar(:id="id" ignore-system-config)
            span.my-auto.ml-1 {{ userNames[id] || id }}
        .center.mt-3: lah-notification-message(:data-json="dataJson")

    h4.d-flex.justify-content-between.my-3
      lah-fa-icon(icon="clipboard-list") 歷史資料
      b-input-group.memento-count-input(prepend="顯示" append="筆"): b-input.h-100(type="number" min="3" max="10" v-model="mementoCount")

    hr

    b-card-group(columns): transition-group(name="list" mode="out-in")
      lah-notification-messsage-memento(
        v-for="(snapshot, idx) in memento" :key="`hist_${idx}`"
        :memento="snapshot"
        @copy="copy(snapshot)"
        @remove="remove(snapshot)"
      )

    b-sidebar(
      id="md-desc"
      v-model="helpSidebarFlag"
      title="簡易排版語法說明"
      right
      shadow
    )
      b-card
        | #[b 標題]#[br]
        | 語法(共支援五層標題)：#[br]
        | #[b.text-primary # 第一標題]#[br]
        | #[b.text-primary ## 第二標題]
        | #[hr]
        | #[b 引言]#[br]
        | 語法：#[i #[b.text-primary > 「我思，故我在。」]]
        | #[hr]
        | #[b 分隔線]#[br]
        | 語法： #[b.text-primary ---]
        | #[hr]
        | #[b 超連結]#[br]
        | 語法：#[br]
        | <b class="text-primary">[知識網](http://220.1.34.18:8888/)</b>
        | #[hr]
        | #[b 編號項目符號]#[br]
        | 語法：#[br]
        | #[b.text-primary -] 康德#[br]
        | #[b.text-primary 1.] 笛卡爾#[br]
        | #[b.text-primary 2.] 蘇格拉底#[br]
        | 可使用「 * 」 取代這裡的「 - 」，或是使用數字加上「 . 」
        | #[hr]
        | #[b 斜體與粗體]#[br]
        | 粗體語法： #[b.text-primary **我是粗體**]#[br]
        | 斜體語法： #[b.text-primary *我是斜體*]#[br]
        | #[hr]
        | 其他詳細 Markdown 語法，請參考 https://bit.ly/mdcheat 教學
</template>

<script>
export default {
  data: () => ({
    dataJson: {
      title: '',
      content: '',
      priority: 3,
      sender: '',
      id: '?',
      create_datetime: ''
    },
    helpSidebarFlag: false,
    sendtoEntries: [],
    memento: [],
    mementoCapacity: 10,
    mementoCount: 3,
    cacheKey: 'message_postMementoCache',
    candidates: [],
    candidatesEntries: [],
    choosed: [],
    choosedEntries: []
  }),
  fetchOnServer: false,
  fetch () {
    this.$axios.post(this.$consts.API.JSON.IP, {
      type: 'dynamic_ip_entries',
      offset: 2629743
    }).then(({ data }) => {
      if (this.$utils.statusCheck(data.status)) {
        data.raw.sort((a, b) => {
          if (a.timestamp < b.timestamp) { return 1 }
          if (a.timestamp > b.timestamp) { return -1 }
          return 0
        }).forEach((entry) => {
          if (!this.sendtoEntries.find((item) => {
            return item.id === entry.entry_id
          })) {
            this.sendtoEntries.push({
              ip: entry.ip,
              id: entry.entry_id,
              name: entry.entry_desc
            })
          }

          if (!this.candidatesEntries.find((item) => {
            return item.id === entry.entry_id
          })) {
            this.candidatesEntries.push({
              ip: entry.ip,
              id: entry.entry_id,
              name: entry.entry_desc
            })
          }
        })
      } else {
        this.$utils.warn(data.message)
      }
    }).catch((err) => {
      this.$utils.error(err)
    })
  },
  head: {
    title: '傳送個人信差訊息'
  },
  computed: {
    candidatesOpts () {
      return [...this.candidatesEntries].sort((a, b) => {
        if (a.id > b.id) { return 1 }
        if (a.id < b.id) { return -1 }
        return 0
      }).map((entry) => {
        return { value: entry, text: `${entry.id} ${this.userNames[entry.id] || entry.name}` }
      })
    },
    choosedOpts () {
      return [...this.choosedEntries].sort((a, b) => {
        if (a.id > b.id) { return 1 }
        if (a.id < b.id) { return -1 }
        return 0
      }).map((entry) => {
        return { value: entry, text: `${entry.id} ${this.userNames[entry.id] || entry.name}` }
      })
    },
    selectableEntries () { return this.candidatesEntries.concat(this.choosedEntries) },
    choosedSendto () { return this.choosedEntries.map(entry => entry.id) },
    choosedSendtoCount () { return this.choosedSendto.length },
    validSento () { return this.choosedSendtoCount > 0 },
    validContent () { return !this.$utils.empty(this.dataJson.content) },
    sendButtonDisabled () { return !this.validContent || !this.validSento },
    mementoCountCacheKey () { return `${this.cacheKey}_count` }
  },
  watch: {
    mementoCount (val) {
      this.setCache(this.mementoCountCacheKey, val)
      this.restoreCachedMemento()
    }
  },
  created () {
    this.dataJson.create_datetime = this.$utils.now()
    this.restoreCachedMemento()
  },
  methods: {
    /**
     * users selection modal used
     */
    allCandidatesToChoosed () {
      this.choosed = []
      this.candidates = []
      this.choosedEntries = [...this.choosedEntries, ...this.candidatesEntries]
      this.candidatesEntries = []
    },
    allChoosedToCandidates () {
      this.choosed = []
      this.candidates = []
      this.candidatesEntries = [...this.candidatesEntries, ...this.choosedEntries]
      this.choosedEntries = []
    },
    candidatesToChoosed () {
      this.candidatesEntries.forEach((entry) => {
        if (this.candidates.includes(entry)) {
          this.choosedEntries.push(entry)
        }
      })
      // clear candidates
      this.candidates.forEach((oentry, idx) => {
        let foundIdx = -1
        const found = this.candidatesEntries.find((ientry, idx) => {
          if (this.$utils.equal(oentry, ientry)) {
            foundIdx = idx
            return true
          }
          return false
        })
        if (found) {
          this.candidatesEntries.splice(foundIdx, 1)
        }
      })
      this.candidates = []
    },
    choosedToCandidates () {
      this.choosedEntries.forEach((entry) => {
        if (this.choosed.includes(entry)) {
          this.candidatesEntries.push(entry)
        }
      })
      // clear candidates
      this.choosed.forEach((oentry, idx) => {
        let foundIdx = -1
        const found = this.choosedEntries.find((ientry, idx) => {
          if (this.$utils.equal(oentry, ientry)) {
            foundIdx = idx
            return true
          }
          return false
        })
        if (found) {
          this.choosedEntries.splice(foundIdx, 1)
        }
      })
      this.choosed = []
    },
    async restoreCachedMemento () {
      const cached = await this.getCache(this.cacheKey)
      cached && (this.memento = [...cached])
      if (this.memento.length > this.mementoCount) {
        this.memento.splice(0, this.memento.length - this.mementoCount)
      }
    },
    addMemento (snapshot) {
      this.memento.push(snapshot)
      if (this.memento.length > this.mementoCapacity) {
        this.memento.splice(0, 1)
      }
      this.setCache(this.cacheKey, this.memento)
    },
    removeSendto (id) {
      const found = this.choosedEntries.find(entry => entry.id === id)
      found && this.choosed.push(found)
      this.choosedToCandidates()
    },
    copy (snapshot) {
      // all choosed back to candidates
      this.allChoosedToCandidates()
      snapshot.channels.forEach((id) => {
        const found = this.candidatesEntries.find(entry => entry.id === id)
        found && this.candidates.push(found)
      })
      this.candidatesToChoosed()

      this.dataJson = { ...this.dataJson, ...snapshot }
      // remove additional property
      delete this.dataJson.channels
      this.$refs.addCard.scrollIntoView()
      setTimeout(() => this.attention(this.$refs.addCard), 400)
    },
    remove (snapshot) {
      // request to remove content from all added channels
      if (Array.isArray(snapshot.added_to)) {
        const channelData = snapshot.added_to.map(added => ({
          channel: added.channel,
          id: added.addedId
        }))
        this.requestDBRemove(channelData, () => this.removeMemento(snapshot))
      } else {
        this.$utils.warn('這個 snapshot 裡沒有 added_to 屬性資料。', snapshot)
        this.removeMemento(snapshot)
      }
    },
    removeMemento (snapshot) {
      for (let i = 0; i < this.memento.length; i++) {
        if (this.$utils.equal(this.memento[i], snapshot)) {
          // restore removing data to edit field
          this.copy(this.memento[i])
          this.memento.splice(i, 1)
          this.setCache(this.cacheKey, this.memento)
          break
        }
      }
    },
    requestDBRemove (array, cb = undefined) {
      if (Array.isArray(array)) {
        this.isBusy = true
        this.$axios.post(this.$consts.API.JSON.NOTIFICATION, {
          type: 'remove_notification',
          message_type: 'message',
          channels: array
        }).then(({ data }) => {
          this.notify(data.message, { type: data.status > 0 ? 'success' : 'warning' })
          data.status > 0 && cb && cb()
        }).catch((err) => {
          this.alert(err.message)
          this.$utils.error(err)
        }).finally(() => {
          this.isBusy = false
        })
      } else {
        this.alert('欲刪除之頻道資訊不是陣列')
        this.$utils.warn(array)
      }
    },
    add () {
      this.confirm('確定要發送訊息?').then((flag) => {
        if (flag) {
          this.isBusy = true
          const snapshot = {
            channels: this.choosedSendto,
            from_ip: this.ip,
            title: this.dataJson.title,
            content: this.dataJson.content,
            priority: this.dataJson.priority,
            sender: this.myid || this.ip,
            create_datetime: this.$utils.now()
          }
          this.$axios.post(this.$consts.API.JSON.NOTIFICATION, {
            type: 'add_notification',
            ...snapshot
          }).then(({ data }) => {
            this.notify(data.message, { type: data.status > 0 ? 'success' : 'warning' })
            if (data.status > 0) {
              snapshot.added_to = data.added
            }
          }).catch((err) => {
            this.alert(err.message)
            this.$utils.error(err)
          }).finally(() => {
            this.isBusy = false
            this.addMemento(snapshot)
            this.reset()
          })
        }
      })
    },
    reset () {
      this.dataJson = {
        ...{
          title: '',
          content: '',
          priority: 3,
          sender: '',
          id: '?',
          create_datetime: this.$utils.now()
        }
      }
      this.allChoosedToCandidates()
    }
  }
}
</script>

<style>
.memento-count-input {
  max-width: 160px;
}
.users-select-height {
  height: calc(100vh - 187px) !important;
  overflow: auto;
}
.users-control-bar {
  width: 64px;
  margin: 0 5px;
  padding: calc((100vh - 400px) / 2) 0;
  overflow: hidden;
}
</style>
