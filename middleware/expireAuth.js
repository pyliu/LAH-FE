import isEmpty from 'lodash/isEmpty'

export default function ({
  store,
  redirect
}) {
  const authority = store.getters.authority
  store.commit('lastMessage', '檢查使用者資訊')
  if (!authority.isAdmin) {
    // user info not found ... redirect to /error
    if (isEmpty(store.getters.user)) {
      store.commit('lastMessage', `本頁面功能需確認使用者身分，請於本系統建立您的IP(${store.getters.ip})及帳號對應資料。`)
      return redirect('/error')
    }
    store.commit('lastMessage', '檢查是否有主管權限')
    // not chief => redirect to personal page
    if (!authority.isChief) {
      const myinfo = store.getters.user
      return redirect(`/expire/${myinfo.name}%20${myinfo.id}`)
    }
  }
}
