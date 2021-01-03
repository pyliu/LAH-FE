<template>
  <div>
    <lah-header>
      <div class="d-flex justify-content-between w-100">
        <b-input-group size="lg" class="text-nowrap mr-1" style="max-width: 350px">
          <b-input-group-prepend is-text>日期</b-input-group-prepend>
          <client-only>
            <b-form-datepicker
              value-as-date
              v-model="date_obj"
              placeholder="請選擇日期"
              :date-disabled-fn="dateDisabled"
              :max="new Date()"
            ></b-form-datepicker>
          </client-only>
          <b-button class="ml-1" @click.stop="reload()" variant="outline-primary" title="依據日期"><i class="fas fa-search"></i> 查詢</b-button>
        </b-input-group>
        <b-input-group size="lg" class="text-nowrap my-auto">
          <b-button variant="light" @click="$('.b-table tbody tr').removeClass('hide')" class="border px-3"><lah-fa-icon icon="list"></lah-fa-icon> 全部</b-button>
          <b-button variant="success" @click="$('.b-table tbody tr').addClass('hide'); $('.b-table tbody tr.filter-success').removeClass('hide');"><lah-fa-icon icon="suitcase"></lah-fa-icon> 已結案</b-button>
          <b-button variant="warning" @click="$('.b-table tbody tr').addClass('hide'); $('.b-table tbody tr.filter-warning').removeClass('hide');"><lah-fa-icon prefix="far" icon="clock"></lah-fa-icon> 快逾期</b-button>
          <b-button variant="danger" @click="$('.b-table tbody tr').addClass('hide'); $('.b-table tbody tr.filter-danger').removeClass('hide');"><lah-fa-icon icon="stopwatch"></lah-fa-icon> 已逾期</b-button>
          <b-button id="reload" variant="primary" @click="reload">
            <lah-fa-icon icon="sync-alt"> 刷新</lah-fa-icon>
            <b-badge variant="light">
              <countdown ref="countdown" :time="milliseconds" @end="handleCountdownEnd" @start="handleCountdownStart" :auto-start="false">
                <template slot-scope="props">{{ props.minutes.toString().padStart(2, '0') }}:{{ props.seconds.toString().padStart(2, '0') }}</template>
              </countdown>
              <span class="sr-only">倒數</span>
            </b-badge>
          </b-button>
        </b-input-group>
      </div>
    </lah-header>
    
    <b-modal
      :id="modalId"
      hide-footer
      centered
      no-close-on-backdrop
      size="xl"
    >
      <template #modal-title>
        登記案件詳情 {{modalCaseId}}
      </template>
      <span v-if="modalLoading" class="ld-txt">讀取中...</span>
      <lah-reg-case-detail v-show="!modalLoading" @ready="modalLoading = false" :case-id="modalCaseId"/>
    </b-modal>
  </div>
</template>

<script>
export default {
  head: {
    title: '登記案件詳情目錄-桃園市地政局'
  },
  data: () => ({
    modalId: 'this should be an uuid',
    modalLoading: true,
    modalCaseId: undefined
  }),
  methods: {
    dateDisabled(ymd, date) {
      const weekday = date.getDay();
      // Disable weekends (Sunday = `0`, Saturday = `6`)
      // Return `true` if the date should be disabled
      return weekday === 0// || weekday === 6;
    }
  },
  created () {
    this.modalId = this.$utils.uuid()
  }
}
</script>

<style lang="scss" scoped>
</style>
