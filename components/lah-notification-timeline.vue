<template lang="pug">
b-card.p-2.border-0.bg-transparent(no-body)
  .text-center.text-muted.my-3(v-if="itemsCount === 0")
    lah-fa-icon.mr-1(icon="info-circle")
    span 尚無公告資料
  .timeline-container(v-else)
    transition-group(name="list", tag="div", class="timeline-list")
      .timeline-item(
        v-for="(item, index) in orderedItems",
        :key="getItemKey(item, index)",
        :class="{ 'is-last': index === itemsCount - 1, 'is-expanded': isExpanded(item, index) }"
      )
        //- 垂直連接線 (Vertical connector line)
        .timeline-track(v-if="index !== itemsCount - 1")

        //- 時間軸日期節點 (Date Badge Node)
        .timeline-node
          .date-badge(
            :class="[badgeClass(item)]",
            :title="`發布時間：${item.create_datetime || ''}`"
          )
            span.date-badge-text {{ dateBadgeInfo(item.create_datetime).text }}

        //- 載入骨架/等待狀態
        .timeline-card-wrapper(v-if="item.spinner")
          .p-2.d-flex.align-items-center
            b-spinner(:variant="bootstrapVariant", small).mr-2
            span.small.text-muted 載入中...

        //- 手風琴條列與折疊卡片容器 (Accordion Row & Expandable Card)
        .timeline-card-wrapper(v-else)
          //- 手風琴緊湊標題條 (Compact Accordion Header)
          .timeline-header(
            @click="toggleItem(item, index)",
            :class="{ 'expanded': isExpanded(item, index) }",
            role="button",
            tabindex="0",
            @keydown.enter.prevent="toggleItem(item, index)",
            @keydown.space.prevent="toggleItem(item, index)"
          )
            //- 緊急程度燈號 (Urgency indicator dot with pulse glow)
            .urgency-indicator(
              :class="[urgencyDotClass(item)]",
              :title="`緊急程度：${itemUrgency(item)}`"
            )

            //- 標題
            .timeline-title.text-truncate(
              :title="cleanTags(item.title)",
              v-html="item.title"
            )

            //- 標籤與展開指示箭頭
            .timeline-meta.d-flex.align-items-center.ml-auto.flex-shrink-0
              b-badge.urgency-badge.mr-1(
                v-if="isUrgent(item)",
                :variant="itemVariant(item)",
                pill
              ) {{ itemUrgency(item) }}

              span.chevron-icon(:class="{ 'is-open': isExpanded(item, index) }")
                lah-fa-icon(icon="chevron-down", size="xs")

          //- 手風琴展開內容卡片 (Expanded Content Card)
          b-collapse(
            :id="`collapse-${getItemKey(item, index)}`",
            :visible="isExpanded(item, index)"
          )
            .timeline-content-card.mt-2.mb-2
              .content-header.d-flex.align-items-center.justify-content-between.mb-2.pb-1.border-bottom
                .d-flex.align-items-center.small.text-muted
                  lah-fa-icon(icon="clock", regular).mr-1
                  span {{ item.create_datetime }}
                b-badge(
                  :variant="itemVariant(item)",
                  pill
                ) {{ itemUrgency(item) }}

              .item-description.timeline-img(
                @click="handleContentClick($event)",
                v-html="cleanText(item.content)"
              )

              .content-footer.d-flex.flex-wrap.justify-content-between.align-items-center.pt-2.mt-2.border-top
                .text-muted.small.my-1(v-if="item.id")
                  lah-fa-icon(icon="bullhorn", size="xs").mr-1
                  span 公告編號 {{ '#' + item.id }}
                .ml-auto.my-1
                  b-button(
                    variant="outline-secondary",
                    size="sm",
                    title="顯示使用者資訊",
                    class="sender-btn py-0 px-2 text-nowrap",
                    @click.stop="showUserCard(item)"
                  )
                    lah-fa-icon(icon="user", size="xs").mr-1
                    span {{ displaySender(item) }}
