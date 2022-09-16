export default {
  state: () => ({
    crsmsData: null,
    expaaData: null,
    bakedExpaaData: null
  }),
  getters: {
    crsmsData: state => state.crsmsData,
    expaaData: state => state.expaaData,
    bakedExpaaData: state => state.bakedExpaaData
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
    },
    bakedExpaaData (state, jsonPayload) {
      if (jsonPayload === null || jsonPayload === undefined) {
        state.bakedExpaaData = jsonPayload
      }
      state.bakedExpaaData = { ...jsonPayload }
    }
  },
  namespaced: true,
  strict: false
}
