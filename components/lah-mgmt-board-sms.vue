<template lang="pug">
b-card.border-info
  //- 頂部標題與按鈕區
  template(#header)
    .d-flex.justify-content-between.align-items-center
      h6.mb-0.font-weight-bold
        lah-fa-icon(icon="comment-sms" regular) 手動發送簡訊
      b-button-group
        //- 新增歷史紀錄按鈕
        lah-button(icon="clock-rotate-left" variant="outline-info" no-border no-icon-gutter v-b-modal.sms-history-modal title="歷史紀錄")
        lah-button.ml-1(icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.sms-help-modal title="說明")

  //- 彈出式說明視窗
  lah-help-modal(modal-id="sms-help-modal" size="md")
    h5.text-info 簡訊發送說明
    ul
      li 提供管理師手動輸入手機與訊息發送。
      li 預約日期與時間為選填，若留空則為即時發送。
      li 格式需為 09 開頭之 10 碼數字。
      li 系統會自動記錄最近 10 筆成功發送的紀錄。

  //- 歷史紀錄 Modal
  b-modal#sms-history-modal(title="最近 10 筆發送紀錄" hide-footer scrollable)
    b-list-group(v-if="history.length > 0")
      b-list-group-item.flex-column.align-items-start(
        v-for="(item, idx) in history"
        :key="idx"
        button
        @click="restoreHistory(item)"
      )
        .d-flex.w-100.justify-content-between.align-items-center
          strong.text-primary
            lah-fa-icon(icon="mobile-screen-button") {{ item.cell }}
          small.text-muted {{ item.timestamp }}
        .text-truncate.w-100.text-secondary.mt-2.mb-1 {{ item.message }}
        b-badge(v-if="item.rdate || item.rtime" variant="info" pill)
          lah-fa-icon(icon="clock") 預約: {{ item.rdate }} {{ item.rtime }}
    .text-center.text-muted.my-4(v-else)
      lah-fa-icon(icon="inbox" size="2x" class="mb-2")
      p 尚無本機發送紀錄

  //- 手機號碼與傳送按鈕 (水平排列)
  b-form-group(label="手機號碼:" label-for="sms-cell")
    .d-flex.align-items-start
      .flex-grow-1
        b-form-input#sms-cell(
          v-model="cell"
          type="tel"
          :state="cellState"
          placeholder="請輸入10碼手機號碼"
          maxlength="10"
        )
        b-form-invalid-feedback 手機號碼格式錯誤
        b-form-text.text-muted 格式：09xxxxxxxx
      //- 傳送按鈕使用 ml-1 製造緊湊的 Gap
      lah-button.ml-1.text-nowrap(
        icon="paper-plane"
        variant="primary"
        :disabled="!isFormValid || isBusy"
        @click="sendSms"
      )
        span(v-if="!isBusy") 傳送
        b-spinner(v-else small label="傳送中...")

  //- 簡訊內容輸入框
  b-form-group.mb-2(label="簡訊內容:" label-for="sms-message")
    b-form-textarea#sms-message(
      v-model="message"
      :state="messageState"
      rows="3"
      max-rows="6"
      placeholder="請輸入簡訊內容..."
    )

  //- 展開/收合預約設定按鈕
  .d-flex.justify-content-end.mb-2
    b-button(
      size="sm"
      variant="outline-secondary"
      @click="showReserve = !showReserve"
      pill
    )
      lah-fa-icon(icon="clock" :regular="!showReserve") 預約傳送設定

  //- 預約時間區塊 (預設收摺)
  b-collapse#sms-reserve-collapse(v-model="showReserve")
    b-card.bg-light(body-class="p-2")
      b-form-group.mb-0(label="預約日期與時間 (選填):" label-for="sms-reserve" label-size="sm")
        .d-flex
          //- 預約日期
          b-form-input.mr-1(v-model="rdate" type="date" size="sm")
          //- 預約時間 (加入 disabled 判斷與提示)
          b-form-input(
            v-model="rtime"
            type="time"
            size="sm"
            step="1"
            :disabled="!rdate"
            :title="!rdate ? '請先設定預約日期' : ''"
          )
        //- 輔助提示文字
        b-form-text.text-muted(v-if="!rdate") 💡 必須先選擇「預約日期」才能設定時間
</template>

<script>
import _ from 'lodash';

