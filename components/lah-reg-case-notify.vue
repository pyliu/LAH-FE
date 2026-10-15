<template lang="pug">
.lah-reg-case-notify.d-flex.align-items-center.flex-nowrap.text-nowrap.p-1(:title="parentData.ID")
  b-form-checkbox.mr-2.my-auto(
    v-model="notifyFlag",
    switch,
    size="sm",
    :title="notifyFlag ? '目前設定：需要辦畢通知' : '目前設定：不需通知'"
  )
    span.small.font-weight-bold(:class="notifyFlag ? 'text-primary' : 'text-muted'") {{ notifyFlag ? '需通知' : '不需' }}

  lah-transition(speed="fastest")
    .d-flex.align-items-center(v-if="notifyFlag")
      .position-relative
        b-input(
          ref="noteInput"
          v-model="note",
          size="sm",
          :placeholder="notePlaceholder",
          :title="noteTitle",
          :state="validNoteState",
          trim,
          maxlength="12",
          class="note-input"
        )
        span.char-counter(v-if="note && note.length > 0 && !validNote") {{ note.length }}/12
        span.valid-icon(v-else-if="validNote" title="公文文號合規 (12碼)") ✔

      b-button-group.ml-1(size="sm")
        b-button(
          v-if="canCopyPrev"
          variant="outline-secondary"
          size="sm"
          class="px-1 py-0 btn-mini"
          title="帶入上一筆有效公文文號"
          @click="applyPrevNote"
        )
          lah-fa-icon(icon="arrow-up" size="xs")
          span.btn-mini-text 同上
        b-button(
          v-if="canIncrement"
          variant="outline-info"
          size="sm"
          class="px-1 py-0 btn-mini"
          title="連號遞增 (+1)"
          @click="incrementNote"
        )
          lah-fa-icon(icon="plus" size="xs")
          span.btn-mini-text +1
        b-button(
          v-if="!note"
          variant="outline-primary"
          size="sm"
          class="px-1 py-0 btn-mini"
          :title="`填入民國年前綴 (${currentRocYear})`"
          @click="fillYearPrefix"
        )
          span.btn-mini-text {{ currentRocYear }}
        b-button(
          v-if="note"
          variant="outline-danger"
          size="sm"
          class="px-1 py-0 btn-mini"
          title="清除文號"
          @click="clearNote"
        )
          lah-fa-icon(icon="times" size="xs")

    .text-muted.small.ml-1(v-else)
      span.badge.badge-light.text-muted.border-0 無需通知
</template>

<script>
import regCaseBase from '~/mixins/lah-reg-case-base.js'

