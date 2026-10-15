<template>
  <section v-if="total > 0" class="exd" :class="{ 'is-overdue': isOverdueMode }">
    <div class="exd-head">
      <div class="exd-title">
        <lah-fa-icon :icon="isOverdueMode ? 'exclamation-triangle' : 'hourglass-half'" />
        <span>{{ isOverdueMode ? '逾期案件戰情板' : '即將逾期案件戰情板' }}</span>
        <small class="text-muted ml-2">依目前篩選結果即時統計・點擊人員或原因可快速篩選</small>
      </div>
      <b-button
        size="sm"
        variant="link"
        class="exd-toggle"
        :title="collapsed ? '展開戰情板' : '收合戰情板'"
        @click="toggle"
      >
        <lah-fa-icon :icon="collapsed ? 'chevron-down' : 'chevron-up'" />
      </b-button>
    </div>

    <div v-show="!collapsed" class="exd-body">
      <!-- KPI -->
      <div class="exd-kpis">
        <div class="exd-kpi">
          <div class="exd-kpi-label">
            案件總數
          </div>
          <div class="exd-kpi-value">
            {{ total }}<small>件</small>
          </div>
          <div class="exd-kpi-sub">
            {{ reviewerStats.length }} 位初審人員
          </div>
        </div>
        <div class="exd-kpi" :class="`lv-${mostUrgentLevel}`">
          <div class="exd-kpi-label">
            {{ isOverdueMode ? '最久逾期' : '最緊急' }}
          </div>
          <div class="exd-kpi-value exd-kpi-value-sm">
            {{ mostUrgentText }}
          </div>
          <div class="exd-kpi-sub" :title="mostUrgentItem ? mostUrgentItem.收件字號 : ''">
            {{ mostUrgentItem ? mostUrgentItem.收件字號 : '-' }}
          </div>
        </div>
        <div class="exd-kpi">
          <div class="exd-kpi-label">
            {{ isOverdueMode ? '3 天以上逾期' : '1 小時內到期' }}
          </div>
          <div class="exd-kpi-value" :class="criticalCount > 0 ? 'text-danger' : 'text-success'">
            {{ criticalCount }}<small>件</small>
          </div>
          <div class="exd-kpi-sub">
            {{ criticalCount > 0 ? '建議優先追蹤' : '目前沒有' }}
          </div>
        </div>
        <div class="exd-kpi">
          <div class="exd-kpi-label">
            案件最多原因
          </div>
          <div class="exd-kpi-value exd-kpi-value-sm">
            {{ topReason ? topReason.name : '-' }}
          </div>
          <div class="exd-kpi-sub">
            {{ topReason ? `${topReason.count} 件 (${topReason.percent}%)` : '-' }}
          </div>
        </div>
      </div>

      <!-- 時限分布 -->
      <div class="exd-panel exd-dist">
        <div class="exd-panel-title">
          {{ isOverdueMode ? '逾期時間分布' : '到期時間分布' }}
        </div>
        <div class="exd-stack" role="img" :aria-label="distLabel">
          <div
            v-for="b in buckets"
            v-show="b.count > 0"
            :key="b.key"
            class="exd-seg"
            :class="`bg-${b.variant}`"
            :style="{ flexGrow: b.count }"
            :title="`${b.label}：${b.count} 件`"
          >
            {{ b.count }}
          </div>
        </div>
        <div class="exd-legend">
          <span v-for="b in buckets" :key="b.key" class="exd-legend-item">
            <i :class="`bg-${b.variant}`" />{{ b.label }} <b>{{ b.count }}</b>
          </span>
        </div>
      </div>

      <!-- 人員 / 原因 -->
      <div class="exd-cols">
        <div class="exd-panel">
          <div class="exd-panel-title">
            初審人員案件量 Top {{ topReviewers.length }}
          </div>
          <button
            v-for="r in topReviewers"
            :key="r.key"
            type="button"
            class="exd-row"
            :title="`只看 ${r.key}`"
            @click="$emit('filter', { key: 'casePreliminator', value: r.key })"
          >
            <span class="exd-row-name">{{ r.name }}</span>
            <span class="exd-bar"><i :style="{ width: r.width + '%' }" /></span>
            <span class="exd-row-count">{{ r.count }}</span>
          </button>
        </div>
        <div class="exd-panel">
          <div class="exd-panel-title">
            登記原因 Top {{ topReasons.length }}
          </div>
          <button
            v-for="r in topReasons"
            :key="r.name"
            type="button"
            class="exd-row"
            :title="`只看「${r.name}」`"
            @click="$emit('filter', { key: 'caseReason', value: r.name })"
          >
            <span class="exd-row-name">{{ r.name }}</span>
            <span class="exd-bar alt"><i :style="{ width: r.width + '%' }" /></span>
            <span class="exd-row-count">{{ r.count }}</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { HOUR, DAY, parseRocDateTime, humanizeDuration, urgencyLevel } from '~/mixins/expiry-time-mixin'

