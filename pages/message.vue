<template lang="pug">
  div
    lah-header: lah-transition(appear): .d-flex.justify-content-between.w-100
      .d-flex
        font-awesome-icon.my-auto.mx-1(:icon="['far', 'comments']" size="lg")
        .my-auto 傳送個人通知訊息
        lah-button(icon="question" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'"): ol
          li 接收端電腦需安裝 #[b.text-primary 信差即時通程式] 並正常連線才能接收
          li 僅可送訊息給 #[b.text-danger 一周內] 有使用 #[b.text-primary 信差即時通程式] 的使用者
          li 歷史資料儲存於瀏覽器端，清除瀏覽器快取即可清空
            ul: li 最少顯示 #[b.text-info 3] 筆，最多顯示 #[b.text-info 10] 筆  ({{ memento.length }} / {{ mementoCapacity }})
          li 內容支援 Markdown 語法，請參考 #[a(href="https://bit.ly/mdcheat" target="_blank" rel="noopener noreferrer") #[b https://bit.ly/mdcheat]] 教學
      .d-flex

    b-card-group(deck)

      b-card(ref="addCard" border-variant="dark")
        template(#header): .d-flex.justify-content-between
          h4.my-auto 傳送訊息
          b-button-group
            lah-button(icon="paper-plane" :variant="sendButtonDisabled ? 'outline-primary' : 'primary'" :disabled="sendButtonDisabled" @click="add" pill) 送出
            lah-button.mx-1(icon="undo-alt" variant="outline-secondary"  @click="reset" action="cycle-alt" pill) 清除
            lah-button(icon="question" variant="outline-success" v-b-toggle.md-desc :pressed="helpSidebarFlag" pill) 內容語法說明

        b-textarea.mb-3(
          v-model="dataJson.content"
          rows="5"
          max-rows="15"
          placeholder="... 支援 Markdown 語法 ... "
          :state="validContent"
        )
        .d-flex
          h5.my-auto.mr-1: lah-fa-icon(icon="hand-point-right" regular) 可選擇的傳送對象
          b-button.my-auto.mr-1.mb-1(
            v-for="(entry, idx) in sendtoEntries"
            v-if="!sendto.includes(entry.id)"
            v-b-tooltip="`點擊新增 ${userNames[entry.id] || entry.name}`"
            :key="`badge-${idx}`"
            variant="outline-secondary"
            size="sm"
            pill
            @click="addSendto(entry.id)"
          ) {{ entry.id }} / {{ userNames[entry.id] || entry.name }}

      lah-transition(appear): b-card(border-variant="success")
        template(#header): h4.my-auto.text-nowrap.mr-2 預覽
        .d-flex
          h5.my-auto.mr-1: lah-fa-icon(icon="hand-point-right" regular) 已選擇的傳送對象
          b-button.my-auto.mr-1.mb-1(
            v-for="(id, idx) in sendto"
            v-b-tooltip="`點擊移除 ${userNames[id] || id}`"
            variant="outline-primary"
            size="sm"
            :key="`snedto-${idx}`"
            @click="removeSendto(id)"
            pill
          ) {{ id }} / {{ userNames[id] || id }}
        .center.mt-3: lah-notification-message(:data-json="dataJson")

    h4.d-flex.justify-content-between.my-3
      lah-fa-icon(icon="clipboard-list") 歷史資料
      b-input-group.memento-count-input(prepend="顯示" append="筆"): b-input.h-100(type="number" min="3" max="10" v-model="mementoCount")
    hr
    .d-flex
      div.w-100: transition-group(name="list" mode="out-in")
        b-card.hist-card(no-body v-for="(snapshot, idx) in firstColumnMemento" :key="`hist_first_${idx}`")
          .d-flex.mb-1.mx-auto
            lah-button.mr-1(icon="copy" variant="outline-secondary" @click="copy(snapshot)" title="複製本篇內容到新增欄位") 複製
            lah-button(icon="times" variant="outline-danger" @click="remove(snapshot)" title="刪除本篇內容") 移除
          lah-notification-message.mx-auto(
            :data-json="{ id: '#', ...snapshot }"
          )
      div.w-100: transition-group(name="list" mode="out-in")
        b-card.hist-card.mb-2(no-body v-for="(snapshot, idx) in secondColumnMemento" :key="`hist_second_${idx}`")
          .d-flex.mb-1.mx-auto
            lah-button.mr-1(icon="copy" variant="outline-secondary" @click="copy(snapshot)" title="複製本篇內容到新增欄位") 複製
            lah-button(icon="times" variant="outline-danger" @click="remove(snapshot)" title="刪除本篇內容") 移除
          lah-notification-message.mx-auto(
            :data-json="{ id: '#', ...snapshot }"
          )
      div.w-100: transition-group(name="list" mode="out-in")
        b-card.hist-card.mb-2(no-body v-for="(snapshot, idx) in thirdColumnMemento" :key="`hist_third_${idx}`")
          .d-flex.mb-1.mx-auto
            lah-button.mr-1(icon="copy" variant="outline-secondary" @click="copy(snapshot)" title="複製本篇內容到新增欄位") 複製
            lah-button(icon="times" variant="outline-danger" @click="remove(snapshot)" title="刪除本篇內容") 移除
          lah-notification-message.mx-auto(
            :data-json="{ id: '#', ...snapshot }"
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
    sendto: [],
    sendtoEntries: [],
    memento: [],
    mementoCapacity: 10,
    mementoCount: 3,
    cacheKey: 'message_postMementoCache'
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
            this.sendtoEntries.push({
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
    title: '傳送個人訊息'
  },
  computed: {
    validContent () { return !this.$utils.empty(this.dataJson.content) },
    validSento () { return this.sendto.length > 0 },
    sendButtonDisabled () { return !this.validContent || !this.validSento },
    mementoCountCacheKey () {
      return `${this.cacheKey}_count`
    },
    reverseMemento () {
      return this.memento.slice().reverse().slice(0, this.mementoCount)
    },
    firstColumnMemento () {
      return this.reverseMemento.filter((snap, idx) => {
        return idx % 3 === 0
      })
    },
    secondColumnMemento () {
      return this.reverseMemento.filter((snap, idx) => {
        return idx % 3 === 1
      })
    },
    thirdColumnMemento () {
      return this.reverseMemento.filter((snap, idx) => {
        return idx % 3 === 2
      })
    }
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
    addSendto (id) {
      this.sendto.push(id)
    },
    removeSendto (id) {
      const index = this.sendto.indexOf(id)
      if (index > -1) {
        this.sendto.splice(index, 1)
      }
    },
    copy (snapshot) {
      this.sendto = [...snapshot.channels]
      this.dataJson = { ...this.dataJson, ...snapshot }
      // remove additional property
      delete this.dataJson.channels
      this.$refs.addCard.scrollIntoView()
      setTimeout(() => this.attention(this.$refs.addCard), 400)
    },
    remove (snapshot) {
      for (let i = 0; i < this.memento.length; i++) {
        if (this.$utils.equal(this.memento[i], snapshot)) {
          this.memento.splice(i, 1)
          this.setCache(this.cacheKey, this.memento)
          return
        }
      }
    },
    add () {
      this.confirm('確定要發送訊息?').then((flag) => {
        if (flag) {
          this.isBusy = true
          const snapshot = {
            channels: this.sendto,
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
      this.sendto = []
    }
  }
}
</script>

<style>
.memento-count-input {
  max-width: 160px;
}
.hist-card {
  margin-bottom: 1rem;
  border: 0;
  padding: 5px;
}
.hist-card:hover {
  border-color:gray;
  border-style: dotted;
  border-width: 5px;
}
</style>