export default {
  name: 'LahRegCaseAuthChecks',
  mixins: [regCaseBase],
  props: {
    prevNote: { type: String, default: '' }
  },
  data: () => ({
    notifyFlag: false,
    note: '',
    retried: 0
  }),
  computed: {
    validNote () {
      return !this.$utils.empty(this.note) && this.note.match(/^\d{12}$/) !== null
    },
    validNoteState () {
      if (!this.notifyFlag) { return null }
      if (this.$utils.empty(this.note)) { return false }
      return Boolean(this.validNote)
    },
    notePlaceholder () {
      return this.notifyFlag ? '請填12碼文號' : '無'
    },
    noteTitle () {
      if (this.validNote) {
        return `公文文號：${this.note} (合規)`
      }
      if (this.$utils.empty(this.note)) {
        return '需通知但尚未填寫12碼公文文號'
      }
      return `目前已輸入 ${this.note.length} 碼，需為12碼數字`
    },
    currentRocYear () {
      const year = new Date().getFullYear() - 1911
      return String(year)
    },
    canCopyPrev () {
      return !this.$utils.empty(this.prevNote) && this.prevNote !== this.note
    },
    canIncrement () {
      const base = this.note || this.prevNote
      return !this.$utils.empty(base) && /^\d+$/.test(base)
    },
    updateDataset () {
      return {
        id: this.caseId,
        authority: this.notifyFlag ? 1 : 0,
        note: this.note || ''
      }
    },
    editable () {
      return true
    }
  },
  watch: {
    ready (flag) {
      this.trigger('ready', flag)
    },
    note (n) {
      this.parentData.CASE_NOTIFY_NOTE = n || ''
      if (!this.$utils.empty(n)) {
        if (this.validNote) {
          this.notifyFlag = true
        }
      }
      this.updateDebounced()
    },
    notifyFlag (flag, oFlag) {
      if (flag !== undefined) {
        this.parentData.CASE_NOTIFY_AUTHORITY = flag ? 1 : 0
        if (oFlag !== undefined) {
          this.updateDebounced()
        }
      }
    },
    parentData () {
      this.refresh()
    }
  },
  created () {
    !this.parentData && !this.caseId && this.$utils.error('No :parent-data or :case-id attribute specified for this component!')
    this.updateDebounced = this.$utils.debounce(this.update, 400)
    this.refresh()
  },
  mounted () {
    this.trigger('ready', this.ready)
  },
  methods: {
    refresh () {
      this.notifyFlag = parseInt(this.parentData.CASE_NOTIFY_AUTHORITY) === 1
      this.note = this.parentData.CASE_NOTIFY_NOTE || ''
    },
    load () {
      this.notifyFlag = undefined
      this.note = undefined
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: 'reg_auth_checks',
        id: this.caseId
      }).then(({ data }) => {
        if (data.raw) {
          this.parentData.CASE_NOTIFY_AUTHORITY = parseInt(data.raw.authority)
          this.notifyFlag = parseInt(this.parentData.CASE_NOTIFY_AUTHORITY) === 1
          this.parentData.CASE_NOTIFY_NOTE = this.note = data.raw.note || ''
        } else {
          this.notifyFlag = false
          this.parentData.CASE_NOTIFY_AUTHORITY = 0
          this.parentData.CASE_NOTIFY_NOTE = ''
        }
      }).catch((err) => {
        this.alert(err.message)
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    },
    update () {
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: 'upd_reg_auth_checks',
        ...this.updateDataset
      }).then(({ data }) => {
        if (!this.$utils.statusCheck(data.status)) {
          if (this.retried < 5) {
            this.timeout(this.update, this.$utils.rand(800))
            this.retried++
          } else {
            this.$utils.warn(data.message, this.updateDataset)
          }
        } else {
          this.$emit('updated', this.updateDataset)
        }
      }).catch((err) => {
        this.alert(err.message)
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    },
    applyPrevNote () {
      if (this.canCopyPrev) {
        this.note = this.prevNote
        this.notifyFlag = true
      }
    },
    incrementNote () {
      const base = this.note || this.prevNote
      if (!base || !/^\d+$/.test(base)) { return }
      try {
        const nextNum = (BigInt(base) + 1n).toString().padStart(base.length, '0')
        this.note = nextNum
        this.notifyFlag = true
      } catch (e) {
        this.$utils.warn('連號遞增計算失敗', e)
      }
    },
    fillYearPrefix () {
      this.note = this.currentRocYear
      this.notifyFlag = true
      this.$nextTick(() => {
        if (this.$refs.noteInput && this.$refs.noteInput.$el) {
          this.$refs.noteInput.$el.focus()
        }
      })
    },
    clearNote () {
      this.note = ''
    }
  }
}
</script>

<style lang="scss" scoped>
.lah-reg-case-notify {
  min-width: 250px;
}
.note-input {
  width: 135px;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
  font-family: monospace;
}
.char-counter {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.68rem;
  color: #dc3545;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 0 2px;
  pointer-events: none;
  font-weight: 600;
}
.valid-icon {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.78rem;
  color: #28a745;
  pointer-events: none;
  font-weight: bold;
}
.btn-mini {
  font-size: 0.75rem;
  line-height: 1.2;
  padding-left: 0.35rem;
  padding-right: 0.35rem;
}
.btn-mini-text {
  font-size: 0.72rem;
  font-weight: bold;
}
</style>
