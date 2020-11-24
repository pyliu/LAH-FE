export default {
  state: () => ({
    bakedData: undefined
  }),
  getters: {
    bakedData: state => state.bakedData,
    id: state => {
      const json = state.bakedData
      if (json) {
        return `${json['RM01']}${json['RM02']}${json['RM03']}`
      }
      return ''
    }
  },
  mutations: {
    updateBackedData (state, jsonPayload) {
      state.bakedData = jsonPayload || undefined
    }
  },
  actions: {
    update ({ commit, getters }, json) {
      return new Promise((resolve, reject) => {
        commit('updateBackedData', json)
        resolve(getters.bakedData)
      })
    }
  },
  namespaced: true,
  strict: false
}