export default {
  name: 'LahRegExpiryDashboard',
  data: () => ({
    collapsed: false,
    now: Date.now(),
    timer: undefined
  }),
  computed: {
    isOverdueMode () { return this.$store.getters['expiry/is_overdue_mode'] },
    items () { return this.$store.getters['expiry/list'] || [] },
    total () { return this.items.length },
    // [{ item, remain(ms) }]
    timed () {
      return this.items.map(item => ({
        item,
        remain: parseRocDateTime(item?.限辦期限) - this.now
      }))
    },
    mostUrgentEntry () {
      const valid = this.timed.filter(t => !isNaN(t.remain))
      if (valid.length === 0) { return undefined }
      return valid.reduce((a, b) => (a.remain <= b.remain ? a : b))
    },
    mostUrgentItem () { return this.mostUrgentEntry?.item },
    mostUrgentLevel () { return this.mostUrgentEntry ? urgencyLevel(this.mostUrgentEntry.remain) : 'unknown' },
    mostUrgentText () {
      if (!this.mostUrgentEntry) { return '-' }
      const r = this.mostUrgentEntry.remain
      return r > 0 ? `剩 ${humanizeDuration(r)}` : `逾 ${humanizeDuration(r)}`
    },
    criticalCount () {
      return this.timed.filter(t => !isNaN(t.remain) && (this.isOverdueMode ? -t.remain > 3 * DAY : (t.remain > 0 && t.remain <= HOUR))).length
    },
    buckets () {
      const defs = this.isOverdueMode
        ? [
            { key: 'a', label: '1 天內', variant: 'warning', test: e => e <= DAY },
            { key: 'b', label: '1–3 天', variant: 'orange', test: e => e <= 3 * DAY },
            { key: 'c', label: '3–7 天', variant: 'danger', test: e => e <= 7 * DAY },
            { key: 'd', label: '7 天以上', variant: 'dark', test: () => true }
          ]
        : [
            { key: 'a', label: '1 小時內', variant: 'danger', test: e => e <= HOUR },
            { key: 'b', label: '1–2 小時', variant: 'orange', test: e => e <= 2 * HOUR },
            { key: 'c', label: '2–4 小時', variant: 'warning', test: e => e <= 4 * HOUR },
            { key: 'd', label: '4 小時以上', variant: 'info', test: () => true }
          ]
      const result = defs.map(d => ({ ...d, count: 0 }))
      this.timed.forEach((t) => {
        if (isNaN(t.remain)) { return }
        // 已逾期模式看「逾期多久」，即將逾期模式看「剩多久」
        const metric = this.isOverdueMode ? Math.max(0, -t.remain) : Math.max(0, t.remain)
        const hit = result.find(b => b.test(metric))
        if (hit) { hit.count++ }
      })
      return result
    },
    distLabel () { return this.buckets.map(b => `${b.label} ${b.count} 件`).join('，') },
    reviewerStats () {
      return this.group(this.items, i => i?.初審人員 || '')
    },
    topReviewers () {
      const list = this.reviewerStats.slice(0, 6)
      const max = list.length ? list[0].count : 1
      return list.map(r => ({
        ...r,
        // "HB1234 王小明" -> "王小明 (HB1234)"
        name: this.prettyReviewer(r.key),
        width: Math.max(4, Math.round((r.count / max) * 100))
      }))
    },
    reasonStats () {
      return this.group(this.items, i => i?.登記原因 || '')
    },
    topReasons () {
      const list = this.reasonStats.slice(0, 5)
      const max = list.length ? list[0].count : 1
      return list.map(r => ({ ...r, width: Math.max(4, Math.round((r.count / max) * 100)) }))
    },
    topReason () {
      const r = this.reasonStats[0]
      return r ? { ...r, percent: Math.round((r.count / this.total) * 100) } : undefined
    }
  },
  mounted () {
    this.timer = setInterval(() => { this.now = Date.now() }, 60 * 1000)
    try {
      this.collapsed = window.localStorage.getItem('lah-expiry-dash-collapsed') === '1'
    } catch (e) { /* ignore */ }
    this.$emit('toggle', this.collapsed)
  },
  beforeDestroy () {
    clearInterval(this.timer)
  },
  methods: {
    // 依 keyFn 分組計數並由大到小排序；空值略過（避免出現「未知」點選無法篩選）
    group (items, keyFn) {
      const map = {}
      items.forEach((i) => {
        const k = keyFn(i)
        if (!k) { return }
        map[k] = (map[k] || 0) + 1
      })
      return Object.keys(map)
        .map(key => ({ key, name: key, count: map[key] }))
        .sort((a, b) => b.count - a.count)
    },
    prettyReviewer (key) {
      // 資料格式可能是「代碼 姓名」或「姓名 代碼」，以英數代碼樣式判斷，確保完整顯示
      const parts = key.split(/\s+/).filter(Boolean)
      if (parts.length < 2) { return key }
      const idIdx = parts.findIndex(p => /^[A-Za-z]{1,3}\d+$/.test(p))
      if (idIdx < 0) { return parts.join(' ') }
      const id = parts[idIdx]
      const name = parts.filter((p, i) => i !== idIdx).join(' ')
      return `${name} (${id})`
    },
    toggle () {
      this.collapsed = !this.collapsed
      try {
        window.localStorage.setItem('lah-expiry-dash-collapsed', this.collapsed ? '1' : '0')
      } catch (e) { /* ignore */ }
      this.$emit('toggle', this.collapsed)
    }
  }
}
</script>

