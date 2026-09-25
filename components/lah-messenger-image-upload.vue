<template lang="pug">
div(
  ref="container"
  @dragover="dragover"
  @dragleave="dragleave"
  @drop="drop"
  @paste="pasteImage($event, pasted)"
)
  b-file(
    v-model="uploadFile"
    placeholder="支援上傳 JPG/PNG/GIF 圖檔"
    drop-placeholder="放開以設定上傳檔案"
    browse-text="瀏覽"
    :accept="supportTypes.join(',')"
  ): template(slot="file-name" slot-scope="{ names }"): b-badge(variant="primary") {{ names[0] }}
  hr
  h6.d-flex.align-items-center(ref="selectPreview")
    b-icon.mr-1(icon="eye")
    span.mr-auto 預覽
    b-button.ml-1(
      @click="publish"
      variant="outline-success"
      title="直接傳送"
      size="sm"
      v-if="!empty(encoded)"
    ): b-icon(icon="plus" scale="1.5")
  .d-flex.align-items-end(v-if="!empty(encoded)" ref="preview")
    b-img(
      :src="encoded"
      thumbnail
      fluid
    )
  hr
  h6.d-flex.align-items-center
    b-icon.mr-1(icon="clock-history")
    span.mr-1 歷史圖片
    b-badge(pill variant="secondary") {{ imageMemento.length }}
  .d-flex.flex-wrap.align-items-center.justify-content-start: .memento-item(
    v-for="(memento, idx) in imageMementoReverse"
    v-if="!empty(memento)"
    :key="`imgMemento_${idx}`"
  )
    b-img.memento.my-1.mx-1(
      :src="memento"
      thumbnail
      fluid
      title="挑選這張圖片"
      @click="pick(memento)"
    )
    b-icon.removeIcon(
      icon="x-circle"
      title="移除這張照片"
      scale="1.25"
      @click="remove(memento)"
    )
</template>

<script>
import lahMessengerBase from '~/mixins/lah-messenger-base'

export default {
  name: 'LahMessengerImageUpload',
  mixins: [lahMessengerBase],
  props: {
    to: { type: String, required: true },
    rightaway: { type: Boolean, default: false },
    skipPreview: { type: Boolean, default: false },
    modalId: { type: String, default: undefined }
  },
  data: () => ({
    uploadFile: undefined,
    encoded: '',
    supportTypes: ['image/jpeg', 'image/png', 'image/gif']
  }),
  computed: {
    name () { return this.userMap[this.to] || this.to },
    imageMementoReverse () { return [...this.imageMemento].reverse() },
    imageMementoCacheKey () {
      return (typeof this.$store.getters.imageMementoCacheKey === 'function'
        ? this.$store.getters.imageMementoCacheKey()
        : this.$store.getters.imageMementoCacheKey) || 'imageMementoCached'
    }
  },
  watch: {
    uploadFile (file) {
      file && this.upload()
    },
    imageMemento (arr) {
      this.$localForage.setItem(this.imageMementoCacheKey, arr).catch((err) => {
        this.alert(`快取圖檔失敗 (${err.toString()})`)
      })
    }
  },
  methods: {
    pasted (base64) { this.encoded = base64 },
    upload () {
      const type = this.uploadFile?.type
      if (this.supportTypes.includes(type)) {
        this.isBusy = true
        this.encoded = ''
        const formData = new FormData()
        formData.append('file', this.uploadFile)
        formData.append('width', 1920)
        formData.append('height', 1080)
        formData.append('quality', 80)
        const uploadUrl = `${this.apiQueryUrl}${this.$consts.API.FILE.BASE64}`
        this.$upload.post(uploadUrl, formData).then(({ data }) => {
          if (!this.empty(data.encoded) && !this.empty(data.uri)) {
            this.encoded = `${data.uri}${data.encoded}`
            this.$store.commit('addImageMemento', this.encoded)
            if (this.$utils.statusCheck(data.status)) {
              this.rightaway && this.sendImage(this.encoded, `給${this.name}`, this.to)
            } else {
              this.warning(data.message, { title: '上傳圖檔結果' })
            }
          } else {
            this.warning('回傳的影像編碼有誤', { title: '上傳圖檔結果' })
          }
        }).catch((err) => {
          console.error(err)
        }).finally(() => {
          this.isBusy = false
        })
      } else {
        this.warning('僅支援 JPG/PNG/GIF 圖檔上傳')
      }
    },
    publish () {
      this.$emit('publish', this.encoded)
      this.encoded = ''
      this.uploadFile = undefined
      if (this.modalId) {
        this.hideModalById(this.modalId)
      }
    },
    pick (memento) {
      this.encoded = memento
      if (this.skipPreview) {
        this.publish()
      } else {
        this.$nextTick(() => {
          if (this.$refs.selectPreview?.scrollIntoView) {
            this.$refs.selectPreview.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' })
          } else if (this.$refs.container) {
            this.$refs.container.scrollTop = 0
          }
        })
      }
    },
    remove (memento) {
      const removed = this.$utils._.remove(this.imageMemento, (imageData) => {
        return this.$utils.equal(imageData, memento)
      })
      this.$store.commit('imageMemento', this.imageMemento)
    },
    dragover (event) {
      event.stopPropagation()
      event.preventDefault()
      if (!event.currentTarget.classList.contains('dropable')) {
        event.currentTarget.classList.add('dropable')
      }
    },
    dragleave (event) {
      event.currentTarget.classList.remove('dropable')
    },
    drop (event) {
      event.stopPropagation()
      event.preventDefault()
      if (event.dataTransfer.files.length > 0) {
        this.uploadFile = event.dataTransfer.files[0]
      }
      event.currentTarget.classList.remove('dropable')
    }
  }
}
</script>

<style lang="scss" scoped>
.memento-item {
  position: relative;
  display: inline-block;
  .removeIcon {
    position: absolute;
    top: 6px;
    right: 6px;
    color: #dc3545;
    background: #fff;
    border-radius: 50%;
    cursor: pointer;
    opacity: 0.8;
    &:hover {
      opacity: 1;
      transform: scale(1.2);
    }
  }
}
.memento {
  width: 120px;
  height: 90px;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s;
  &:hover {
    transform: scale(1.05);
    border-color: #007bff;
  }
}
</style>
