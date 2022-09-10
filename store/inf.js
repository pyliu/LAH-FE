export default {
  state: () => ({
    crsmsData: null
  }),
  getters: {
    crsmsData: state => state.crsmsData
  },
  mutations: {
    crsmsData (state, jsonPayload) {
      state.crsmsData = { ...jsonPayload }
    }
  },
  namespaced: true,
  strict: false
}
