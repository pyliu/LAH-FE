import isEmpty from 'lodash/isEmpty'

export default function ({
    store,
    redirect
  }) {
    const authority = store.getters.authority
    store.commit('lastMessage', '檢查使用者資訊')
    if (!authority.isAdmin && !authority.isSuper) {
      // user info not found ... redirect to /error
      if (isEmpty(store.getters.user)) {
        store.commit('lastMessage', `找不到 ${store.getters.ip} 對應使用者資訊，請確認您的帳號已經建立。`)
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
  