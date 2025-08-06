// 在真實專案中，您會建立一個 JS 檔案來存放這些常數
// 然後在元件中用 `import { ... } from '...'` 來引入
export const HA_STATE_DEFINITIONS = {
  ST_STABLE: {
    name: '穩定狀態',
    type: 'normal',
    description: '叢集處於靜態的穩定狀態，所有服務已就緒。'
  },
  ST_INIT: {
    name: '初始化中',
    type: 'processing',
    description: '叢集服務剛啟動，節點正在讀取設定並準備加入叢集。'
  },
  ST_JOINING: {
    name: '節點加入中',
    type: 'processing',
    description: '一個節點正在加入現有的叢集，此為短暫的過渡狀態。'
  },
  ST_EXITING: {
    name: '節點退出中',
    type: 'processing',
    description: '一個節點正在退出叢集。'
  },
  ST_VARYON: {
    name: '資源上線中',
    type: 'processing',
    description: '正在啟動 (Vary On) 一個資源群組，例如開機或手動啟動服務。'
  },
  ST_VARYOFF: {
    name: '資源離線中',
    type: 'processing',
    description: '正在停止 (Vary Off) 一個資源群組。'
  },
  ST_MOVE: {
    name: '資源移動中',
    type: 'warning',
    description: '正在進行故障轉移 (Failover) 或手動移動資源。若長時間停留在此狀態，代表可能發生問題。'
  },
  ST_BARRIER: {
    name: '同步屏障',
    type: 'processing',
    description: '一個過渡狀態，叢集正在等待所有節點完成某個步驟以達到同步。'
  },
  ST_RECOVERY: {
    name: '恢復模式',
    type: 'warning',
    description: '叢集偵測到錯誤後，嘗試進入恢復模式解決問題，建議檢查日誌了解原因。'
  },
  ST_RP_FAILED: {
    name: '資源群組錯誤',
    type: 'danger',
    description: '一個事件腳本執行失敗，資源群組處於錯誤狀態，需要立即檢查！'
  },
  ST_UNSTABLE: {
    name: '不穩定狀態',
    type: 'danger',
    description: '叢集處於不穩定狀態，可能發生網路分區或嚴重問題，需要立即調查。'
  },
  EVENT_ERROR: {
    name: '事件錯誤',
    type: 'danger',
    description: '一個重要的叢集事件執行失敗，請立即檢查 clstrmgr.out 和 hacmp.out 日誌。'
  },
  CONFIG_TOO_SMALL: {
    name: '配置空間不足',
    type: 'danger',
    description: '叢集配置所需的空間不足，可能導致操作失敗。'
  }
  // 您未來可以依需求在此處新增更多狀態定義
}

export const REPORT_FIELDS = [
  { key: 'result', label: '檢測', sortable: true, thStyle: { width: '15px', textAlign: 'center' } },
  { key: 'item', label: '項目', sortable: true, thStyle: { width: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } },
  { key: 'p8_51', label: '節點51', sortable: false, thStyle: { width: '40%' } },
  { key: 'p8_52', label: '節點52', sortable: false, thStyle: { width: '40%' } }
]

export const BRIEF_REPORT_FIELDS = [
  { key: 'item', label: '項目', sortable: true, thStyle: { width: '20%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } },
  { key: 'p8_51', label: '節點51', thStyle: { width: '40%' } },
  { key: 'p8_52', label: '節點52', thStyle: { width: '40%' } }
]
