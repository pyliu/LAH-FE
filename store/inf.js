export default {
  state: () => ({
    crsmsData: null
  }),
  getters: {
    crsmsData: state => state.crsmsData
  },
  mutations: {
    crsmsData (state, jsonPayload) {
      if (jsonPayload === null || jsonPayload === undefined) {
        state.crsmsData = jsonPayload
      }
      state.crsmsData = { ...jsonPayload }
    }
  },
  namespaced: true,
  strict: false
}
