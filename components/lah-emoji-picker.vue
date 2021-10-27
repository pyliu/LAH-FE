<template lang="pug">
div: VEmojiPicker(
  @select="$emit('select', $event)"
  :i18n="i18n"
  :limitFrequently="limitFrequently"
  :emojisByRow="emojisByRow"
  :continuousList="continuousList"
  :emojiSize="emojiSize"
  :emojiWithBorder="emojiWithBorder"
  :showSearch="showSearch"
  :showCategories="showCategories"
  :dark="dark"
  :initialCategory="initialCategory"
  :exceptCategories="exceptCategories"
  :exceptEmojis="exceptEmojis"
)
</template>

<script>
import { VEmojiPicker } from 'v-emoji-picker'
export default {
  components: { VEmojiPicker },
  props: {
    limitFrequently: { type: Number, default: 15 },
    emojisByRow: { type: Number, default: 5 },
    continuousList: { type: Boolean, default: false },
    emojiSize: { type: Number, default: 32 },
    emojiWithBorder: { type: Boolean, default: false },
    showSearch: { type: Boolean, default: false },
    showCategories: { type: Boolean, default: true },
    dark: { type: Boolean, default: false },
    initialCategory: { type: String, default: 'Peoples' },
    exceptCategories: { type: Array, default: () => [] },
    exceptEmojis: { type: Array, default: () => [] }
  },
  data: () => ({
    i18n: {
      search: '搜尋',
      categories: {
        Activity: '運動',
        Flags: '旗幟',
        Foods: '食物&飲品',
        Frequently: '最近',
        Objects: '物品',
        Nature: '動物&自然',
        Peoples: '人物',
        Symbols: '符號',
        Places: '旅行&交通'
      }
    }
  })
}
</script>

<style lang="scss" scoped>
</style>