</template>

<script>
import { formatDistanceToNow, format, isToday, isYesterday, differenceInCalendarDays } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import lahUserCard from '~/components/lah-user-card.vue'

export default {
  name: 'LahNotificationTimeline',
  components: { lahUserCard },
  props: {
    /**
     * [{ create_datetime: '2022-04-20 15:16:00', title: '...', content: '...', priority: 1, sender: '...' }, ...]
     */
    items: { type: Array, default: () => ([]) },
    reverse: { type: Boolean, default: false },
    dateFormat: { type: String, default: 'yyyy-MM-dd HH:mm:ss' },
    variant: { type: String, default: 'primary' },
    humanFriendlyTime: { type: Boolean, default: true },
    loading: { type: Boolean, default: false },
    openFirst: { type: Boolean, default: false }
  },
  data: () => ({
    expandedMap: {}
  }),
  computed: {
    bootstrapVariant () {
      return this.variant || 'primary'
    },
    itemsCount () {
      return this.orderedItems.length
    },
    orderedItems () {
      let items = this.items || []
      if (this.loading) {
        items = [...items, { spinner: true, create_datetime: '', title: '載入中...' }]
      }
      if (this.reverse) {
        items = [...items].reverse()
      }
      return items
    }
  },
  watch: {
    orderedItems: {
      immediate: true,
      handler (items) {
        if (this.openFirst && items && items.length > 0) {
          const firstRealItem = items.find(it => !it.spinner)
          if (firstRealItem) {
            const firstKey = this.getItemKey(firstRealItem, 0)
            if (this.expandedMap[firstKey] === undefined) {
              this.$set(this.expandedMap, firstKey, true)
            }
          }
        }
      }
    }
  },
  methods: {
    getItemKey (item, index) {
      if (item.spinner) {
        return `spinner-${index}`
      }
      return item.id !== undefined && item.id !== null ? `item-${item.id}` : `idx-${index}`
    },
    isExpanded (item, index) {
      if (item.spinner) {
        return false
      }
      return !!this.expandedMap[this.getItemKey(item, index)]
    },
    toggleItem (item, index) {
      if (item.spinner) {
        return
      }
      const key = this.getItemKey(item, index)
      this.$set(this.expandedMap, key, !this.expandedMap[key])
    },
    isHighestUrgency (item) {
      return parseInt(item?.priority) === 0
    },
    isWarningUrgency (item) {
      return parseInt(item?.priority) === 1
    },
    isUrgent (item) {
      const priority = parseInt(item?.priority)
      return priority === 0 || priority === 1
    },
    itemVariant (item) {
      const priority = parseInt(item?.priority)
      switch (priority) {
        case 0: return 'danger'
        case 1: return 'warning'
        case 2: return 'info'
        default: return 'secondary'
      }
    },
    itemUrgency (item) {
      const priority = parseInt(item?.priority)
      switch (priority) {
        case 0: return '最高'
        case 1: return '高'
        case 2: return '中'
        default: return '正常'
      }
    },
    dateBadgeInfo (datetimeStr) {
      if (!datetimeStr) {
        return { text: '公告', variant: 'secondary' }
      }
      try {
        const d = new Date(datetimeStr.replace(' ', 'T'))
        if (isNaN(d.getTime())) {
          return { text: '公告', variant: 'secondary' }
        }
        if (isToday(d)) {
          return { text: '今日', variant: 'primary', isToday: true }
        }
        if (isYesterday(d)) {
          return { text: '昨日', variant: 'info', isYesterday: true }
        }
        const diffDays = differenceInCalendarDays(new Date(), d)
        if (diffDays >= 0 && diffDays <= 7) {
          return { text: `${diffDays}天前`, variant: 'secondary' }
        }
        return { text: format(d, 'MM/dd'), variant: 'light' }
      } catch (e) {
        return { text: '公告', variant: 'secondary' }
      }
    },
    badgeClass (item) {
      const info = this.dateBadgeInfo(item?.create_datetime)
      return {
        [`badge-${info.variant}`]: true,
        'badge-today': !!info.isToday,
        'badge-yesterday': !!info.isYesterday
      }
    },
    urgencyDotClass (item) {
      const variant = this.itemVariant(item)
      return {
        [variant]: true,
        'pulse-danger': this.isHighestUrgency(item),
        'pulse-warning': this.isWarningUrgency(item)
      }
    },
    displayTimestamp (datetimeStr) {
      try {
        const d = Date.parse(datetimeStr.replace(' ', 'T'))
        return this.humanFriendlyTime
          ? formatDistanceToNow(d, { addSuffix: true, locale: zhTW })
          : datetimeStr
      } catch (e) {
        return datetimeStr
      }
    },
    displaySender (item) {
      const name = this.userNames?.[item?.sender] || ''
      return `${item?.sender || ''} ${name}`.trim()
    },
    cleanText (text) {
      const highlighted = this.$utils.highlightPipeline(text)
      const domsafe = this.$utils.convertMarkd(highlighted)
      if (/!\[.+\]\(data:image\/.+\)/gm.test(domsafe)) {
        if (typeof domsafe?.replaceAll === 'function') {
          return this.$utils.convertInlineMarkd(domsafe.replaceAll('\n', ''))
        }
        return this.$utils.convertInlineMarkd(domsafe.replace(/\n/g, ''))
      }
      return domsafe
    },
    cleanTags (title) {
      return this.cleanText(title)?.replace(/(<([^>]+)>)/gi, '')
    },
    handleContentClick (event) {
      if (this.$utils.equal(event.target.tagName, 'IMG')) {
        this.modal(this.$createElement('IMG', {
          attrs: { src: event.target.src },
          class: ['img-thumbnail', 'img-fluid', 'rounded', 'mx-auto', 'd-block']
        }), {
          size: 'lg',
          title: `顯示圖片 - alt: ${event.target.alt}`
        })
      }
    },
    showUserCard (item) {
      const h = this.$createElement
      const name = this.userNames?.[item?.sender] || ''
      this.modal(h('lah-user-card', {
        props: { id: item?.sender }
      }), {
        title: `使用者資訊 - ${name}`
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.timeline-container {
  position: relative;
  width: 100%;
  color: #212529;
}

.timeline-list {
  position: relative;
}

.timeline-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;

  &.is-last {
    margin-bottom: 4px;
  }
}

.timeline-track {
  position: absolute;
  left: 27px;
  top: 24px;
  bottom: -16px;
  width: 2px;
  background: linear-gradient(to bottom, #ced4da 0%, #dee2e6 100%);
  z-index: 1;
}

.timeline-node {
  flex-shrink: 0;
  width: 56px;
  margin-right: 10px;
  z-index: 2;
  display: flex;
  justify-content: center;
}

.date-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 3px 0;
  border-radius: 12px;
  font-size: 0.72rem;
  font-weight: 700;
  text-align: center;
  letter-spacing: 0.5px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  user-select: none;

  &.badge-today {
    background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
    color: #ffffff;
    box-shadow: 0 2px 6px rgba(13, 110, 253, 0.35);
  }

  &.badge-yesterday {
    background: linear-gradient(135deg, #0dcaf0 0%, #0aa2c0 100%);
    color: #ffffff;
    box-shadow: 0 2px 5px rgba(13, 202, 240, 0.3);
  }

  &.badge-secondary {
    background-color: #6c757d;
    color: #ffffff;
  }

  &.badge-light {
    background-color: #f8f9fa;
    color: #495057;
    border: 1px solid #ced4da;
  }
}

.timeline-card-wrapper {
  flex-grow: 1;
  min-width: 0;
}

.timeline-header {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;

  &:hover {
    background-color: #f8fafc;
    border-color: #cbd5e1;
    transform: translateX(3px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  }

  &.expanded {
    background-color: #f1f5f9;
    border-color: #94a3b8;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  }
}

.urgency-indicator {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  margin-right: 8px;
  flex-shrink: 0;
  position: relative;

  &.danger {
    background-color: #dc3545;
  }
  &.warning {
    background-color: #ffc107;
  }
  &.info {
    background-color: #0dcaf0;
  }
  &.secondary {
    background-color: #adb5bd;
  }

  &.pulse-danger {
    animation: pulse-danger 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
  }
  &.pulse-warning {
    animation: pulse-warning 2.5s infinite cubic-bezier(0.4, 0, 0.6, 1);
  }
}

@keyframes pulse-danger {
  0% {
    box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(220, 53, 69, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(220, 53, 69, 0);
  }
}

@keyframes pulse-warning {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.7);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(255, 193, 7, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 193, 7, 0);
  }
}

.timeline-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #212529;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-grow: 1;
  min-width: 0;
}

.timeline-meta {
  display: flex;
  align-items: center;
  margin-left: auto;
  flex-shrink: 0;
}

.urgency-badge {
  font-size: 0.65rem;
  padding: 2px 6px;
}

.chevron-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: #64748b;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s ease;
  margin-left: 2px;

  &.is-open {
    transform: rotate(180deg);
    color: #0d6efd;
  }
}

.timeline-content-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  color: #212529;
}

.item-description {
  display: block;
  text-align: left;
  word-break: break-word;
  font-size: 0.88rem;
  line-height: 1.6;
  color: #212529;

  ::v-deep {
    color: #212529;

    p, span, div, li, ul, ol, h1, h2, h3, h4, h5, h6, strong, em, table, td, th {
      color: #212529;
    }

    .text-bold-red, .text-bold-danger {
      color: #dc3545 !important;
    }
    .text-bold-blue, .text-bold-info {
      color: #0d6efd !important;
    }
    .text-bold-orange, .text-bold-warning {
      color: #fd7e14 !important;
    }
    .text-bold-green, .text-bold-success {
      color: #198754 !important;
    }

    a {
      color: #0d6efd;
      text-decoration: underline;
    }

    blockquote {
      border-left: 3px solid #dee2e6;
      padding-left: 8px;
      margin: 4px 0;
      color: #495057;
    }
  }
}

.content-header {
  color: #6c757d;
  .text-muted {
    color: #6c757d !important;
  }
}

.content-footer {
  color: #6c757d;
  .text-muted {
    color: #6c757d !important;
  }
}

// Dark Mode Support
:global(.dark-mode) {
  .timeline-container {
    color: #e0e0e0;
  }

  .timeline-track {
    background: linear-gradient(to bottom, #495057 0%, #343a40 100%);
  }

  .date-badge {
    &.badge-light {
      background-color: #343a40;
      color: #ced4da;
      border-color: #495057;
    }
  }

  .timeline-header {
    background-color: #262626;
    border-color: #3e3e3e;
    color: #e0e0e0;

    &:hover {
      background-color: #333333;
      border-color: #555555;
    }

    &.expanded {
      background-color: #2d2d2d;
      border-color: #666666;
    }
  }

  .timeline-title {
    color: #f1f5f9;
  }

  .chevron-icon {
    color: #94a3b8;

    &.is-open {
      color: #66b0ff;
    }
  }

  .timeline-content-card {
    background-color: #1f1f1f;
    border-color: #3a3a3a;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    color: #e0e0e0;
  }

  .item-description {
    color: #e0e0e0;

    ::v-deep {
      color: #e0e0e0;

      p, span, div, li, ul, ol, h1, h2, h3, h4, h5, h6, strong, em, table, td, th {
        color: #e0e0e0;
      }

      a {
        color: #66b0ff;
      }

      blockquote {
        border-left-color: #495057;
        color: #adb5bd;
      }
    }
  }

  .content-header,
  .content-footer {
    border-color: #3a3a3a !important;
    color: #adb5bd;
    .text-muted {
      color: #adb5bd !important;
    }
  }
}
</style>
