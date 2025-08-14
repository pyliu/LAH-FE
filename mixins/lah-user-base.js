export default {
  props: {
    raw: { type: Array, default: () => ([]) },
    id: { type: String, default: '' },
    name: { type: String, default: '' },
    from: { type: String, default: '' }
  },
  data: () => ({
    userData: {
      id: '',
      name: '',
      sex: '',
      title: '',
      work: '',
      ext: '411',
      birthday: '',
      unit: '',
      ip: '',
      education: '',
      exam: '',
      cell: '',
      onboard_date: '',
      authority: 0
    },
    workTitleOpts: [
      '業務助理',
      '約僱人員',
      '雇工',
      '工友',
      '書記',
      '助理員',
      '辦事員',
      '課員',
      '測量助理',
      '測量員',
      '技佐',
      '技工',
      '技士',
      '管理師',
      '助理管理師',
      '會計員',
      '人事管理員',
      '課長',
      '秘書',
      '主任',
      '臨時人員',
      '工讀生',
      '其他'
    ],
    unitOpts: [
      '登記課',
      '測量課',
      '行政課',
      '地價課',
      '資訊課',
      '人事室',
      '會計室',
      '秘書室',
      '主任室'
    ],
    sexOpts: [
      { value: 1, text: '男' },
      { value: 0, text: '女' }
    ]
  }),
  computed: {
    isDisabled () { return (this.userData.authority & this.$consts.AUTHORITY.DISABLED) === this.$consts.AUTHORITY.DISABLED },
    found () { return !this.$utils.empty(this.userData.id) }
  },
  fetch () {
    (this.raw.length === 0 || !this.$utils.empty(this.id) || !this.$utils.empty(this.name) || this.$utils.isIPv4(this.from)) &&
    this.$axios.post(this.$consts.API.JSON.USER, {
      type: 'user_info',
      id: this.id,
      name: this.name,
      ip: this.from
    }).then(({ data }) => {
      if (this.$utils.statusCheck(data.status)) {
        if (data.data_count > 1) {
          this.userData = data.raw.find((item, idx, array) => {
            return (item.authority & this.$consts.AUTHORITY.DISABLED) !== this.$consts.AUTHORITY.DISABLED
          }) || {}
        } else {
          this.userData = data.raw[0]
        }
      } else {
        this.$utils.warn(data.message)
      }
    }).catch((err) => {
      this.$utils.error(err)
    }).finally(() => {
      this.isBusy = false
    })
  },
  created () {
    this.raw.length > 0 && (this.userData = { ...this.userData, ...this.raw[0] })
  }
}
