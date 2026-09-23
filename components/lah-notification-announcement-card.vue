<template lang="pug">
.announcement-card-container
  .client-announcement-card
    .card-header-banner(:style="{ backgroundColor: headerBgColor }")
      .header-title-box.text-truncate(:title="dataJson.title")
        span {{ dataJson.title || '（尚未輸入標題）' }}
      .header-id \#{{ dataJson.id || '預覽' }}
    .card-body-content(v-html="content")
    .card-footer-info
      .footer-sender {{ sender }}
      .footer-action-pills(v-if="showActions")
        span.action-pill.action-pill-edit ✏ 編輯
        span.action-pill.action-pill-remove ⊗ 移除
      .footer-time {{ dataJson.create_datetime }}
</template>

<script>
export default {
  props: {
    dataJson: { type: Object, required: true },
    showActions: { type: Boolean, default: true }
  },
  computed: {
    header () {
      return this.dataJson.title
    },
    headerBgColor () {
      const priority = parseInt(this.dataJson.priority)
      switch (priority) {
        case 0:
          return '#e74c3c' // 最高 (紅)
        case 1:
          return '#e67e22' // 高 (橘)
        case 2:
          return '#0288d1' // 中 (藍)
        case 3:
        default:
          return '#1396a8' // 正常 (即時通標準深藍綠，同截圖)
      }
    },
    borderVariant () {
      const priority = parseInt(this.dataJson.priority)
      switch (priority) {
        case 0: return 'danger'
        case 1: return 'warning'
        case 2: return 'info'
        default: return 'secondary'
      }
    },
    textVariant () {
      return 'white'
    },
    sender () {
      if (this.userNames && this.dataJson.sender) {
        const name = this.userNames[this.dataJson.sender]
        return name ? `${this.dataJson.sender} ${name}` : this.dataJson.sender
      }
      return this.dataJson.sender || ''
    },
    content () {
      if (process.server) {
        return this.dataJson.content || ''
      }
      return this.$utils.convertMarkd(this.dataJson.content || '')
    }
  }
}
</script>

<style lang="scss" scoped>
.announcement-card-container {
  width: 100%;
  max-width: 440px;
  margin: 0 auto;
}

.client-announcement-card {
  background-color: #ffffff;
  border-radius: 8px;
  border: 1px solid #dcdfe6;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;

  .card-header-banner {
    padding: 12px 16px;
    color: #ffffff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top-left-radius: 7px;
    border-top-right-radius: 7px;

    .header-title-box {
      font-size: 1.15rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      line-height: 1.4;
      max-width: 75%;
    }

    .header-id {
      font-size: 1.3rem;
      font-weight: 800;
      opacity: 0.95;
      white-space: nowrap;
      margin-left: 8px;
    }
  }

  .card-body-content {
    padding: 18px 20px;
    font-size: 15px;
    line-height: 1.75;
    color: #2c3e50;
    min-height: 90px;
    word-break: break-word;

    ::v-deep p {
      margin-bottom: 0.75rem;
      &:last-child {
        margin-bottom: 0;
      }
    }

    ::v-deep ul, ::v-deep ol {
      padding-left: 24px;
      margin-bottom: 0.75rem;
    }

    ::v-deep blockquote {
      border-left: 4px solid #1396a8;
      padding-left: 12px;
      margin: 8px 0;
      color: #606266;
      background: #f8f9fa;
      padding-top: 4px;
      padding-bottom: 4px;
    }

    ::v-deep hr {
      margin: 12px 0;
      border-top: 1px dashed #dcdfe6;
    }

    ::v-deep a {
      color: #007bff;
      text-decoration: underline;
    }

    ::v-deep font {
      font-weight: inherit;
    }
  }

  .card-footer-info {
    background-color: #fafbfc;
    border-top: 1px solid #edf2f7;
    padding: 8px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12.5px;
    color: #6c757d;

    .footer-sender {
      font-weight: 500;
      color: #495057;
      max-width: 38%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .footer-action-pills {
      display: flex;
      gap: 6px;
      user-select: none;

      .action-pill {
        padding: 1px 7px;
        border-radius: 4px;
        font-size: 11.5px;
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.2s;

        &:hover {
          opacity: 0.8;
        }

        &.action-pill-edit {
          border: 1px solid #007bff;
          color: #007bff;
          background-color: #f0f7ff;
        }

        &.action-pill-remove {
          border: 1px solid #dc3545;
          color: #dc3545;
          background-color: #fff5f5;
        }
      }
    }

    .footer-time {
      font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11.5px;
      color: #868e96;
      white-space: nowrap;
    }
  }
}
</style>
