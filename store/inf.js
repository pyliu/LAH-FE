export default {
  state: () => ({
    crsmsData: null,
    expaaData: null
  }),
  getters: {
    crsmsData: state => state.crsmsData,
    expaaData: state => state.expaaData
  },
  mutations: {
    crsmsData (state, jsonPayload) {
      if (jsonPayload === null || jsonPayload === undefined) {
        state.crsmsData = jsonPayload
      }
      state.crsmsData = { ...jsonPayload }
    },
    expaaData (state, jsonPayload) {
      if (jsonPayload === null || jsonPayload === undefined) {
        state.expaaData = jsonPayload
      }
      state.expaaData = { ...jsonPayload }
    }
  },
  namespaced: true,
  strict: false
}
