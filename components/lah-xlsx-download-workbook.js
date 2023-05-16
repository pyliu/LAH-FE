import { format } from 'date-fns'
// Require tw locale
import { zhTW } from 'date-fns/locale'
// https://www.npmjs.com/package/xlsx
import * as XLSX from 'xlsx'
export default class Workbook {
  constructor () {
    // Singleton
    if (!(this instanceof Workbook)) {
      return new Workbook()
    }
    // SheetNames 與 Sheets 兩者在 Workbook 中不可或缺，此為 XLSX 工具將 Workbook Object 傳為 Excel blob 時提取資料的位置。
    this.SheetNames = [] // 儲存 Sheet 的名稱。
    this.Sheets = {} // 儲存 Sheet 的物件內容
    this.wopts = {
      bookType: 'xlsx',
      bookSST: false,
      type: 'binary'
    }
  }

  /**
   * 塞入 Sheet
   */
  appendSheet (sheet, sheetName = format(new Date(), 'yyyy-LL-dd-HH-mm-ss', { locale: zhTW })) {
    this.SheetNames = [...this.SheetNames, sheetName]
    this.Sheets[sheetName] = sheet
  }

  toBlob (option = this.wopts) {
    // 字串轉 ArrayBuffer
    function s2ab (s) {
      const buf = new ArrayBuffer(s.length)
      const view = new Uint8Array(buf)
      for (let i = 0; i !== s.length; ++i) { view[i] = s.charCodeAt(i) & 0xFF }
      return buf
    }

    const wbout = XLSX.write(this, option)
    const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' })

    return blob
  }

  isEmpty () {
    return !this.SheetNames.length && JSON.stringify(this.Sheets === '{}')
  }
}