export default {
  name: 'LahMgmtBoardSms',
  data: () => ({
    cell: '',
    message: '',
    rdate: '',
    rtime: '',
    isBusy: false,
    showReserve: false,
    history: [] // 存放本地發送紀錄
  }),
  computed: {
    // 驗證手機格式：09 開頭且總共 10 碼數字
    cellState () {
      if (_.isEmpty(this.cell)) { return null }
      return /^09\d{8}$/.test(this.cell)
    },
    // 驗證簡訊內容不能為空
    messageState () {
      if (_.isEmpty(this.message)) { return null }
      return this.message.length > 0
    },
    // 表單是否完全合法
    isFormValid () {
      const isBasicValid = this.cellState === true && this.messageState === true
      // 雙重防護：如果有時間卻沒有日期，則視為不合法無法傳送
      if (this.rtime && !this.rdate) { return false }
      return isBasicValid
    }
  },
  watch: {
    // 監聽預約日期，若日期被清空，則自動清空預約時間
    rdate (val) {
      if (!val) {
        this.rtime = ''
      }
    }
  },
  mounted () {
    // 元件載入時，從 localStorage 讀取紀錄
    this.loadHistory()
  },
  methods: {
    async sendSms () {
      if (!this.isFormValid) { return }

      this.isBusy = true

      // 1. 處理日期格式 (YYYY-MM-DD -> 民國年 TYYMMDD)
      let formattedDate = ''
      if (this.rdate) {
        const [year, month, day] = this.rdate.split('-')
        const twYear = parseInt(year, 10) - 1911
        formattedDate = `${twYear}${month}${day}`
      }

      // 2. 處理時間格式 (HH:mm:ss -> HHmmss)
      let formattedTime = ''
      if (this.rtime) {
        formattedTime = this.rtime.replace(/:/g, '')
        // 防呆：若瀏覽器時間元件沒送出秒數 (長度為 4)，則自動補齊 '00' 變成 6 碼
        if (formattedTime.length === 4) {
          formattedTime += '00'
        }
      }

      // 3. 使用 Object 來建構 POST 參數
      const payload = {
        type: 'moicas_ma05_sms',
        cell: this.cell,
        message: this.message,
        rdate: formattedDate,
        rtime: formattedTime
      }

      try {
        const { data } = await this.$axios.post(this.$consts.API.JSON.MOISMS, payload)

        // 根據 PHP 的回應，狀態碼與訊息會包裝在 JSON 內
        const isSuccess = data.status === 1 || data.message?.includes('完成')

        if (isSuccess) {
          this.$bvToast.toast('簡訊已排入傳送佇列', {
            title: '發送成功',
            variant: 'success',
            solid: true,
            autoHideDelay: 5000
          })

          // 儲存至本地歷史紀錄 (此處保存尚未被轉換過的 this.rdate/rtime，供 UI 顯示使用)
          this.saveHistory()

          // 成功後清空表單
          this.cell = ''
          this.message = ''
          this.rdate = ''
          this.rtime = ''
          this.showReserve = false
        } else {
          this.$bvToast.toast(data?.message || '傳送失敗，請稍後再試', {
            title: '發送失敗',
            variant: 'warning',
            solid: true,
            autoHideDelay: 8000
          })
        }
      } catch (err) {
        this.$bvToast.toast(err.message || '發生未知錯誤', {
          title: '系統錯誤',
          variant: 'danger',
          solid: true,
          autoHideDelay: 8000
        })
      } finally {
        this.isBusy = false
      }
    },
    loadHistory () {
      try {
        const saved = localStorage.getItem('lah-sms-history')
        if (saved) {
          this.history = JSON.parse(saved)
        }
      } catch (e) {
        console.error('無法解析簡訊紀錄', e)
        this.history = []
      }
    },
    saveHistory () {
      const record = {
        cell: this.cell,
        message: this.message,
        rdate: this.rdate,
        rtime: this.rtime,
        // 紀錄當下發送時間
        timestamp: new Date().toLocaleString('zh-TW', { hour12: false })
      }

      // 將新紀錄推至最前方
      this.history.unshift(record)

      // 限制最多保留 10 筆
      if (this.history.length > 10) {
        this.history = this.history.slice(0, 10)
      }

      try {
        localStorage.setItem('lah-sms-history', JSON.stringify(this.history))
      } catch (e) {
        console.error('無法儲存簡訊紀錄', e)
      }
    },
    restoreHistory (item) {
      this.cell = item.cell
      this.message = item.message
      this.rdate = item.rdate || ''

      // 若沒有日期，即使有時間紀錄我們也不帶入，確保邏輯正確
      if (this.rdate) {
        this.rtime = item.rtime || ''
      } else {
        this.rtime = ''
      }

      // 關閉 Modal
      this.$bvModal.hide('sms-history-modal')

      // 若有預約日期或時間，則自動展開預約設定區塊
      this.showReserve = Boolean(this.rdate || this.rtime)
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