<style lang="scss" scoped>
.exd {
  margin: 0 0 .75rem;
  border-radius: 14px;
  background: linear-gradient(135deg, #f7faff 0%, #eef3fb 100%);
  border: 1px solid rgba(0, 0, 0, .06);
  box-shadow: 0 4px 18px rgba(30, 60, 120, .08);
  overflow: hidden;
  &.is-overdue {
    background: linear-gradient(135deg, #fff8f7 0%, #fdeeee 100%);
    box-shadow: 0 4px 18px rgba(180, 40, 40, .1);
  }
}
.exd-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: .45rem .9rem;
}
.exd-title { font-weight: 600; display: flex; align-items: center; gap: .5rem; }
.exd-toggle { padding: 0 .4rem; }
.exd-body { padding: 0 .9rem .9rem; display: grid; gap: .75rem; }

.exd-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: .75rem;
}
.exd-kpi {
  background: #fff;
  border-radius: 12px;
  padding: .6rem .9rem;
  border-left: 5px solid #5b8def;
  box-shadow: 0 1px 4px rgba(0, 0, 0, .06);
  min-width: 0;
  &.lv-crit { border-left-color: #dc3545; }
  &.lv-warn { border-left-color: #fd7e14; }
  &.lv-over { border-left-color: #ffc107; }
  &.lv-ok { border-left-color: #28a745; }
}
.exd-kpi-label { font-size: .8rem; color: #6c757d; }
.exd-kpi-value { font-size: 1.9rem; font-weight: 700; line-height: 1.2; font-variant-numeric: tabular-nums;
  small { font-size: .9rem; font-weight: 400; margin-left: .2rem; color: #6c757d; }
}
.exd-kpi-value-sm { font-size: 1.3rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.exd-kpi-sub { font-size: .78rem; color: #8a939b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.exd-panel {
  background: #fff;
  border-radius: 12px;
  padding: .6rem .9rem .7rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, .06);
  min-width: 0;
}
.exd-panel-title { font-size: .85rem; font-weight: 600; color: #495057; margin-bottom: .45rem; }

.exd-stack { display: flex; height: 28px; border-radius: 8px; overflow: hidden; background: #e9ecef; }
.exd-seg { display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 600; font-size: .85rem; min-width: 2rem; transition: flex-grow .4s ease;
  &.bg-warning, &.bg-info { color: #212529; }
}
.exd-legend { display: flex; flex-wrap: wrap; gap: .4rem 1rem; margin-top: .45rem; font-size: .8rem; color: #6c757d;
  i { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: .3rem; }
}
.bg-orange { background: #fd7e14; }

.exd-cols { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
.exd-row {
  display: flex; align-items: center; gap: .6rem; width: 100%;
  border: 0; background: transparent; padding: .2rem .3rem; border-radius: 8px; text-align: left; cursor: pointer;
  &:hover { background: #eef3fb; }
  &:focus-visible { outline: 2px solid #5b8def; }
}
.exd-row-name { flex: 0 0 11.5rem; white-space: nowrap; font-size: .88rem; }
.exd-row-count { flex: 0 0 2.2rem; text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; }
.exd-bar { flex: 1; height: 10px; background: #e9ecef; border-radius: 6px; overflow: hidden;
  i { display: block; height: 100%; border-radius: 6px; background: linear-gradient(90deg, #5b8def, #7aa7ff); transition: width .4s ease; }
  &.alt i { background: linear-gradient(90deg, #20c997, #6fe3c1); }
}
.is-overdue .exd-bar:not(.alt) i { background: linear-gradient(90deg, #dc3545, #ff7b86); }

@media (max-width: 992px) {
  .exd-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .exd-cols { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .exd-seg, .exd-bar i { transition: none; }
}
</style>
