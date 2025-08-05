<template lang="pug">
div
  h5 ⭐需於兩個節點安裝監控腳本(請自行依擺放腳本位置修正路徑)
  ol
    li 請於 NODE1 的 crontab 安裝「#[b-link.text-danger.font-weight-bold(:href="checkAIXSh51" target="_blank" title="下載腳本") health_check_aix_51_HA.sh]」以利完成後送出通知電子郵件。
    li e.g. 在 root 的 crontab 新增「#[span.text-primary.font-weight-bold 0,15,30,45 7-17 * * 1-6 /ha/health_check_aix_51_HA.sh > /dev/null]」於辦公時間每15分鐘執行一次。
  ol
    li 請於 NODE2 的 crontab 安裝「#[b-link.text-danger.font-weight-bold(:href="checkAIXSh52" target="_blank" title="下載腳本") health_check_aix_52.sh]」以利完成後送出通知電子郵件。
    li e.g. 在 root 的 crontab 新增「#[span.text-primary.font-weight-bold 0,15,30,45 7-17 * * 1-6 /ha/health_check_aix_52.sh > /dev/null]」於辦公時間每15分鐘執行一次。
  ul
    li 儀表板分析收到的電子郵件以顯示資料庫兩個NODE的狀態。
    li 安裝腳本後將依 crontab 設定時間檢查後並送出電子郵件通知 (桃園所 👉 每天 07:00 ~ 17:45 每15分鐘檢查一次)。
    li 儀表板預設約每15分鐘更新檢查監控郵件一次。
  hr
  h6 ✨ 腳本相關設定#[span.text-danger.font-weight-bold 請依各所實際環境調整]，如郵件收件者、路徑資料夾名稱，如HXWEB ... 等
  ul: li 注意：郵件標題 "[Health Check] - p8_" 請勿修改，智慧監控是依規則此抓郵件的。
  h6 ✨ AIX主機要認得的郵件伺服器(不然寄不出郵件)
  ul: li /etc/hosts 加入 entry (以桃園所設定為例 👉 220.1.34.50 mail.ha.cenweb.land.moi)
  hr
  h5 燈號說明
  ul
    li 🟢 綠燈 (正常)：ST_STABLE，所有服務都已就緒，處於靜態的、穩定的待命或線上服務狀態。。
    li 🟡 黃燈 (處理中)：沒找到監控郵件或是其他下列狀態：ST_INIT, ST_JOINING, ST_VARYON, ST_VARYOFF, ST_MOVE 等(這些狀態在正常操作下應該只會短暫出現)。
    li 🔴 紅燈 (警示)：如果叢集長時間 (例如，超過 5-10 分鐘) 停留在任何一個「黃燈」狀態，特別是 ST_MOVE，這通常代表資源群組在移動過程中被卡住了，可能是儲存、網路或應用程式本身出了問題，需要立即介入調查。如果出現 ST_RECOVERY 狀態，也值得您去檢查系統日誌，了解先前發生了什麼錯誤。
</template>

<script>
export default {
  name: 'LahPowerhaHelpContent',
  computed: {
    checkAIXSh51 () {
      return `http://${this.apiSvrIp}:${this.apiSvrPort}/assets/sh/health_check_aix_51_HA.sh`
    },
    checkAIXSh52 () {
      return `http://${this.apiSvrIp}:${this.apiSvrPort}/assets/sh/health_check_aix_52.sh`
    }
  }
}
</script>
