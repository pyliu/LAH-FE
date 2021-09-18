<template lang="pug">
  div
    lah-header: lah-transition(appear): .d-flex.justify-content-between.w-100
      .d-flex
        font-awesome-icon.my-auto.mx-1(:icon="['far', 'comments']" size="lg")
        .my-auto 傳送信差訊息
        lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'"): ol
          li 接收端電腦需安裝 #[b.text-primary 信差即時通程式] 並正常連線才能接收
          li 僅可送訊息給 #[b.text-danger 一周內] 有使用 #[b.text-primary 信差即時通程式] 的使用者
          li 歷史資料儲存於瀏覽器端，最少顯示 #[b.text-info 3] 筆，最多顯示 #[b.text-info 30] 筆  ({{ memento.length }} / {{ mementoCapacity }})
          li 內容支援 Markdown 語法，請參考 #[a(href="https://bit.ly/mdcheat" target="_blank" rel="noopener noreferrer") #[b https://bit.ly/mdcheat]] 教學
      .d-flex

    b-card-group(deck)

      b-card(ref="addCard" border-variant="dark")
        template(#header): .d-flex.justify-content-between
          h4.my-auto 傳送訊息
          b-button-group(size="sm")
            lah-button(icon="users" v-b-modal.sendtoModal title="顯示選擇視窗" pill) 選擇
            lah-button.mx-1(icon="caret-left" variant="warning"  @click="reset" action="slide-rtl" pill title="已選擇對象") 清空
            lah-button(icon="question" variant="outline-success" v-b-toggle.md-desc :pressed="helpSidebarFlag" title="內容 Markdown 語法簡易說明" action="bounce" pill) 說明

          b-modal(
            id="sendtoModal"
            size=""
            scrollable
            hide-footer
          )
            template(#modal-title) 選擇傳送對象 (一周內活躍的同仁)
            .d-flex.justify-content-around
              b 可選擇
              b 已選擇
            .d-flex.align-items-stretch.modal-height
              b-select.overflow-auto(v-model="candidates" :options="candidatesOpts" multiple @change="$utils.log($event)")
              .modal-ctl-bar.align-self-center
                lah-button(block no-icon-gutter icon="angle-right" action="move-fade-ltr" @click="candidatesToChoosed" title="加入" :disabled="candidatesEntries.length === 0")
                lah-button(block no-icon-gutter icon="angle-double-right" action="move-fade-ltr" @click="allCandidatesToChoosed" title="全部加入" :disabled="candidatesEntries.length === 0")
                lah-button(block no-icon-gutter icon="angle-left" action="move-fade-rtl" @click="choosedToCandidates" title="移除" :disabled="choosedEntries.length === 0")
                lah-button(block no-icon-gutter icon="angle-double-left" action="move-fade-rtl" @click="allChoosedToCandidates" title="全部移除" :disabled="choosedEntries.length === 0")
              b-select.overflow-auto(v-model="choosed" :options="choosedOpts" multiple @change="$utils.log($event)")

        b-textarea(
          v-model="dataJson.content"
          rows="5"
          max-rows="100"
          placeholder="... 支援 Markdown 語法 ... "
          style="overflow: hidden"
          :state="validContent"
        )
        .d-flex.flex-wrap.my-1.align-items-center
          h6.m-1 快速選擇
          lah-button.m-1(pill icon="caret-right" variant="outline-dark" @click="allCandidatesToChoosed" action="slide-ltr" title="傳送給所有活躍使用者") 全選 #[b-badge(pill variant="danger") {{ allCandidates.length }}]
          lah-button.m-1(pill icon="caret-right" variant="outline-dark" @click="regToChoosed" action="slide-ltr" title="傳送給登記課") 登記課 #[b-badge(pill :variant="myDepartment === '登記課' ? 'success' : 'light'") {{ regCandidates.length }}]
          lah-button.m-1(pill icon="caret-right" variant="outline-dark" @click="surToChoosed" action="slide-ltr" title="傳送給測量課") 測量課 #[b-badge(pill :variant="myDepartment === '測量課' ? 'success' : 'light'") {{ surCandidates.length }}]
          lah-button.m-1(pill icon="caret-right" variant="outline-dark" @click="valToChoosed" action="slide-ltr" title="傳送給地價課") 地價課 #[b-badge(pill :variant="myDepartment === '地價課' ? 'success' : 'light'") {{ valCandidates.length }}]
          lah-button.m-1(pill icon="caret-right" variant="outline-dark" @click="admToChoosed" action="slide-ltr" title="傳送給行政課") 行政課 #[b-badge(pill :variant="myDepartment === '行政課' ? 'success' : 'light'") {{ admCandidates.length }}]
          lah-button.m-1(pill icon="caret-right" variant="outline-dark" @click="infToChoosed" action="slide-ltr" title="傳送給資訊課") 資訊課 #[b-badge(pill :variant="myDepartment === '資訊課' ? 'success' : 'light'") {{ infCandidates.length }}]
          lah-button.m-1(pill icon="caret-right" variant="outline-dark" @click="hrToChoosed" action="slide-ltr" title="傳送給人事室") 人事室 #[b-badge(pill :variant="myDepartment === '人事室' ? 'success' : 'light'") {{ hrCandidates.length }}]
          lah-button.m-1(pill icon="caret-right" variant="outline-dark" @click="accToChoosed" action="slide-ltr" title="傳送給會計室") 會計室 #[b-badge(pill :variant="myDepartment === '會計室' ? 'success' : 'light'") {{ accCandidates.length }}]
          lah-button.m-1(pill icon="caret-right" variant="outline-dark" @click="supervisorToChoosed" action="slide-ltr" title="傳送給主任祕書室") 主任秘書室 #[b-badge(pill :variant="myDepartment === '主任秘書室' ? 'success' : 'light'") {{ supervisorCandidates.length }}]

      lah-transition(appear): b-card(border-variant="success")
        template(#header): .d-flex.align-items-center
          h4.my-auto.text-nowrap.mr-auto 預覽
          .d-flex.align-items-center(
            ref="nameTag"
            @click="sendtoVisibleFlag = !sendtoVisibleFlag"
          )
            lah-fa-icon(
              :icon="sendtoDisplayIndicator"
              regular
              title="切換名牌顯示"
            )
            .d-flex.align-items-center
              span 已選擇傳送給
              b-badge.mx-1(:variant="candidatesEntries.length === 0 ? 'danger' : 'info'" pill) {{ choosedSendtoCount }}
              span 人
          lah-button.ml-1(
            icon="paper-plane"
            action="slide-btt"
            :variant="sendButtonDisabled ? 'outline-primary' : 'primary'"
            :disabled="sendButtonDisabled"
            @click="add"
            pill
          ) 發送

        b-collapse(v-model="sendtoVisibleFlag"): .d-flex.flex-wrap.align-items-center
          .text-nowrap 將傳送給：
          transition-group(name="list" mode="out-in"): b-button.m-1.text-nowrap(
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
        .center: lah-notification-message(:data-json="dataJson")

    h4.d-flex.align-items-stretch.my-3
      lah-fa-icon.my-auto.mr-auto(icon="clipboard-list") 歷史資料
      b-input-group.memento-count-input(prepend="顯示" append="筆"): b-input(type="number" min="3" max="10" v-model="mementoCount")

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
    mementoCapacity: 30,
    mementoCount: 3,
    cacheKey: 'message_postMementoCache',
    candidates: [],
    candidatesEntries: [],
    choosed: [],
    choosedEntries: [],
    sendtoVisibleFlag: false
  }),
  fetchOnServer: false,
  fetch () {
    this.$axios.post(this.$consts.API.JSON.IP, {
      type: 'dynamic_ip_entries',
      offset: 604800
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
            this.sendtoEntries.push(this.packEntryData(entry))
          }

          if (!this.candidatesEntries.find((item) => {
            return item.id === entry.entry_id
          })) {
            this.candidatesEntries.push(this.packEntryData(entry))
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
    myDepartment () { return this.myinfo.unit },
    allCandidates () { return [...this.candidatesEntries, ...this.choosedEntries] },
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
    mementoCountCacheKey () { return `${this.cacheKey}_count` },
    sendtoDisplayIndicator () { return this.sendtoVisibleFlag ? 'hand-point-down' : 'hand-point-right' },
    infCandidates () { return this.allCandidates.filter(entry => entry.dept === 'inf') },
    admCandidates () { return this.allCandidates.filter(entry => entry.dept === 'adm') },
    regCandidates () { return this.allCandidates.filter(entry => entry.dept === 'reg') },
    surCandidates () { return this.allCandidates.filter(entry => entry.dept === 'sur') },
    valCandidates () { return this.allCandidates.filter(entry => entry.dept === 'val') },
    hrCandidates () { return this.allCandidates.filter(entry => entry.dept === 'hr') },
    accCandidates () { return this.allCandidates.filter(entry => entry.dept === 'acc') },
    supervisorCandidates () { return this.allCandidates.filter(entry => entry.dept === 'supervisor') }
  },
  watch: {
    mementoCount (val) {
      this.setCache(this.mementoCountCacheKey, val)
      this.restoreCachedMemento()
    }
  },
  async created () {
    this.dataJson.create_datetime = this.$utils.now()
    this.mementoCount = await this.getCache(this.mementoCountCacheKey) || 3
    this.restoreCachedMemento()
    this.$utils.log(this.myinfo)
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
      this.attention(this.$refs.nameTag)
      this.sendtoVisibleFlag = true
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
    /**
     * Quick selection by Department
     */
    deptToChoosed (dept) {
      // all back to candidates pool
      this.allChoosedToCandidates()
      // search for user belongs to dept
      this.candidates = [...this.candidatesEntries.filter(entry => entry.dept === dept)]
      this.candidatesToChoosed()
      this.attention(this.$refs.nameTag)
      this.sendtoVisibleFlag = true
    },
    infToChoosed () { this.deptToChoosed('inf') },
    valToChoosed () { this.deptToChoosed('val') },
    regToChoosed () { this.deptToChoosed('reg') },
    surToChoosed () { this.deptToChoosed('sur') },
    admToChoosed () { this.deptToChoosed('adm') },
    accToChoosed () { this.deptToChoosed('acc') },
    hrToChoosed () { this.deptToChoosed('hr') },
    supervisorToChoosed () { this.deptToChoosed('supervisor') },
    /**
     * Memento
     */
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
      // this.dataJson = {
      //   ...{
      //     title: '',
      //     content: '',
      //     priority: 3,
      //     sender: '',
      //     id: '?',
      //     create_datetime: this.$utils.now()
      //   }
      // }
      this.allChoosedToCandidates()
    },
    packEntryData (entry) {
      return {
        ip: entry.ip,
        id: entry.entry_id,
        name: entry.entry_desc,
        dept: entry.note.split(' ')[1]
      }
    }
  }
}
</script>

<style>
.memento-count-input {
  max-width: 160px;
}
.modal-ctl-bar {
  width: 64px;
  margin: 0 5px;
  overflow: hidden;
}
.modal-height {
  height: 70vh;
}
</style>
