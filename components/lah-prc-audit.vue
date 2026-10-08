<template>
  <div class="lah-prc-audit-wrapper">
    <div id="tool-audit-view" class="ui-frame au-root">
      <div class="ui-head">
        <div>
          <h2>買賣實例檢核</h2>
          <span class="sub">版本：v2.4（115.10.08）｜規則逐條管理、人工註記、檢核參數可調整</span>
        </div>
      </div>
      <div class="au-tabs" role="tablist">
        <button class="au-tab on" data-tab="run" role="tab">
          檢核作業
        </button>
        <button class="au-tab" data-tab="rules" role="tab">
          檢核項目與參數<span id="auTabDirty" class="au-dot au-hide" title="設定已變更，尚未套用" />
        </button>
      </div>

      <div id="auBody" class="au-body">
        <!-- ========== 頁面一：檢核作業 ========== -->
        <section id="auPageRun">
          <div id="auDirtyRun" class="au-banner au-hide">
            <span>⚠ 檢核設定已變更但尚未套用，目前結果仍依原設定產生。</span>
            <button class="au-btn" data-goto="rules">
              前往套用
            </button>
          </div>

          <div class="au-card">
            <div class="au-card-h">
              <span class="n">1</span>上傳資料與統計
            </div>
            <div class="au-card-b">
              <div class="au-uprow">
                <div class="au-upf">
                  <label class="au-label">作業年期</label>
                  <input id="auditTargetYear" type="number" class="au-input au-w-year">
                </div>
                <div class="au-upf">
                  <label class="au-label">移轉年月篩選區間 <span class="au-muted">（次年現值作業，預設當年度＋1）</span></label>
                  <div class="au-hintbox">
                    <b id="auditDateRangeHint">載入中...</b>
                  </div>
                </div>
                <div class="au-upf au-grow">
                  <label class="au-label">資料檔 <span class="au-muted">（可多檔選取；區間外資料只計入案件量，不逐筆檢核）</span></label>
                  <input id="auditFileInput" type="file" accept=".xlsx, .xls" multiple class="au-file">
                </div>
                <div class="au-upf">
                  <button id="runAuditBtn" class="au-btn au-primary au-run">
                    開始檢核
                  </button>
                </div>
              </div>
              <div id="auStats" class="au-stats" />
              <div id="auNumBox" />
              <div id="audit-log" class="au-log au-hide" />
            </div>
          </div>

          <div class="au-card">
            <div class="au-card-h">
              <span class="n">2</span>檢核結果 <span id="auAnnoSummary" class="au-headnote" />
            </div>
            <div class="au-filters">
              <label class="au-fl">調查人員 <select id="auFOfficer" class="au-input" /></label>
              <label class="au-fl">檢核分組 <select id="auFGroup" class="au-input" /></label>
              <label class="au-fl">規則代碼 <select id="auFRule" class="au-input au-w-rule" /></label>
              <label class="au-fl">判定狀態
                <select id="auFStatus" class="au-input">
                  <option value="">全部</option><option value="pending">待確認</option><option value="bad">有問題</option><option value="ok">無問題</option>
                </select>
              </label>
              <input id="auFKw" class="au-input au-w-kw" placeholder="搜尋編號、門牌、說明、備註">
              <button id="auFClear" class="au-btn">
                清除篩選
              </button>
              <span id="auFCount" class="au-count" />
            </div>
            <div class="au-filters au-filters-2">
              <span class="au-muted">本頁批次：</span>
              <button id="auBulkBad" class="au-btn">
                本頁全部設為有問題
              </button>
              <button id="auBulkReset" class="au-btn">
                本頁全部回復待確認
              </button>
              <span class="au-muted au-ml-auto">點欄位標頭可排序（實例編號、調查人員、標的、規則代碼）</span>
            </div>
            <div class="au-tablewrap au-tablewrap-results">
              <table id="auResultTable" class="au-table" />
            </div>
            <div id="auPager" class="au-pager" />
          </div>

          <div class="au-card">
            <div class="au-card-h">
              <span class="n">3</span>匯出與註記管理
            </div>
            <div class="au-card-b">
              <div class="au-actions">
                <button id="auExportXlsx" class="au-btn au-dl">
                  匯出全部案件清冊（Excel）
                </button>
                <button id="auExportAnno" class="au-btn">
                  匯出目前註記（JSON）
                </button>
                <button id="auImportAnnoBtn" class="au-btn">
                  匯入註記
                </button>
                <input id="auImportAnno" type="file" accept=".json,application/json" class="au-hide">
                <button id="auClearAnno" class="au-btn au-danger">
                  清除本機註記
                </button>
              </div>
              <p id="auStorageNote" class="au-muted au-mt" />
            </div>
          </div>
        </section>

        <!-- ========== 頁面二：檢核項目與參數 ========== -->
        <section id="auPageRules" class="au-hide">
          <div id="auDirtyBar" class="au-banner au-sticky au-hide">
            <span>⚠ 設定已變更，按「套用並重新檢核」後才會生效。</span>
            <button class="au-btn au-primary" data-act="apply">
              套用並重新檢核
            </button>
          </div>
          <div id="auAppliedMsg" class="au-banner au-ok au-hide" />

          <div class="au-card">
            <div class="au-card-h">
              <span class="n">1</span>檢核項目 <span id="auRuleCount" class="au-headnote" />
            </div>
            <div class="au-filters">
              <div id="auMsGroup" class="au-ms" />
              <div id="auMsField" class="au-ms" />
              <input id="auRuleKw" class="au-input au-w-kw" placeholder="關鍵字（代碼、名稱、條件、欄位）">
              <button id="auRuleClear" class="au-btn">
                清除篩選
              </button>
              <span class="au-ml-auto" />
              <button id="auRuleOn" class="au-btn">
                本頁全部啟用
              </button>
              <button id="auRuleOff" class="au-btn">
                本頁全部停用
              </button>
            </div>
            <div id="auRuleTable" class="au-rulelist" />
          </div>

          <div class="au-card">
            <div class="au-card-h">
              <span class="n">2</span>檢核參數
            </div>
            <div id="auParams" />
            <div class="au-card-b au-actions au-bt">
              <button class="au-btn au-primary" data-act="apply">
                套用並重新檢核
              </button>
              <button id="auExportCfg" class="au-btn">
                匯出參數設定
              </button>
              <button id="auImportCfgBtn" class="au-btn">
                匯入參數設定
              </button>
              <input id="auImportCfg" type="file" accept=".json,application/json" class="au-hide">
              <button id="auResetCfg" class="au-btn au-danger">
                還原預設值
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
    <!-- ===== 功能C：買賣實例檢核 結束 (HTML 畫面區) ===== -->

    <!-- ===== 功能E：10日檢核 開始 (HTML 畫面區) ===== -->
    <!-- 115.10.08 由獨立版「實價登錄申報資料檢核工具」整合；規則、參數與匯出格式不變 -->
  </div>
</template>

<script>
/* eslint-disable */
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

const AuditEngine = (function () {
    const LS_ANNO = 'landAudit.annotations.v1';
    const LS_CFG = 'landAudit.config.v1';
    const PAGE_SIZE = 100;
    const OFFICER_COL = 55;   // 調查人員固定在原檔 BD 欄（A=0）
    const ID_FIELD = '買賣實例編號';

    const $ = id => document.getElementById(id);
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const clone = o => JSON.parse(JSON.stringify(o));
    const splitList = t => String(t || '').split(/[,，、;；\n\r]+/).map(s => s.trim()).filter(Boolean);
    const fmtN = v => (typeof v === 'number' ? v.toLocaleString('zh-TW') : v);
    const stamp = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear() - 1911}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`; };
    const collator = new Intl.Collator('zh-Hant-TW', { numeric: true });
    const isBlank = v => v === '' || v === null || v === undefined;

    let storageOK = true;
    const lsGet = k => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { storageOK = false; return null; } };
    const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { storageOK = false; renderStorageNote(); return false; } };
    const lsDel = k => { try { localStorage.removeItem(k); } catch (e) { } };

    const GROUPS = {
        basic: '1 基礎欄位與數值', floorCat: '2 樓層用途與類別', addressMatch: '3 門牌臨街與宗地', price: '4 建物單價區間',
        durability: '5 耐用年數與折舊', profit: '6 工期與利潤率', date: '7 勘查日期', deco: '8 裝潢費與現值', caseNo: '9 實例編號與案件量'
    };
    const ST_LABEL = { pending: '待確認', bad: '有問題', ok: '無問題' };

    // ---------- 參數：可在畫面調整者（建物單價、工期利潤率） ----------
    const EDITABLE = ['priceTable', 'profitTable'];
    const DEFAULT_PARAMS = {
        priceTable: [
            { name: '鋼骨鋼筋混凝土造', keywords: ['鋼骨鋼筋混凝土', '鋼骨混凝土'], exclude: [], bands: [{ maxFloor: 5, min: 23800, max: 48600 }, { maxFloor: 10, min: 27700, max: 53800 }, { maxFloor: 15, min: 31700, max: 59800 }, { maxFloor: 20, min: 35600, max: 65900 }, { maxFloor: 30, min: 40900, max: 74600 }, { maxFloor: 999, min: 46200, max: 79000 }] },
            { name: '鋼骨造', keywords: ['鋼骨造'], exclude: [], bands: [{ maxFloor: 5, min: 26400, max: 51000 }, { maxFloor: 10, min: 29000, max: 56500 }, { maxFloor: 15, min: 33000, max: 62800 }, { maxFloor: 20, min: 37000, max: 69200 }, { maxFloor: 30, min: 43600, max: 78300 }, { maxFloor: 999, min: 48800, max: 83000 }] },
            { name: '鋼筋混凝土造', keywords: ['鋼筋混凝土', '預鑄'], exclude: [], bands: [{ maxFloor: 5, min: 18300, max: 39600 }, { maxFloor: 10, min: 23800, max: 44800 }, { maxFloor: 15, min: 27700, max: 50800 }, { maxFloor: 20, min: 31700, max: 56900 }, { maxFloor: 999, min: 37000, max: 65600 }] },
            { name: '加強磚造', keywords: ['加強磚造'], exclude: [], bands: [{ maxFloor: 999, min: 12000, max: 29000 }] },
            { name: '重／中量鋼架造', keywords: ['重量鋼架', '中量鋼架', '鋼架'], exclude: ['輕'], bands: [{ maxFloor: 999, min: 14000, max: 25000 }] },
            { name: '輕量鋼架造', keywords: ['輕量鋼架', '輕鋼架'], exclude: [], bands: [{ maxFloor: 999, min: 10600, max: 14500 }] },
            { name: '木造', keywords: ['木造'], exclude: [], bands: [{ maxFloor: 999, min: 6600, max: 24300 }] },
            { name: '磚造／石造', keywords: ['磚造', '石造'], exclude: [], bands: [{ maxFloor: 999, min: 7900, max: 18700 }] },
            { name: '竹造', keywords: ['竹造'], exclude: [], bands: [{ maxFloor: 999, min: 5300, max: 12500 }] },
            { name: '土造', keywords: ['土造', '土磚混合'], exclude: [], bands: [{ maxFloor: 999, min: 5900, max: 14000 }] }
        ],
        profitTable: [
            { maxMonths: 12, min: 8, max: 18 }, { maxMonths: 24, min: 8, max: 20 }, { maxMonths: 36, min: 11, max: 21 },
            { maxMonths: 48, min: 13, max: 23 }, { maxMonths: 9999, min: 14, max: 24 }
        ]
    };

    // ---------- 固定設定（不開放調整） ----------
    const FIX = {
        townhouseCategory: 6, townhouseKeyword: '透天',
        requiredFields: ['鄉鎮市區', '年期', '登記收件字號', '義務人', '義務人地址', '權利人', '權利人地址', '移轉年月', '移轉原因', '資料來源', '買賣略圖', '建號母號', '建號子號', '建築物登記面積', '構造種類', '建物用途', '移轉樓層建物面積', '每年折舊率', '總折舊率', '調查人員', '臨街狀況-街道名稱', '宗地條件(形狀)', '交易案類別', '總樓層數樓上', '總樓層數樓下'],
        requiredFieldsNonTownhouse: ['移轉地上層數', '移轉地下層數'],
        positiveFields: ['買賣實例總價', '(修正後)正常買賣總價格', '全棟房地可出售總價格', '建物單價', '(修正後)正常買賣單價', '土地正常買賣單價', '全棟建物重建價格', '全棟建物現值', '全棟建物現值_1', '全棟建物買賣正常利潤', '土地可出售(正常買賣)總價格', '臨街狀況-路寬', '基地面積'],
        apartmentMaxFloor: 5, mansionMaxFloor: 10, towerMinFloor: 11,
        correctionNoneFields: ['修正理由', '買賣實例修正情況', '買賣實例修正說明'],
        durabilityTable: [
            { keywords: ['鋼筋混凝土', '預鑄', '鋼骨'], years: 60 }, { keywords: ['加強磚造'], years: 50 }, { keywords: ['鋼架'], years: 35 },
            { keywords: ['磚造', '石造'], years: 40 }, { keywords: ['木造'], years: 25 }, { keywords: ['土造'], years: 20 }, { keywords: ['竹造'], years: 10 }
        ],
        durabilityReasonKeywords: ['原耐用年數為', '調整經濟耐用年數為'],
        brickDepreciation: { 60: 1.58, 55: 1.73 },
        surveyDeadline: '0930'
    };

    // ---------- 輔助 ----------
    const present = m => !!m && m !== '0';
    function normText(str) {
        if (!str) return '';
        return str.replace(/\s+/g, '').replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
            .replace(/[一二三四五六七八九]/g, s => '123456789'['一二三四五六七八九'.indexOf(s)]);
    }
    function kwMatch(text, kws, excl) {
        const k = (kws || []).filter(Boolean), x = (excl || []).filter(Boolean);
        return k.some(w => text.includes(w)) && !x.some(w => text.includes(w));
    }
    function matchPrice(type, floor, P) {
        for (const t of P.priceTable) {
            if (kwMatch(type, t.keywords, t.exclude)) {
                const bands = [...t.bands].sort((a, b) => a.maxFloor - b.maxFloor);
                const b = bands.find(x => floor <= x.maxFloor) || bands[bands.length - 1];
                return b ? { t, b } : null;
            }
        }
        return null;
    }
    function stdDurability(type) { for (const t of FIX.durabilityTable) if (kwMatch(type, t.keywords)) return t; return null; }
    const buildMonths = (fA, fB) => (fA > 5) ? (fA + 9) + (fB * 2) : 4 + (fA * 2) + (fB * 2);

    function makeCtx(rec, P, targetYear) {
        const row = rec.data;
        const n = f => { const v = row[f]; if (!v) return 0; return parseFloat(String(v).replace(/,/g, '')) || 0; };
        const s = f => (row[f] ?? '').toString().trim();
        const cat = n('買賣實例類別'), usage = s('房屋用途');
        const isTown = cat === FIX.townhouseCategory || usage.includes(FIX.townhouseKeyword);
        const floorField = s('房屋資料(移轉層次)') ? '房屋資料(移轉層次)' : (s('移轉層次') ? '移轉層次' : '房屋資料(移轉層次)');
        const tFloor = parseInt(s(floorField).replace(/\D/g, '')) || 0;
        let apField = '', ap = '';
        Object.keys(row).forEach(k => { if (k.includes('修正理由') && (k.includes('AL') || k.includes('AO') || k.includes('_1'))) { apField = k; ap = String(row[k]).trim(); } });
        if (!ap) { apField = '耐用年數修正理由'; ap = s(apField); }
        return { rec, row, P, n, s, cat, usage, isTown, floorField, tFloor, apField, ap, targetYear };
    }

    // ---------- 規則 ----------
    const TOWN_NOTE = '透天厝（買賣實例類別為 6，或房屋用途含「透天」）免驗。';
    const RULES = [
        // 1 基礎欄位
        { code: 'B01', group: 'basic', name: '必填欄位不可空白', fields: [...FIX.requiredFields, ...FIX.requiredFieldsNonTownhouse],
          cond: '比對欄位所列必填欄位皆不得空白；其中「移轉地上層數」「移轉地下層數」僅非透天厝須填。', note: '透天厝（買賣實例類別為 6，或房屋用途含「透天」）免驗移轉地上／地下層數。', params: [],
          check: c => { const req = [...FIX.requiredFields, ...(c.isTown ? [] : FIX.requiredFieldsNonTownhouse)]; const miss = req.filter(f => !c.s(f)); return miss.length ? { msg: `缺漏 ${miss.length} 個必填欄位：${miss.join('、')}`, cells: miss } : null; } },
        { code: 'B02', group: 'basic', name: '價格與面積數值須大於 0', fields: FIX.positiveFields,
          cond: '比對欄位所列總價、單價、重建價格、現值、路寬、基地面積等，數值不可 ≤ 0（空白視為 0）。', note: '', params: [],
          check: c => { const bad = FIX.positiveFields.filter(f => c.n(f) <= 0); return bad.length ? { msg: `下列欄位須大於 0：${bad.join('、')}`, cells: bad } : null; } },
        { code: 'B03', group: 'basic', name: '全棟建物折舊額不可為負', fields: ['全棟建物折舊額'], cond: '全棟建物折舊額 < 0 即為異常。', note: '', params: [],
          check: c => c.n('全棟建物折舊額') < 0 ? { msg: '全棟建物折舊額不可小於 0', cells: ['全棟建物折舊額'] } : null },
        { code: 'B04', group: 'basic', name: '區段號 1 不可空白', fields: ['區段號母號1', '區段號子號1'], cond: '區段號母號1、區段號子號1 須皆有值。', note: '', params: [],
          check: c => { const miss = ['區段號母號1', '區段號子號1'].filter(f => !c.s(f)); return miss.length ? { msg: '主區段號（區段號1）不可空白', cells: miss } : null; } },
        { code: 'B05', group: 'basic', name: '跨地號區段地價 1 須大於 0', fields: ['跨地號區段地價1'], cond: '跨地號區段地價1 ≤ 0 即為異常。', note: '', params: [],
          check: c => c.n('跨地號區段地價1') <= 0 ? { msg: '跨地號區段地價1 須大於 0', cells: ['跨地號區段地價1'] } : null },
        { code: 'B06', group: 'basic', name: '跨區段號與區段地價連動', fields: ['區段號母號2', '跨地號區段地價2', '區段號母號3', '跨地號區段地價3'],
          cond: '有區段號母號2／3（非空且非 0）時，對應跨地號區段地價須 > 0；無區段號時，地價應為 0。', note: '', params: [],
          check: c => { const msgs = [], cells = []; [2, 3].forEach(i => { const m = c.s('區段號母號' + i), v = c.n('跨地號區段地價' + i);
              if (present(m) && v <= 0) { msgs.push(`有區段${i}，地價${i}須大於 0`); cells.push('區段號母號' + i, '跨地號區段地價' + i); }
              else if (!present(m) && v > 0) { msgs.push(`無區段${i}，地價${i}應為 0`); cells.push('區段號母號' + i, '跨地號區段地價' + i); } });
              return msgs.length ? { msg: msgs.join('；'), cells } : null; } },
        { code: 'B07', group: 'basic', name: '跨區段案件備註不可空白', fields: ['區段號母號2', '區段號母號3', '備註'], cond: '有區段號母號2 或 3 時，備註欄不可空白。', note: '', params: [],
          check: c => { const m2 = c.s('區段號母號2'), m3 = c.s('區段號母號3'); return ((present(m2) || present(m3)) && !c.s('備註')) ? { msg: '跨區段案件，備註不可空白', cells: ['備註', ...(present(m2) ? ['區段號母號2'] : []), ...(present(m3) ? ['區段號母號3'] : [])] } : null; } },
        { code: 'B08', group: 'basic', name: '跨區段備註格式', fields: ['備註', '區段號母號1', '區段號子號1', '跨地號區段地價1', '區段號母號2', '區段號子號2', '跨地號區段地價2', '區段號母號3', '區段號子號3', '跨地號區段地價3'],
          cond: '跨區段且有填備註時，備註須含「宗地平均公告現值=」，並含各區段「母號子號區段號:」及「=跨地號地價」。', note: '標準格式：宗地平均公告現值=0000，區段號:(0000×區段現值÷0000)=跨地號地價。比對時忽略空白。', params: [],
          check: c => {
              const m2 = c.s('區段號母號2'), m3 = c.s('區段號母號3'), v2 = c.n('跨地號區段地價2'), v3 = c.n('跨地號區段地價3'), rk = c.s('備註');
              const has2 = present(m2) && v2 > 0, has3 = present(m3) && v3 > 0;
              if (!(has2 || has3) || !rk) return null;
              const t = rk.replace(/\s+/g, '');
              const okB = t.includes('宗地平均公告現值=');
              const ok1 = t.includes(`${c.s('區段號母號1')}${c.s('區段號子號1')}區段號:`) && t.includes(`=${c.n('跨地號區段地價1')}`);
              const ok2 = !has2 || (t.includes(`${m2}${c.s('區段號子號2')}區段號:`) && t.includes(`=${v2}`));
              const ok3 = !has3 || (t.includes(`${m3}${c.s('區段號子號3')}區段號:`) && t.includes(`=${v3}`));
              if (okB && ok1 && ok2 && ok3) return null;
              const miss = [!okB && '缺「宗地平均公告現值=」', !ok1 && '區段1 對應文字不符', !ok2 && '區段2 對應文字不符', !ok3 && '區段3 對應文字不符'].filter(Boolean);
              return { msg: `備註格式不符（${miss.join('、')}）`, cells: ['備註'] };
          } },
        { code: 'B09', group: 'basic', name: '建築物登記面積應等於移轉樓層建物面積', fields: ['建築物登記面積', '移轉樓層建物面積'],
          cond: '兩欄皆有值時，建築物登記面積須等於移轉樓層建物面積（比對至小數第 2 位）。', note: '任一欄空白時由 B01 列出，本條不重複。', params: [],
          check: c => { if (!c.s('建築物登記面積') || !c.s('移轉樓層建物面積')) return null; const a = c.n('建築物登記面積'), b = c.n('移轉樓層建物面積');
              return Math.abs(a - b) < 0.005 ? null : { msg: `建築物登記面積 ${a} ≠ 移轉樓層建物面積 ${b}（差 ${Math.round((a - b) * 100) / 100}）`, cells: ['建築物登記面積', '移轉樓層建物面積'] }; } },
        // 2 樓層用途
        { code: 'F01', group: 'floorCat', name: '總樓層不可小於移轉層次', fields: ['總樓層數樓上', '房屋資料(移轉層次)'], cond: '非透天厝且移轉層次 > 0 時，總樓層數樓上須 ≥ 移轉層次。', note: '移轉層次取「房屋資料(移轉層次)」，無此欄時取「移轉層次」，僅擷取數字。', params: [],
          check: c => (!c.isTown && c.tFloor > 0 && c.n('總樓層數樓上') < c.tFloor) ? { msg: `總樓層 ${c.n('總樓層數樓上')} 小於移轉層次 ${c.tFloor}`, cells: ['總樓層數樓上', c.floorField] } : null },
        { code: 'F02', group: 'floorCat', name: '移轉地上／地下層數不可大於移轉層次', fields: ['移轉地上層數', '移轉地下層數', '房屋資料(移轉層次)'], cond: '非透天厝且移轉層次 > 0 時，移轉地上層數、移轉地下層數皆不可大於移轉層次。', note: TOWN_NOTE, params: [],
          check: c => { if (c.isTown || c.tFloor <= 0) return null; const bad = ['移轉地上層數', '移轉地下層數'].filter(f => c.n(f) > c.tFloor); return bad.length ? { msg: `${bad.join('、')} 大於移轉層次 ${c.tFloor}`, cells: [...bad, c.floorField] } : null; } },
        { code: 'F03', group: 'floorCat', name: '房屋用途與總樓層數相符', fields: ['房屋用途', '總樓層數樓上'], cond: `非透天厝：公寓總樓層 ≤ ${FIX.apartmentMaxFloor} 層；華廈 ≤ ${FIX.mansionMaxFloor} 層；大樓 ≥ ${FIX.towerMinFloor} 層。`, note: TOWN_NOTE, params: [],
          check: c => { if (c.isTown) return null; const f = c.n('總樓層數樓上'), u = c.usage; let m = '';
              if (u.includes('公寓') && f > FIX.apartmentMaxFloor) m = `公寓應 ≤ ${FIX.apartmentMaxFloor} 層（實際 ${f} 層）`;
              else if (u.includes('華廈') && f > FIX.mansionMaxFloor) m = `華廈應 ≤ ${FIX.mansionMaxFloor} 層（實際 ${f} 層）`;
              else if (u.includes('大樓') && f < FIX.towerMinFloor) m = `大樓應 ≥ ${FIX.towerMinFloor} 層（實際 ${f} 層）`;
              return m ? { msg: m, cells: ['房屋用途', '總樓層數樓上'] } : null; } },
        { code: 'F04', group: 'floorCat', name: '類別 5 移轉範圍應為 0', fields: ['買賣實例類別', '移轉範圍'], cond: '買賣實例類別 = 5 時，移轉範圍須為 0。', note: '', params: [],
          check: c => (c.cat === 5 && c.n('移轉範圍') !== 0) ? { msg: '類別 5 之移轉範圍應為 0', cells: ['買賣實例類別', '移轉範圍'] } : null },
        { code: 'F05', group: 'floorCat', name: '類別 6（透天）移轉範圍與門牌', fields: ['買賣實例類別', '移轉範圍', '建築改良物門牌'], cond: '買賣實例類別 = 6 時，移轉範圍須為 1，且門牌不應含「樓」。', note: '', params: [],
          check: c => { if (c.cat !== 6) return null; const msgs = [], cells = ['買賣實例類別'];
              if (c.n('移轉範圍') !== 1) { msgs.push('移轉範圍應為 1'); cells.push('移轉範圍'); }
              if (c.s('建築改良物門牌').includes('樓')) { msgs.push('門牌不應有「樓」'); cells.push('建築改良物門牌'); }
              return msgs.length ? { msg: '類別 6：' + msgs.join('；'), cells } : null; } },
        { code: 'F06', group: 'floorCat', name: '修正理由／情況／說明限填「無」或空白', fields: FIX.correctionNoneFields, cond: '比對欄位所列欄位只能空白或填「無」。', note: '', params: [],
          check: c => { const bad = FIX.correctionNoneFields.filter(f => c.s(f) && c.s(f) !== '無'); return bad.length ? { msg: `${bad.join('、')} 限填「無」或空白`, cells: bad } : null; } },
        // 3 門牌臨街
        { code: 'A01', group: 'addressMatch', name: '門牌須含臨街街道名稱', fields: ['建築改良物門牌', '臨街狀況-街道名稱'], cond: '門牌與臨街街道名稱皆有值時，門牌須包含街道名稱（取至「段／路／街／巷」）。', note: '比對前會去除空白、全形數字轉半形、國字一～九轉數字。', params: [],
          check: c => { const street = c.s('臨街狀況-街道名稱'), addr = c.s('建築改良物門牌'); if (!street || !addr) return null;
              const nA = normText(addr), nS = normText(street), m = nS.match(/^.*[段路街巷]/);
              return nA.includes(m ? m[0] : nS) ? null : { msg: '門牌未包含臨街街道名稱', cells: ['建築改良物門牌', '臨街狀況-街道名稱'] }; } },
        { code: 'A02', group: 'addressMatch', name: '臨街街道有「巷」應為裡地', fields: ['臨街狀況-街道名稱', '臨街狀況-臨街關係'], cond: '街道名稱含「巷」時，臨街關係須為「裡地」。', note: '', params: [],
          check: c => { const st = c.s('臨街狀況-街道名稱'), rel = c.s('臨街狀況-臨街關係'); return (st.includes('巷') && !rel.includes('裡地')) ? { msg: `街道含「巷」，臨街關係應為「裡地」（目前：${rel || '空白'}）`, cells: ['臨街狀況-街道名稱', '臨街狀況-臨街關係'] } : null; } },
        { code: 'A03', group: 'addressMatch', name: '臨街街道無「巷」應為臨街地', fields: ['臨街狀況-街道名稱', '臨街狀況-臨街關係'], cond: '街道名稱有值且不含「巷」時，臨街關係須為「臨街地」。', note: '街道名稱空白時由 B01 列出，本條不重複。', params: [],
          check: c => { const st = c.s('臨街狀況-街道名稱'), rel = c.s('臨街狀況-臨街關係'); return (st && !st.includes('巷') && !rel.includes('臨街地')) ? { msg: `街道無「巷」，臨街關係應為「臨街地」（目前：${rel || '空白'}）`, cells: ['臨街狀況-街道名稱', '臨街狀況-臨街關係'] } : null; } },
        { code: 'A04', group: 'addressMatch', name: '不規則形狀寬深應為 0', fields: ['宗地條件(形狀)', '宗地條件(寬度)', '宗地條件(深度)'], cond: '宗地形狀含「不規則」時，寬度與深度皆應為 0。', note: '', params: [],
          check: c => (c.s('宗地條件(形狀)').includes('不規則') && (c.n('宗地條件(寬度)') !== 0 || c.n('宗地條件(深度)') !== 0)) ? { msg: '形狀不規則，寬度與深度應為 0', cells: ['宗地條件(形狀)', '宗地條件(寬度)', '宗地條件(深度)'] } : null },
        { code: 'A05', group: 'addressMatch', name: '方形宗地寬深須大於 0', fields: ['宗地條件(形狀)', '宗地條件(寬度)', '宗地條件(深度)'], cond: '宗地形狀含「方」時，寬度與深度皆須 > 0。', note: '', params: [],
          check: c => (c.s('宗地條件(形狀)').includes('方') && (c.n('宗地條件(寬度)') <= 0 || c.n('宗地條件(深度)') <= 0)) ? { msg: '形狀為方形，寬度與深度須大於 0', cells: ['宗地條件(形狀)', '宗地條件(寬度)', '宗地條件(深度)'] } : null },
        // 4 建物單價
        { code: 'P01', group: 'price', name: '建物單價須落在標準單價區間', fields: ['建物單價', '構造種類', '總樓層數樓上'],
          cond: '依構造種類與總樓層數樓上查「建物標準單價表」，單價低於下限或高於上限即為異常（不容許誤差）。', note: '構造種類依表列順序比對關鍵字，先符合者優先（鋼骨鋼筋混凝土須排在鋼筋混凝土之前）。', params: ['priceTable'],
          check: c => { const type = c.s('構造種類'); if (!type) return null; const floor = c.n('總樓層數樓上'), price = c.n('建物單價'), m = matchPrice(type, floor, c.P);
              if (!m || !(m.b.min > 0)) return null;
              return (price < m.b.min || price > m.b.max) ? { msg: `建物單價 ${fmtN(price)} 不在「${m.t.name}・${floor} 層」標準區間 ${fmtN(m.b.min)}～${fmtN(m.b.max)}`, cells: ['建物單價', '構造種類', '總樓層數樓上'] } : null; } },
        { code: 'P02', group: 'price', name: '構造種類無法對應標準單價表', fields: ['構造種類'], cond: '構造種類有值，但不符合單價表任何一列的關鍵字，因此未檢核單價。', note: '可於「建物標準單價表」補充比對關鍵字。', params: ['priceTable'],
          check: c => { const type = c.s('構造種類'); return (type && !matchPrice(type, c.n('總樓層數樓上'), c.P)) ? { msg: `構造種類「${type}」未對應標準單價表，單價未檢核`, cells: ['構造種類'] } : null; } },
        // 5 耐用年數與折舊
        { code: 'D01', group: 'durability', name: '經歷年數不可為負數', fields: ['經歷年數'], cond: '經歷年數 < 0 即為異常。', note: '', params: [],
          check: c => c.n('經歷年數') < 0 ? { msg: '經歷年數不可為負數', cells: ['經歷年數'] } : null },
        { code: 'D02', group: 'durability', name: '耐用年數不可為 0', fields: ['耐用年數'], cond: '耐用年數 = 0（含空白）即為異常。', note: '', params: [],
          check: c => c.n('耐用年數') === 0 ? { msg: '耐用年數不可為 0 或空白', cells: ['耐用年數'] } : null },
        { code: 'D03', group: 'durability', name: '經歷年數須小於耐用年數', fields: ['經歷年數', '耐用年數'], cond: '耐用年數 > 0 時，經歷年數須嚴格小於耐用年數。', note: '', params: [],
          check: c => { const am = c.n('經歷年數'), al = c.n('耐用年數'); return (al > 0 && am >= al) ? { msg: `經歷年數（${am}）須小於耐用年數（${al}）`, cells: ['經歷年數', '耐用年數'] } : null; } },
        { code: 'D04', group: 'durability', name: '耐用年數與法定不符須填修正理由', fields: ['耐用年數', '構造種類', '耐用年數修正理由'],
          cond: '耐用年數與法定耐用年數（鋼筋混凝土／預鑄／鋼骨 60、加強磚造 50、鋼架 35、磚造／石造 40、木造 25、土造 20、竹造 10）不同時，修正理由須同時含「原耐用年數為」及「調整經濟耐用年數為」。',
          note: '修正理由優先取欄名含「修正理由」且含 AL／AO／_1 之欄位（即 AP 欄），無值時取「耐用年數修正理由」。', params: [],
          check: c => { const t = stdDurability(c.s('構造種類')); if (!t) return null; const al = c.n('耐用年數'); if (al === t.years) return null;
              if (FIX.durabilityReasonKeywords.every(k => c.ap.includes(k))) return null;
              return { msg: `法定耐用 ${t.years} 年、填報 ${al} 年；修正理由須含「原耐用年數為…調整經濟耐用年數為…」`, cells: ['耐用年數', '構造種類', c.apField] }; } },
        { code: 'D05', group: 'durability', name: '加強磚造每年折舊率', fields: ['構造種類', '耐用年數', '每年折舊率'],
          cond: '構造種類為加強磚造時：耐用年數 60 年者，每年折舊率應為 1.58；耐用年數 55 年者，每年折舊率應為 1.73。', note: '比對至小數第 2 位；其他耐用年數不檢核。', params: [],
          check: c => { if (!c.s('構造種類').includes('加強磚造')) return null; const al = c.n('耐用年數'), exp = FIX.brickDepreciation[al]; if (exp === undefined) return null;
              const raw = c.s('每年折舊率'); if (raw && Math.abs(c.n('每年折舊率') - exp) < 0.005) return null;
              return { msg: `加強磚造耐用 ${al} 年，每年折舊率應為 ${exp}（目前：${raw || '空白'}）`, cells: ['構造種類', '耐用年數', '每年折舊率'] }; } },
        // 6 工期與利潤率
        { code: 'R01', group: 'profit', name: '利潤率須大於 0', fields: ['利潤率'], cond: '利潤率 ≤ 0 即為異常。', note: '', params: [],
          check: c => c.n('利潤率') <= 0 ? { msg: '利潤率不可小於或等於 0', cells: ['利潤率'] } : null },
        { code: 'R02', group: 'profit', name: '利潤理由不可空白', fields: ['利潤理由'], cond: '利潤理由須有值。', note: '', params: [],
          check: c => !c.s('利潤理由') ? { msg: '利潤理由不可空白', cells: ['利潤理由'] } : null },
        { code: 'R03', group: 'profit', name: '利潤率須落在工期對應區間', fields: ['利潤率', '總樓層數樓上', '總樓層數樓下'],
          cond: '依總樓層推算工期（月），查「工期利潤率表」，利潤率低於下限或高於上限即為異常（不容許誤差）。', note: '工期：樓上 ≤ 5 層 = 4 + 樓上×2 + 樓下×2；樓上 > 5 層 = 樓上 + 9 + 樓下×2。', params: ['profitTable'],
          check: c => { const p = c.n('利潤率'); if (p <= 0) return null; const cm = buildMonths(c.n('總樓層數樓上'), c.n('總樓層數樓下'));
              const bands = [...c.P.profitTable].sort((a, b) => a.maxMonths - b.maxMonths); const b = bands.find(x => cm <= x.maxMonths) || bands[bands.length - 1]; if (!b) return null;
              return (p < b.min || p > b.max) ? { msg: `利潤率 ${p}% 不在工期 ${cm} 個月之合理區間 ${b.min}～${b.max}%`, cells: ['利潤率', '總樓層數樓上', '總樓層數樓下'] } : null; } },
        // 7 勘查日期
        { code: 'T01', group: 'date', name: '勘查日期不可早於移轉年月', fields: ['勘查日期', '移轉年月'], cond: '勘查日期與移轉年月皆有值時，勘查日期須 ≥ 移轉年月（以數字比較）。', note: '', params: [],
          check: c => { const ed = parseInt(c.s('勘查日期')), td = parseInt(c.s('移轉年月')); return (ed && td && ed < td) ? { msg: '勘查日期早於移轉年月', cells: ['勘查日期', '移轉年月'] } : null; } },
        { code: 'T02', group: 'date', name: '勘查日期不可晚於 9 月 30 日', fields: ['勘查日期'], cond: '勘查日期須 ≤ 作業年期之 9 月 30 日。', note: '例：作業年期 116 → 截止日 1160930。', params: [],
          check: c => { const ed = parseInt(c.s('勘查日期')), lim = parseInt(`${c.targetYear}${FIX.surveyDeadline}`); return (ed && lim && ed > lim) ? { msg: `勘查日期晚於截止日 ${lim}`, cells: ['勘查日期'] } : null; } },
        // 8 裝潢費
        { code: 'C01', group: 'deco', name: '裝潢費用須大於 0', fields: ['全棟建物之裝潢設備及庭園設施等費用'], cond: '非透天厝：全棟建物之裝潢設備及庭園設施等費用須 > 0。', note: TOWN_NOTE, params: [],
          check: c => (!c.isTown && c.n('全棟建物之裝潢設備及庭園設施等費用') <= 0) ? { msg: '裝潢費不可小於或等於 0', cells: ['全棟建物之裝潢設備及庭園設施等費用'] } : null },
        { code: 'C02', group: 'deco', name: '裝潢費用不可大於全棟建物現值', fields: ['全棟建物之裝潢設備及庭園設施等費用', '全棟建物現值'], cond: '非透天厝且裝潢費 > 0 時，裝潢費須 ≤ 全棟建物現值。', note: TOWN_NOTE, params: [],
          check: c => { const d = c.n('全棟建物之裝潢設備及庭園設施等費用'); return (!c.isTown && d > 0 && d > c.n('全棟建物現值')) ? { msg: `裝潢費 ${fmtN(d)} 大於全棟建物現值 ${fmtN(c.n('全棟建物現值'))}`, cells: ['全棟建物之裝潢設備及庭園設施等費用', '全棟建物現值'] } : null; } },
        // 9 實例編號與案件量
        { code: 'N01', group: 'caseNo', dataset: true, name: '總案件量與實例編號漏號', fields: [ID_FIELD],
          cond: '統計上傳檔案內全部案件（含移轉年月區間外者），依「前綴文字＋流水號位數」分組，找出各組最小號至最大號之間缺少的編號。重號僅比對區間內案件（見 N02）。',
          note: '結果顯示於「檢核作業」頁的「總案件量與實例編號檢核」區，並匯出至 Excel「編號檢核」工作表；因漏號沒有對應的案件，不列入逐筆異常清單。', params: [], check: () => null },
        { code: 'N02', group: 'caseNo', name: '實例編號不可重複', fields: [ID_FIELD], cond: '將移轉年月在篩選區間內的案件依實例編號排序比對，同一編號出現 2 次以上即為異常（跨檔案一併比對）。', note: '區間外的資料不列入重號比對。', params: [],
          check: c => { const id = c.s(ID_FIELD), list = id && S.idIndex[id]; if (!list || list.length < 2) return null;
              const where = list.map(x => (S.multiFile ? `${x.file} ` : '') + `第 ${x.rowNo} 列`).join('、');
              return { msg: `實例編號重複出現 ${list.length} 次（${where}）`, cells: [ID_FIELD] }; } }
    ];
    const ruleOrder = Object.fromEntries(RULES.map((r, i) => [r.code, i]));

    const PARAM_META = [
        { sec: 'P01 建物單價區間', items: [
            { key: 'priceTable', label: '建物標準單價表（114 年度）', type: 'priceTable', wide: true, desc: '由上而下依序比對構造種類關鍵字；樓層上限 999 表示「以上皆適用」。單價須介於下限與上限之間，不容許誤差。' }
        ]},
        { sec: 'R03 工期與利潤率', items: [
            { key: 'profitTable', label: '工期利潤率表', type: 'profitTable', desc: '工期上限 9999 表示「以上皆適用」。利潤率須介於下限與上限之間，不容許誤差。' }
        ]}
    ];
    const PARAM_LABEL = {}; PARAM_META.forEach(s => s.items.forEach(i => { PARAM_LABEL[i.key] = i.label; }));

    // ---------- 狀態 ----------
    const S = {
        records: [], sheets: [], idIndex: {}, numbering: null, hits: [], ran: false, targetYear: null, perCase: {}, multiFile: false,
        applied: null, draft: null, anno: {},
        f: { officer: '', group: '', rule: '', status: '', kw: '' },
        sort: { key: 'case', dir: 1 }, page: 1, pageItems: [], expanded: new Set(),
        rf: { groups: new Set(), fields: new Set(), kw: '', open: new Set() }, ms: {}
    };

    function defaultCfg() { const enabled = {}; RULES.forEach(r => { enabled[r.code] = true; }); return { enabled, params: clone(DEFAULT_PARAMS) }; }
    function normalizeCfg(c) {
        const d = defaultCfg();
        if (!c || typeof c !== 'object') return d;
        if (c.enabled && typeof c.enabled === 'object') Object.keys(c.enabled).forEach(k => { if (k in d.enabled) d.enabled[k] = !!c.enabled[k]; });
        if (c.params && typeof c.params === 'object') EDITABLE.forEach(k => { if (c.params[k] !== null && c.params[k] !== undefined) d.params[k] = c.params[k]; });
        return d;
    }

    // ---------- 註記 ----------
    const getSt = key => (S.anno[key] && S.anno[key].st) || 'pending';
    const getNote = key => (S.anno[key] && S.anno[key].note) || '';
    function setSt(key, st) { const a = S.anno[key] || {}; if (st === 'pending') delete a.st; else a.st = st; a.t = Date.now(); if (!a.st && !a.note) delete S.anno[key]; else S.anno[key] = a; }
    function setNote(key, note) { const a = S.anno[key] || {}; if (note) a.note = note; else delete a.note; a.t = Date.now(); if (!a.st && !a.note) delete S.anno[key]; else S.anno[key] = a; }
    let noteTimer = null;
    const saveAnno = () => { clearTimeout(noteTimer); noteTimer = null; lsSet(LS_ANNO, S.anno); };
    const saveAnnoSoon = () => { clearTimeout(noteTimer); noteTimer = setTimeout(saveAnno, 300); };

    // ================= 初始化 =================
    function init() {
        S.applied = normalizeCfg(lsGet(LS_CFG)); S.draft = clone(S.applied); S.anno = lsGet(LS_ANNO) || {};
        initYear(); bindRunPage(); bindRulesPage();
        document.querySelectorAll('#tool-audit-view .au-tab').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
        document.getElementById('tool-audit-view').addEventListener('click', e => {
            const g = e.target.closest('[data-goto]'); if (g) { e.preventDefault(); showTab(g.dataset.goto); }
            if (e.target.closest('[data-act="apply"]')) applyConfig();
        });
        document.addEventListener('click', () => document.querySelectorAll('.au-ms-panel').forEach(p => p.classList.add('au-hide')));
        renderStats(); renderNumbering(); renderFilterOptions(); renderResults(); renderAnnoSummary();
        buildMultiSelects(); renderRuleTable(); renderParams(); updateDirty(); renderStorageNote();
    }
    function showTab(t) {
        document.querySelectorAll('#tool-audit-view .au-tab').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
        $('auPageRun').classList.toggle('au-hide', t !== 'run'); $('auPageRules').classList.toggle('au-hide', t !== 'rules');
        if (t === 'rules') { refreshMultiSelects(); renderRuleTable(); }
        $('auBody').scrollTop = 0;
    }
    function initYear() {
        const yi = $('auditTargetYear'), hint = $('auditDateRangeHint');
        yi.value = new Date().getFullYear() - 1911 + 1;
        const upd = () => { const y = parseInt(yi.value); if (!y || y < 100) { hint.innerText = '請輸入有效的年期'; hint.style.color = '#a4161a'; return; } hint.innerText = `${y - 2}0902 ～ ${y - 1}0901`; hint.style.color = ''; };
        upd(); yi.addEventListener('input', upd);
    }
    function log(msg, reset) { const el = $('audit-log'); el.classList.remove('au-hide'); if (reset) el.innerText = ''; el.innerText += `> ${msg}\n`; el.scrollTop = el.scrollHeight; }

    // ================= 讀檔：逐格保留原始資料 =================
    function readSheet(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => {
                try {
                    const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array', cellNF: true, cellStyles: true });
                    const sheetName = wb.SheetNames[0], ws = wb.Sheets[sheetName];
                    if (!ws || !ws['!ref']) { resolve({ file: file.name, sheetName, headerCells: [], headers: [], keys: [], rows: [], cols: [] }); return; }
                    const R = XLSX.utils.decode_range(ws['!ref']);
                    const pick = cell => cell ? { v: cell.v, t: cell.t, z: cell.z, w: cell.w } : null;
                    const headerCells = [], headers = [];
                    for (let c = R.s.c; c <= R.e.c; c++) { const cell = ws[XLSX.utils.encode_cell({ r: R.s.r, c })]; headerCells.push(pick(cell)); headers.push(cell ? String(cell.w ?? cell.v ?? '') : ''); }
                    // 與 SheetJS 相同的重複標題命名（重複者加 _1、_2），供規則比對；輸出時仍寫回原始標題
                    const keys = [], used = {};
                    headers.forEach(h => { let k = h, n = 0; while (used[k]) k = h + '_' + (++n); used[k] = 1; keys.push(k); });
                    const rows = [];
                    for (let r = R.s.r + 1; r <= R.e.r; r++) {
                        const cells = [], obj = {}; let any = false;
                        for (let c = R.s.c; c <= R.e.c; c++) {
                            const cell = ws[XLSX.utils.encode_cell({ r, c })], i = c - R.s.c;
                            cells.push(pick(cell));
                            const v = cell ? (cell.t === 'e' ? (cell.w ?? '') : cell.v) : '';
                            obj[keys[i]] = (v === undefined || v === null) ? '' : v;
                            if (!isBlank(obj[keys[i]])) any = true;
                        }
                        if (any) rows.push({ cells, obj, rowNo: r + 1 });
                    }
                    const cols = (ws['!cols'] || []).slice(R.s.c, R.e.c + 1).map(c => c ? (c.wch || (c.wpx ? c.wpx / 7 : null)) : null);
                    // 調查人員：優先取 BD 欄；BD 欄標題不含「調查」時，改找標題含「調查人員」之欄，都沒有才仍用 BD 欄
                    const bdIdx = OFFICER_COL - R.s.c;
                    let oIdx = (bdIdx >= 0 && bdIdx < keys.length) ? bdIdx : -1;
                    if (oIdx < 0 || !headers[oIdx].includes('調查')) { const alt = headers.findIndex(h => h.replace(/\s+/g, '').includes('調查人員')); if (alt >= 0) oIdx = alt; }
                    const officerKey = oIdx >= 0 ? keys[oIdx] : null;
                    if (officerKey && officerKey !== '調查人員' && !keys.includes('調查人員')) rows.forEach(r => { r.obj['調查人員'] = r.obj[officerKey]; });
                    resolve({ file: file.name, sheetName, headerCells, headers, keys, rows, cols, officerKey, officerHeader: oIdx >= 0 ? headers[oIdx] : '', officerCol: oIdx >= 0 ? XLSX.utils.encode_col(oIdx + R.s.c) : '' });
                } catch (err) { reject(new Error(`無法解析「${file.name}」：${err.message}`)); }
            };
            reader.onerror = () => reject(new Error(`無法讀取「${file.name}」`));
            reader.readAsArrayBuffer(file);
        });
    }

    async function processFiles() {
        const files = $('auditFileInput').files, y = parseInt($('auditTargetYear').value);
        if (!y || y < 100) { alert('請確認作業年期！'); return; }
        if (!files.length) { alert('請選擇 Excel 檔案！'); return; }
        const btn = $('runAuditBtn'); btn.disabled = true; btn.textContent = '檢核中…';
        try {
            const lo = parseInt(`${y - 2}0902`), hi = parseInt(`${y - 1}0901`);
            log(`啟動檢核引擎（作業年期 ${y}，移轉年月 ${lo}～${hi}）`, true);
            const sheets = [], recs = [], idIndex = {}, allIds = new Set();
            let total = 0, outRange = 0, noId = 0;
            for (const file of files) {
                const sh = await readSheet(file); sheets.push(sh);
                if (!sh.keys.includes(ID_FIELD)) log(`⚠ [${file.name}] 找不到「${ID_FIELD}」欄位，無法做編號檢核`);
                log(sh.officerKey ? `[${file.name}] 調查人員取自 ${sh.officerCol} 欄「${sh.officerHeader}」` : `⚠ [${file.name}] 找不到調查人員欄位（BD 欄不存在）`);
                let kept = 0;
                sh.rows.forEach(row => {
                    total++;
                    const id = String(row.obj[ID_FIELD] ?? '').trim();
                    if (id) allIds.add(id); else noId++;
                    const raw = String(row.obj['移轉年月'] || '').trim(), d = parseInt(raw);
                    if (!raw || !(d >= lo && d <= hi)) { outRange++; return; }
                    if (id) (idIndex[id] || (idIndex[id] = [])).push({ file: file.name, rowNo: row.rowNo });   // 重號只比對區間內案件
                    const oRaw = String((sh.officerKey ? row.obj[sh.officerKey] : '') ?? '').trim();
                    recs.push({
                        data: row.obj, cells: row.cells, sheet: sh, file: file.name, rowNo: row.rowNo, seq: recs.length + 1,
                        caseId: id || '（無編號）', caseKey: id || `${file.name}#${row.rowNo}`,
                        target: String(row.obj['建築改良物門牌'] || '').trim() || String(row.obj['鄉鎮市區'] || '').trim(),
                        officer: oRaw.replace(/^[A-Za-z0-9_-]+/, '').trim() || oRaw || '（未填）'   // 「A01王小明」顯示王小明；只有代號時保留代號
                    });
                    kept++;
                });
                log(`[${file.name}] 共 ${sh.rows.length} 筆，移轉年月在區間內 ${kept} 筆`);
            }
            S.sheets = sheets; S.idIndex = idIndex; S.multiFile = files.length > 1; S.targetYear = y;
            S.numbering = computeNumbering([...allIds], { total, inRange: recs.length, outRange, noId });
            S.records = recs;
            if (!recs.length) { S.ran = false; S.hits = []; refreshRunPage(); alert('無符合移轉區間之資料！'); return; }
            runChecks(); refreshRunPage();
            log(`檢核完畢：區間內 ${recs.length} 筆，異常 ${recs.filter(r => r.hits.length).length} 筆，命中規則 ${S.hits.length} 列；漏號 ${S.numbering.missingCount} 個、重號 ${S.numbering.dups.length} 個`);
        } catch (err) { console.error(err); log('❌ 發生錯誤：' + err.message); }
        finally { btn.disabled = false; btn.textContent = '開始檢核'; }
    }

    // 漏號：依「前綴＋流水號位數」分組，找出最小～最大間缺少的號碼
    function computeNumbering(ids, counts) {
        const groups = {}, unparsed = [];
        ids.forEach(id => {
            const m = id.match(/^(.*?)(\d+)$/);
            if (!m || m[2].length > 15) { unparsed.push(id); return; }
            const k = m[1] + '\u0001' + m[2].length;
            (groups[k] || (groups[k] = { prefix: m[1], len: m[2].length, nums: [] })).nums.push(Number(m[2]));
        });
        let missingCount = 0;
        const out = Object.values(groups).map(g => {
            const nums = [...new Set(g.nums)].sort((a, b) => a - b), ranges = [];
            for (let i = 1; i < nums.length; i++) if (nums[i] - nums[i - 1] > 1) ranges.push([nums[i - 1] + 1, nums[i] - 1]);
            const miss = ranges.reduce((s, r) => s + r[1] - r[0] + 1, 0); missingCount += miss;
            const fmt = n => g.prefix + String(n).padStart(g.len, '0');
            return { prefix: g.prefix, len: g.len, fmt, min: nums[0], max: nums[nums.length - 1], count: nums.length, expected: nums[nums.length - 1] - nums[0] + 1, ranges, missing: miss };
        }).sort((a, b) => collator.compare(a.fmt(a.min), b.fmt(b.min)));
        const dups = Object.keys(S.idIndex).filter(id => S.idIndex[id].length > 1).sort(collator.compare).map(id => ({ id, n: S.idIndex[id].length }));
        return { ...counts, uniqueIds: ids.length, groups: out, unparsed, missingCount, dups };
    }

    function runChecks() {
        const P = S.applied.params, en = S.applied.enabled;
        const active = RULES.filter(r => en[r.code] !== false && !r.dataset);
        const hits = [], perCase = {};
        S.records.forEach(rec => {
            const c = makeCtx(rec, P, S.targetYear); rec.hits = []; rec.badCells = new Set();
            active.forEach(rule => {
                let res = null; try { res = rule.check(c); } catch (e) { console.error(rule.code, e); }
                if (!res) return;
                const cells = [...new Set((res.cells || []).filter(Boolean))].map(f => ({ f, v: rec.data[f] }));
                cells.forEach(({ f }) => rec.badCells.add(f));
                const h = { uid: rec.seq + '::' + rule.code, key: rec.caseKey + '::' + rule.code, rec, rule, msg: res.msg, cells };
                rec.hits.push(h); hits.push(h); perCase[rec.caseKey] = (perCase[rec.caseKey] || 0) + 1;
            });
        });
        S.hits = hits; S.perCase = perCase; S.ran = true; S.page = 1; S.expanded.clear();
    }
    function refreshRunPage() { renderStats(); renderNumbering(); renderFilterOptions(); renderResults(); renderAnnoSummary(); }

    // ================= 頁面一：渲染 =================
    function renderStats() {
        const total = S.records.length, cases = new Set(S.records.map(r => r.caseKey)).size, bad = S.records.filter(r => r.hits && r.hits.length).length;
        const box = (k, v, cls, sub) => `<div class="au-stat"><div class="k">${k}</div><div class="v ${cls || ''}">${v}</div>${sub ? `<div class="s">${sub}</div>` : ''}</div>`;
        $('auStats').innerHTML = S.ran
            ? box('資料總筆數', fmtN(total), '', '移轉年月在區間內') + box('案件數', fmtN(cases), '', '不重複實例編號') + box('異常筆數', fmtN(bad), bad ? 'bad' : '', '命中 1 條以上規則') + box('異常比率', total ? (bad / total * 100).toFixed(1) + '%' : '—', bad ? 'bad' : '', '異常筆數 ÷ 資料總筆數')
            : box('資料總筆數', '—') + box('案件數', '—') + box('異常筆數', '—') + box('異常比率', '—');
    }

    function renderNumbering() {
        const el = $('auNumBox'), N = S.numbering;
        if (!N) { el.innerHTML = ''; return; }
        const on = S.applied.enabled.N01 !== false;
        const cell = (k, v, cls) => `<div class="au-ncell ${cls || ''}"><span>${k}</span><b>${v}</b></div>`;
        let html = `<div class="au-numbox"><div class="au-numhead">總案件量與實例編號檢核 <span class="au-code">N01</span>${on ? '' : '<span class="au-muted">（N01 已停用，僅顯示案件量）</span>'}</div>
            <div class="au-nrow">${cell('上傳檔案案件總量', fmtN(N.total) + ' 筆')}${cell('移轉年月在區間內', fmtN(N.inRange) + ' 筆')}${cell('區間外（不逐筆檢核）', fmtN(N.outRange) + ' 筆')}${cell('不重複實例編號', fmtN(N.uniqueIds) + ' 個')}${N.noId ? cell('無實例編號', fmtN(N.noId) + ' 筆', 'bad') : ''}
            ${on ? cell('漏號', fmtN(N.missingCount) + ' 個', N.missingCount ? 'bad' : 'good') : ''}${cell('重號（區間內）', fmtN(N.dups.length) + ' 個', N.dups.length ? 'bad' : 'good')}</div>`;
        if (on && N.groups.length) {
            html += `<table class="au-ntable"><thead><tr><th>編號組別</th><th>編號範圍</th><th class="num">應有</th><th class="num">實有</th><th class="num">漏號</th><th>漏號清單</th></tr></thead><tbody>`;
            N.groups.forEach(g => {
                const shown = g.ranges.slice(0, 80).map(([a, b]) => `<span class="au-mchip">${esc(a === b ? g.fmt(a) : `${g.fmt(a)}～${g.fmt(b)}（${b - a + 1}）`)}</span>`).join('');
                html += `<tr><td class="nowrap">${esc(g.prefix || '（純數字）')}・${g.len} 碼</td><td class="nowrap">${esc(g.fmt(g.min))} ～ ${esc(g.fmt(g.max))}</td><td class="num">${fmtN(g.expected)}</td><td class="num">${fmtN(g.count)}</td>
                    <td class="num ${g.missing ? 'bad' : ''}">${fmtN(g.missing)}</td><td>${g.missing ? shown + (g.ranges.length > 80 ? `<span class="au-muted">…另 ${g.ranges.length - 80} 段，請見匯出 Excel</span>` : '') : '<span class="au-good">無漏號</span>'}</td></tr>`;
            });
            if (N.unparsed.length) html += `<tr><td colspan="6" class="au-muted">另有 ${N.unparsed.length} 個編號結尾非數字，無法判斷漏號：${esc(N.unparsed.slice(0, 20).join('、'))}${N.unparsed.length > 20 ? '…' : ''}</td></tr>`;
            html += '</tbody></table>';
        }
        if (N.dups.length) html += `<div class="au-dups"><b>重號：</b>${N.dups.slice(0, 60).map(d => `<span class="au-mchip">${esc(d.id)}（${d.n} 次）</span>`).join('')}${N.dups.length > 60 ? '…' : ''} <span class="au-muted">僅比對移轉年月區間內案件；重號案件同時以 N02 列入下方檢核結果</span></div>`;
        el.innerHTML = html + '</div>';
    }

    function renderAnnoSummary() {
        if (!S.ran) { $('auAnnoSummary').textContent = ''; return; }
        const c = { pending: 0, bad: 0, ok: 0 }; S.hits.forEach(h => c[getSt(h.key)]++);
        $('auAnnoSummary').textContent = `共 ${S.hits.length} 列｜待確認 ${c.pending}・有問題 ${c.bad}・無問題 ${c.ok}`;
    }
    function fillSelect(sel, opts, allLabel) {
        const cur = sel.value;
        sel.innerHTML = `<option value="">${allLabel}</option>` + opts.map(o => `<option value="${esc(o.v)}">${esc(o.l)}</option>`).join('');
        sel.value = opts.some(o => o.v === cur) ? cur : ''; return sel.value;
    }
    function renderFilterOptions() {
        const cnt = fn => { const m = {}; S.hits.forEach(h => { const k = fn(h); m[k] = (m[k] || 0) + 1; }); return m; };
        const oc = cnt(h => h.rec.officer);
        S.f.officer = fillSelect($('auFOfficer'), Object.keys(oc).sort(collator.compare).map(o => ({ v: o, l: `${o}（${oc[o]}）` })), '全部調查人員');
        const gc = cnt(h => h.rule.group);
        S.f.group = fillSelect($('auFGroup'), Object.keys(GROUPS).map(k => ({ v: k, l: `${GROUPS[k]}（${gc[k] || 0}）` })), '全部分組');
        const rc = cnt(h => h.rule.code);
        S.f.rule = fillSelect($('auFRule'), RULES.filter(r => !r.dataset).map(r => ({ v: r.code, l: `${r.code} ${r.name}（${rc[r.code] || 0}）` })), '全部規則');
    }
    function getFiltered() {
        const f = S.f, kw = f.kw.trim().toLowerCase();
        const list = S.hits.filter(h => {
            if (f.officer && h.rec.officer !== f.officer) return false;
            if (f.group && h.rule.group !== f.group) return false;
            if (f.rule && h.rule.code !== f.rule) return false;
            if (f.status && getSt(h.key) !== f.status) return false;
            if (kw && ![h.rec.caseId, h.rec.target, h.rec.officer, h.rule.code, h.rule.name, h.msg, getNote(h.key), ...h.cells.map(c => c.f + ' ' + (c.v ?? ''))].join(' ').toLowerCase().includes(kw)) return false;
            return true;
        });
        const { key, dir } = S.sort;
        const val = { case: h => h.rec.caseId, target: h => h.rec.target, officer: h => h.rec.officer, rule: h => h.rule.code }[key];
        list.sort((a, b) => {
            let r = collator.compare(String(val(a)), String(val(b)));
            if (r === 0) r = collator.compare(a.rec.caseId, b.rec.caseId) || (a.rec.seq - b.rec.seq) || (ruleOrder[a.rule.code] - ruleOrder[b.rule.code]);
            else r *= dir;
            return r;
        });
        return list;
    }
    const cellChip = c => `<span class="au-chip"><b>${esc(c.f)}</b><span>${isBlank(c.v) ? '<i>（空白）</i>' : esc(c.v)}</span></span>`;

    function rowHtml(h, isFirst) {
        const st = getSt(h.key), note = getNote(h.key), r = h.rec, n = S.perCase[r.caseKey];
        const seg = ['pending', 'bad', 'ok'].map(v => `<button data-act="st" data-v="${v}" class="${st === v ? 'on' : ''}">${ST_LABEL[v]}</button>`).join('');
        const caseAll = (isFirst && n > 1) ? `<div class="au-caseall"><span>本案命中 ${n} 條</span><button data-act="case" data-v="bad" title="此案件所有命中規則設為有問題">整列有問題</button><button data-act="case" data-v="ok" title="此案件所有命中規則設為無問題">整列無問題</button></div>` : '';
        const exp = S.expanded.has(h.uid);
        let html = `<tr data-uid="${esc(h.uid)}" class="st-${st}">
            <td class="au-judge ${st === 'bad' ? 'bad' : ''}"><div class="au-seg">${seg}</div>${caseAll}</td>
            <td class="nowrap"><b class="au-caseid">${esc(r.caseId)}</b>${S.multiFile ? `<div class="au-small" title="${esc(r.file)}">${esc(r.file)}</div>` : ''}</td>
            <td class="nowrap">${esc(r.officer)}</td>
            <td class="c-target">${esc(r.target) || '—'}<div><button class="au-explink" data-act="exp">${exp ? '收合欄位 ▲' : '展開全部欄位 ▼'}</button></div></td>
            <td class="c-rule"><span class="au-code">${h.rule.code}</span><div class="au-small">${esc(GROUPS[h.rule.group].slice(2))}</div></td>
            <td class="c-msg"><b>${esc(h.rule.name)}</b><div>${esc(h.msg)}</div></td>
            <td class="c-cells">${h.cells.map(cellChip).join('')}</td>
            <td class="c-note"><textarea class="au-input au-note ${note ? 'has' : ''}" data-act="note" rows="1" placeholder="備註…">${esc(note)}</textarea></td>
        </tr>`;
        if (exp) {
            const sh = r.sheet;
            html += `<tr class="au-exp"><td colspan="8"><div class="au-small" style="margin-bottom:4px">來源：${esc(r.file)} 第 ${r.rowNo} 列｜共 ${sh.keys.length} 個欄位，著色處為本案命中規則之欄位</div><div class="au-all">${sh.keys.map((k, i) => {
                const v = r.data[k], label = sh.headers[i] || '（空白標題）';
                return `<div class="au-kv ${r.badCells.has(k) ? 'hit' : ''}"><b title="${esc(label)}">${esc(label)}</b><span>${isBlank(v) ? '<i class="au-small">—</i>' : esc(v)}</span></div>`;
            }).join('')}</div></td></tr>`;
        }
        return html;
    }

    function renderResults() {
        const tbl = $('auResultTable');
        const cols = [['', '人工判定'], ['case', '實例編號'], ['officer', '調查人員'], ['target', '標的'], ['rule', '規則代碼'], ['', '異常說明'], ['', '異常欄位值'], ['', '人工備註']];
        const th = cols.map(([k, l]) => k ? `<th class="sortable ${S.sort.key === k ? 'sorted' : ''}" data-sort="${k}">${l}<span class="arr">${S.sort.key === k ? (S.sort.dir > 0 ? '▲' : '▼') : '⇅'}</span></th>` : `<th>${l}</th>`).join('');
        if (!S.ran) {
            tbl.innerHTML = `<thead><tr>${th}</tr></thead><tbody><tr><td colspan="8"><div class="au-empty">尚未載入資料，請於上方匯入 Excel 後按「開始檢核」</div></td></tr></tbody>`;
            $('auPager').innerHTML = ''; $('auFCount').textContent = ''; S.pageItems = []; return;
        }
        const list = getFiltered(), pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
        if (S.page > pages) S.page = pages;
        const items = list.slice((S.page - 1) * PAGE_SIZE, S.page * PAGE_SIZE); S.pageItems = items;
        const seen = new Set(), firstUids = new Set();
        list.forEach(h => { if (!seen.has(h.rec.caseKey)) { seen.add(h.rec.caseKey); firstUids.add(h.uid); } });
        $('auFCount').textContent = `符合 ${fmtN(list.length)} 筆（共 ${fmtN(S.hits.length)} 筆）`;
        let body;
        if (!S.hits.length) body = `<tr><td colspan="8"><div class="au-empty good">全數通過檢核，沒有命中任何規則。</div></td></tr>`;
        else if (!items.length) body = `<tr><td colspan="8"><div class="au-empty">沒有符合篩選條件的資料</div></td></tr>`;
        else body = items.map(h => rowHtml(h, firstUids.has(h.uid))).join('');
        tbl.innerHTML = `<thead><tr>${th}</tr></thead><tbody>${body}</tbody>`;
        const from = list.length ? (S.page - 1) * PAGE_SIZE + 1 : 0, to = Math.min(S.page * PAGE_SIZE, list.length);
        $('auPager').innerHTML = `<span class="au-muted">第 ${from}～${to} 筆，每頁 ${PAGE_SIZE} 筆</span>
            <button class="au-btn" data-page="1" ${S.page <= 1 ? 'disabled' : ''}>«</button><button class="au-btn" data-page="${S.page - 1}" ${S.page <= 1 ? 'disabled' : ''}>上一頁</button>
            <span>第 <input type="number" class="au-input" id="auPageInput" min="1" max="${pages}" value="${S.page}"> / ${pages} 頁</span>
            <button class="au-btn" data-page="${S.page + 1}" ${S.page >= pages ? 'disabled' : ''}>下一頁</button><button class="au-btn" data-page="${pages}" ${S.page >= pages ? 'disabled' : ''}>»</button>`;
    }
    const hitByUid = uid => S.hits.find(h => h.uid === uid);

    function bindRunPage() {
        $('runAuditBtn').addEventListener('click', processFiles);
        const onF = (id, k) => $(id).addEventListener('change', e => { S.f[k] = e.target.value; S.page = 1; renderResults(); });
        onF('auFOfficer', 'officer'); onF('auFGroup', 'group'); onF('auFRule', 'rule'); onF('auFStatus', 'status');
        let kwT; $('auFKw').addEventListener('input', e => { clearTimeout(kwT); kwT = setTimeout(() => { S.f.kw = e.target.value; S.page = 1; renderResults(); }, 200); });
        $('auFClear').addEventListener('click', () => {
            S.f = { officer: '', group: '', rule: '', status: '', kw: '' };
            ['auFOfficer', 'auFGroup', 'auFRule', 'auFStatus'].forEach(id => { $(id).value = ''; }); $('auFKw').value = ''; S.page = 1; renderResults();
        });
        $('auBulkBad').addEventListener('click', () => { if (!S.pageItems.length) return; S.pageItems.forEach(h => setSt(h.key, 'bad')); saveAnno(); renderResults(); renderAnnoSummary(); });
        $('auBulkReset').addEventListener('click', () => { if (!S.pageItems.length) return; S.pageItems.forEach(h => setSt(h.key, 'pending')); saveAnno(); renderResults(); renderAnnoSummary(); });
        const tbl = $('auResultTable');
        tbl.addEventListener('click', e => {
            const thEl = e.target.closest('th[data-sort]');
            if (thEl) { const k = thEl.dataset.sort; S.sort = { key: k, dir: S.sort.key === k ? -S.sort.dir : 1 }; renderResults(); return; }
            const btn = e.target.closest('[data-act]'); if (!btn || btn.dataset.act === 'note') return;
            const tr = btn.closest('tr[data-uid]'); if (!tr) return; const h = hitByUid(tr.dataset.uid); if (!h) return;
            if (noteTimer) saveAnno();
            if (btn.dataset.act === 'st') { setSt(h.key, btn.dataset.v); saveAnno(); renderResults(); renderAnnoSummary(); }
            else if (btn.dataset.act === 'case') { S.hits.filter(x => x.rec.caseKey === h.rec.caseKey).forEach(x => setSt(x.key, btn.dataset.v)); saveAnno(); renderResults(); renderAnnoSummary(); }
            else if (btn.dataset.act === 'exp') { S.expanded.has(h.uid) ? S.expanded.delete(h.uid) : S.expanded.add(h.uid); renderResults(); }
        });
        tbl.addEventListener('input', e => {
            if (e.target.dataset.act !== 'note') return;
            const tr = e.target.closest('tr[data-uid]'), h = tr && hitByUid(tr.dataset.uid); if (!h) return;
            setNote(h.key, e.target.value.trim() ? e.target.value : ''); e.target.classList.toggle('has', !!e.target.value.trim()); saveAnnoSoon();
        });
        tbl.addEventListener('focusout', e => { if (e.target.dataset && e.target.dataset.act === 'note' && noteTimer) saveAnno(); });
        window.addEventListener('beforeunload', () => { if (noteTimer) saveAnno(); });
        $('auPager').addEventListener('click', e => { const b = e.target.closest('[data-page]'); if (!b || b.disabled) return; S.page = parseInt(b.dataset.page); renderResults(); $('auResultTable').parentElement.scrollTop = 0; });
        $('auPager').addEventListener('change', e => { if (e.target.id !== 'auPageInput') return; const p = parseInt(e.target.value); if (p > 0) { S.page = p; renderResults(); } });
        $('auExportXlsx').addEventListener('click', exportExcel);
        $('auExportAnno').addEventListener('click', exportAnno);
        $('auImportAnnoBtn').addEventListener('click', () => $('auImportAnno').click());
        $('auImportAnno').addEventListener('change', importAnno);
        $('auClearAnno').addEventListener('click', () => {
            const n = Object.keys(S.anno).length; if (!n) { alert('目前沒有任何本機註記。'); return; }
            if (!confirm(`確定清除本機全部 ${n} 筆註記（判定與備註）？\n此動作無法復原，建議先「匯出目前註記」備份。`)) return;
            S.anno = {}; lsDel(LS_ANNO); renderResults(); renderAnnoSummary();
        });
    }
    function renderStorageNote() {
        const el = $('auStorageNote'); if (!el) return;
        el.innerHTML = storageOK
            ? '人工判定與備註會自動儲存在本機瀏覽器，切換頁籤、篩選、換頁或關閉後重開都會保留（需使用同一台電腦、同一個瀏覽器開啟此檔）。換電腦或交接時，請用「匯出目前註記」與「匯入註記」。<br>匯出的 Excel 會逐格複製原始資料（欄位、順序、標題、數字格式不變），檢核結果附加於最右側；僅包含移轉年月在區間內的資料列。'
            : '<b style="color:#a4161a">⚠ 此瀏覽器目前無法使用本機儲存，註記在關閉頁面後會遺失，請記得「匯出目前註記」保存。</b>';
    }

    // ---------- 匯出 Excel：原始欄位逐格複製 + 右側附加檢核結果 ----------
    async function exportExcel() {
        if (!S.ran) { alert('請先執行檢核。'); return; }
        const fill = c => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: c } });
        const HIT = 'FFFDE3E1', HITF = 'FFA4161A', ADDH = 'FF1F3A5F';
        const STFILL = { bad: 'FFFDE3E1', ok: 'FFE5F5EB' };
        const headStyle = row => row.eachCell(c => { c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = fill(ADDH); c.alignment = { vertical: 'middle' }; });
        const putCell = (cell, src) => {
            if (!src || src.t === 'z') return;
            cell.value = src.t === 'e' ? (src.w ?? null) : src.v;
            if (src.z && src.z !== 'General') cell.numFmt = String(src.z);
        };
        const wb = new ExcelJS.Workbook();
        const ADD = ['檢核結果', '異常說明', '命中規則代碼', '人工判定', '人工備註'];

        // 依標題列分組：標題完全相同的檔案合併成一張表，不同者各自一張
        const groups = [];
        S.sheets.forEach(sh => { const sig = JSON.stringify(sh.headers); let g = groups.find(x => x.sig === sig); if (!g) groups.push(g = { sig, sheets: [] }); g.sheets.push(sh); });
        const usedNames = new Set();
        const sheetName = base => { const n = base.replace(/[\\/?*\[\]:]/g, '_').slice(0, 28) || '資料'; let k = n, i = 2; while (usedNames.has(k)) k = `${n}(${i++})`; usedNames.add(k); return k; };
        groups.forEach(g => {
            const first = g.sheets[0], ncol = first.headers.length;
            const ws = wb.addWorksheet(sheetName(groups.length === 1 ? '檢核結果' : `檢核結果_${first.file.replace(/\.[^.]+$/, '')}`), { views: [{ state: 'frozen', ySplit: 1 }] });
            const hr = ws.getRow(1);
            first.headerCells.forEach((src, i) => putCell(hr.getCell(i + 1), src));
            ADD.forEach((h, i) => { const c = hr.getCell(ncol + 1 + i); c.value = h; c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = fill(ADDH); });
            first.cols.forEach((w, i) => { if (w) ws.getColumn(i + 1).width = w; });
            [16, 60, 16, 26, 30].forEach((w, i) => { ws.getColumn(ncol + 1 + i).width = w; });
            let rn = 2;
            S.records.filter(r => g.sheets.includes(r.sheet)).forEach(rec => {
                const row = ws.getRow(rn++);
                rec.cells.forEach((src, i) => {
                    const cell = row.getCell(i + 1); putCell(cell, src);
                    if (rec.badCells.has(rec.sheet.keys[i])) { cell.fill = fill(HIT); cell.font = { color: { argb: HITF }, bold: true }; }
                });
                const has = rec.hits.length;
                const vals = [has ? `異常（${has} 條）` : '正常',
                    has ? rec.hits.map(h => `[${h.rule.code}] ${h.msg}`).join('\n') : '',
                    rec.hits.map(h => h.rule.code).join('、'),
                    rec.hits.map(h => `${h.rule.code}:${ST_LABEL[getSt(h.key)]}`).join('、'),
                    rec.hits.filter(h => getNote(h.key)).map(h => `${h.rule.code}:${getNote(h.key)}`).join('\n')];
                vals.forEach((v, i) => { const c = row.getCell(ncol + 1 + i); c.value = v; c.alignment = { wrapText: i === 1 || i === 4, vertical: 'top' }; });
                if (has) { const c = row.getCell(ncol + 1); c.fill = fill(HIT); c.font = { bold: true, color: { argb: HITF } }; }
            });
        });

        // 異常明細
        const ws2 = wb.addWorksheet('異常明細', { views: [{ state: 'frozen', ySplit: 1 }] });
        ws2.columns = [{ header: '實例編號', width: 16 }, { header: '調查人員', width: 10 }, { header: '標的', width: 30 }, { header: '規則代碼', width: 9 }, { header: '規則名稱', width: 28 }, { header: '檢核分組', width: 18 },
            { header: '異常說明', width: 50 }, { header: '異常欄位值', width: 45 }, { header: '人工判定', width: 9 }, { header: '人工備註', width: 30 }, { header: '來源檔案', width: 22 }, { header: '來源列號', width: 9 }];
        headStyle(ws2.getRow(1));
        S.hits.slice().sort((a, b) => collator.compare(a.rec.caseId, b.rec.caseId) || (a.rec.seq - b.rec.seq) || (ruleOrder[a.rule.code] - ruleOrder[b.rule.code])).forEach(h => {
            const st = getSt(h.key);
            const row = ws2.addRow([h.rec.caseId, h.rec.officer, h.rec.target, h.rule.code, h.rule.name, GROUPS[h.rule.group], h.msg,
                h.cells.map(c => `${c.f}：${isBlank(c.v) ? '（空白）' : c.v}`).join('\n'), ST_LABEL[st], getNote(h.key), h.rec.file, h.rec.rowNo]);
            row.alignment = { vertical: 'top', wrapText: true };
            if (STFILL[st]) row.getCell(9).fill = fill(STFILL[st]);
        });
        ws2.autoFilter = { from: 'A1', to: 'L1' };

        // 調查人員統計
        const ws3 = wb.addWorksheet('調查人員統計');
        ws3.columns = [{ header: '調查人員', width: 14 }, { header: '資料筆數', width: 10 }, { header: '異常筆數', width: 10 }, { header: '命中規則列數', width: 13 }, { header: '有問題', width: 9 }, { header: '無問題', width: 9 }, { header: '待確認', width: 9 }];
        headStyle(ws3.getRow(1));
        const stat = {};
        S.records.forEach(r => { const s = stat[r.officer] || (stat[r.officer] = { rows: 0, bad: 0, hits: 0, b: 0, o: 0, p: 0 }); s.rows++; if (r.hits.length) s.bad++;
            r.hits.forEach(h => { s.hits++; const st = getSt(h.key); if (st === 'bad') s.b++; else if (st === 'ok') s.o++; else s.p++; }); });
        Object.keys(stat).sort((a, b) => stat[b].hits - stat[a].hits).forEach(o => { const s = stat[o]; ws3.addRow([o, s.rows, s.bad, s.hits, s.b, s.o, s.p]); });

        // 編號檢核
        const N = S.numbering, ws4 = wb.addWorksheet('編號檢核');
        ws4.columns = [{ width: 26 }, { width: 24 }, { width: 22 }, { width: 12 }];
        const t = (arr, bold) => { const r = ws4.addRow(arr); if (bold) r.font = { bold: true }; return r; };
        t(['總案件量與實例編號檢核'], true);
        t(['上傳檔案案件總量', N.total]); t(['移轉年月在區間內', N.inRange]); t(['區間外（未逐筆檢核）', N.outRange]); t(['不重複實例編號', N.uniqueIds]); t(['無實例編號', N.noId]);
        t(['漏號個數', N.missingCount]); t(['重號個數（僅比對區間內案件）', N.dups.length]); t([]);
        headStyle(t(['編號組別', '編號範圍', '應有／實有', '漏號個數']));
        N.groups.forEach(g => t([`${g.prefix || '（純數字）'}・${g.len} 碼`, `${g.fmt(g.min)} ～ ${g.fmt(g.max)}`, `${g.expected} ／ ${g.count}`, g.missing]));
        if (N.missingCount) { t([]); headStyle(t(['漏號起', '漏號迄', '個數'])); N.groups.forEach(g => g.ranges.forEach(([a, b]) => t([g.fmt(a), g.fmt(b), b - a + 1]))); }
        if (N.dups.length) { t([]); headStyle(t(['重號實例編號', '出現次數', '出現位置'])); N.dups.forEach(d => t([d.id, d.n, S.idIndex[d.id].map(x => `${x.file} 第 ${x.rowNo} 列`).join('、')])); }

        const buf = await wb.xlsx.writeBuffer();
        saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `買賣實例檢核清冊_${S.targetYear}年期_${stamp()}.xlsx`);
    }

    // ---------- 註記匯出入 ----------
    function exportAnno() {
        if (noteTimer) saveAnno();
        const n = Object.keys(S.anno).length; if (!n) { alert('目前沒有任何註記可匯出。'); return; }
        const payload = { type: 'land-audit-annotations', version: 1, exportedAt: new Date().toISOString(), targetYear: S.targetYear, count: n, annotations: S.anno };
        saveAs(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `買賣實例檢核註記_${stamp()}.json`);
    }
    function importAnno(e) {
        const file = e.target.files[0]; e.target.value = ''; if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const obj = JSON.parse(reader.result), anns = obj && obj.annotations;
                if (!anns || typeof anns !== 'object' || (obj.type && obj.type !== 'land-audit-annotations')) throw new Error('不是本工具匯出的註記檔');
                const keys = Object.keys(anns).filter(k => anns[k] && typeof anns[k] === 'object'), overlap = keys.filter(k => S.anno[k]).length;
                if (!confirm(`將匯入 ${keys.length} 筆註記${overlap ? `，其中 ${overlap} 筆與本機重複，將以匯入檔為準` : ''}。確定匯入？`)) return;
                keys.forEach(k => { const a = anns[k], o = {}; if (a.st === 'bad' || a.st === 'ok') o.st = a.st; if (a.note) o.note = String(a.note); o.t = a.t || Date.now(); if (o.st || o.note) S.anno[k] = o; });
                saveAnno(); renderResults(); renderAnnoSummary(); alert(`已匯入 ${keys.length} 筆註記。`);
            } catch (err) { alert('匯入失敗：' + err.message); }
        };
        reader.readAsText(file, 'utf-8');
    }

    // ================= 頁面二 =================
    function makeMS(host, title, getOptions, sel, onChange) {
        host.innerHTML = `<button type="button" class="au-btn au-ms-btn"></button><div class="au-ms-panel au-hide"><input class="au-input au-ms-search" placeholder="搜尋選項…"><div class="au-ms-tools"><a data-a="all">全選目前清單</a><a data-a="none">清除選取</a></div><div class="au-ms-list"></div></div>`;
        const btn = host.querySelector('.au-ms-btn'), panel = host.querySelector('.au-ms-panel'), search = host.querySelector('.au-ms-search'), list = host.querySelector('.au-ms-list');
        const visible = () => { const q = search.value.trim().toLowerCase(); return getOptions().filter(o => !q || o.label.toLowerCase().includes(q)); };
        const paintBtn = () => { btn.innerHTML = `${title}：<b>${sel.size ? `已選 ${sel.size} 項` : '全部'}</b> ▾`; };
        const paintList = () => { const opts = visible(); list.innerHTML = opts.length ? opts.map(o => `<label class="au-ms-opt"><input type="checkbox" value="${esc(o.value)}" ${sel.has(o.value) ? 'checked' : ''}><span>${esc(o.label)}</span><em>${o.count}</em></label>`).join('') : '<div class="au-muted" style="padding:6px">無符合選項</div>'; };
        btn.addEventListener('click', e => { e.stopPropagation(); const willOpen = panel.classList.contains('au-hide'); document.querySelectorAll('.au-ms-panel').forEach(p => p.classList.add('au-hide')); if (willOpen) { panel.classList.remove('au-hide'); search.value = ''; paintList(); search.focus(); } });
        panel.addEventListener('click', e => e.stopPropagation());
        search.addEventListener('input', paintList);
        list.addEventListener('change', e => { const v = e.target.value; e.target.checked ? sel.add(v) : sel.delete(v); paintBtn(); onChange(); });
        host.querySelector('.au-ms-tools').addEventListener('click', e => { const a = e.target.dataset.a; if (!a) return; if (a === 'none') sel.clear(); else visible().forEach(o => sel.add(o.value)); paintList(); paintBtn(); onChange(); });
        paintBtn();
        return { refresh() { paintBtn(); if (!panel.classList.contains('au-hide')) paintList(); } };
    }
    function buildMultiSelects() {
        S.ms.group = makeMS($('auMsGroup'), '檢核分組', () => Object.keys(GROUPS).map(g => ({ value: g, label: GROUPS[g], count: RULES.filter(r => r.group === g).length })), S.rf.groups, renderRuleTable);
        S.ms.field = makeMS($('auMsField'), '涉及欄位', () => { const m = {}; RULES.forEach(r => new Set(r.fields).forEach(f => { m[f] = (m[f] || 0) + 1; }));
            return Object.keys(m).sort((a, b) => (m[b] - m[a]) || collator.compare(a, b)).map(f => ({ value: f, label: f, count: m[f] })); }, S.rf.fields, renderRuleTable);
    }
    function refreshMultiSelects() { S.ms.group && S.ms.group.refresh(); S.ms.field && S.ms.field.refresh(); }
    function filteredRules() {
        const kw = S.rf.kw.trim().toLowerCase();
        return RULES.filter(r => {
            if (S.rf.groups.size && !S.rf.groups.has(r.group)) return false;
            if (S.rf.fields.size && !r.fields.some(f => S.rf.fields.has(f))) return false;
            if (kw && ![r.code, r.name, r.cond, r.note, GROUPS[r.group], ...r.fields].join(' ').toLowerCase().includes(kw)) return false;
            return true;
        });
    }
    function renderRuleTable() {
        const en = S.draft.enabled, list = filteredRules(), onCnt = RULES.filter(r => en[r.code] !== false).length;
        $('auRuleCount').textContent = `顯示 ${list.length} / ${RULES.length} 項，啟用 ${onCnt} 項（設定中）｜點選規則可展開判斷條件`;
        $('auRuleTable').innerHTML = list.length ? list.map(r => {
            const on = en[r.code] !== false, open = S.rf.open.has(r.code), fs = [...new Set(r.fields)], ps = r.params.filter(k => PARAM_LABEL[k]);
            return `<div class="au-rule ${on ? '' : 'off'}" data-code="${r.code}">
                <div class="hd"><input type="checkbox" data-act="en" ${on ? 'checked' : ''} title="啟用此規則"><span class="ar">${open ? '▼' : '▶'}</span><code>${r.code}</code>
                <span class="nm">${esc(r.name)}</span>${r.dataset ? '<span class="gt">整批統計</span>' : ''}<span class="gt">${esc(GROUPS[r.group])}</span><span class="gt">${fs.length} 欄</span></div>
                ${open ? `<div class="bd"><dl><dt>判斷條件</dt><dd>${esc(r.cond)}</dd>
                    <dt>比對欄位</dt><dd>${fs.map(f => `<span class="au-fchip">${esc(f)}</span>`).join('')}</dd>
                    ${r.note ? `<dt>補充說明</dt><dd>${esc(r.note)}</dd>` : ''}
                    ${ps.length ? `<dt>使用參數</dt><dd>${ps.map(k => `<a href="#" class="au-link" data-param="${k}">${esc(PARAM_LABEL[k])}</a>`).join('、')}</dd>` : ''}</dl></div>` : ''}
            </div>`;
        }).join('') : '<div class="au-empty">沒有符合篩選條件的規則。</div>';
    }
    function bindRulesPage() {
        const tbl = $('auRuleTable');
        tbl.addEventListener('click', e => {
            const pl = e.target.closest('[data-param]');
            if (pl) { e.preventDefault(); const el = document.querySelector(`#auParams [data-pkey="${pl.dataset.param}"]`); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.style.outline = '2px solid #e6cb6d'; setTimeout(() => { el.style.outline = ''; }, 1600); } return; }
            if (e.target.closest('[data-act="en"]')) return;
            const el = e.target.closest('.au-rule'); if (!el || !e.target.closest('.hd')) return; const c = el.dataset.code; S.rf.open.has(c) ? S.rf.open.delete(c) : S.rf.open.add(c); renderRuleTable();
        });
        tbl.addEventListener('change', e => { if (e.target.dataset.act !== 'en') return; S.draft.enabled[e.target.closest('.au-rule').dataset.code] = e.target.checked; renderRuleTable(); updateDirty(); });
        let kwT; $('auRuleKw').addEventListener('input', e => { clearTimeout(kwT); kwT = setTimeout(() => { S.rf.kw = e.target.value; renderRuleTable(); }, 150); });
        $('auRuleClear').addEventListener('click', () => { S.rf.groups.clear(); S.rf.fields.clear(); S.rf.kw = ''; $('auRuleKw').value = ''; refreshMultiSelects(); renderRuleTable(); });
        const setAll = v => { filteredRules().forEach(r => { S.draft.enabled[r.code] = v; }); renderRuleTable(); updateDirty(); };
        $('auRuleOn').addEventListener('click', () => setAll(true)); $('auRuleOff').addEventListener('click', () => setAll(false));
        const pBox = $('auParams'); pBox.addEventListener('input', onParamInput); pBox.addEventListener('change', onParamInput);
        $('auExportCfg').addEventListener('click', () => {
            const params = {}; EDITABLE.forEach(k => { params[k] = S.draft.params[k]; });
            saveAs(new Blob([JSON.stringify({ type: 'land-audit-config', version: 2, exportedAt: new Date().toISOString(), enabled: S.draft.enabled, params }, null, 2)], { type: 'application/json' }), `買賣實例檢核參數設定_${stamp()}.json`);
        });
        $('auImportCfgBtn').addEventListener('click', () => $('auImportCfg').click());
        $('auImportCfg').addEventListener('change', e => {
            const file = e.target.files[0]; e.target.value = ''; if (!file) return;
            const reader = new FileReader();
            reader.onload = () => { try { const obj = JSON.parse(reader.result); if (!obj || (obj.type && obj.type !== 'land-audit-config') || (!obj.params && !obj.enabled)) throw new Error('不是本工具匯出的參數設定檔');
                S.draft = normalizeCfg(obj); renderParams(); renderRuleTable(); updateDirty(); alert('已載入參數設定，請確認後按「套用並重新檢核」。'); } catch (err) { alert('匯入失敗：' + err.message); } };
            reader.readAsText(file, 'utf-8');
        });
        $('auResetCfg').addEventListener('click', () => { if (!confirm('確定將所有規則啟用狀態與參數還原為預設值？\n（按「套用並重新檢核」後才會生效）')) return; S.draft = defaultCfg(); renderParams(); renderRuleTable(); updateDirty(); });
    }
    const usedBy = key => RULES.filter(r => r.params.includes(key));
    function renderParams() {
        const P = S.draft.params, listVal = a => (a || []).join('、');
        let html = '';
        PARAM_META.forEach(sec => {
            html += `<div class="au-psec"><h4>${esc(sec.sec)}</h4><div class="au-pgrid">`;
            sec.items.forEach(it => {
                const k = it.key, v = P[k]; let input = '';
                if (it.type === 'number') input = `<input type="number" class="au-input" data-num="${k}" value="${esc(v)}">`;
                else if (it.type === 'priceTable') {
                    input = `<table class="au-ptable"><thead><tr><th>#</th><th>構造名稱</th><th>比對關鍵字</th><th>排除關鍵字</th><th>總樓層 ≤</th><th>單價下限</th><th>單價上限</th></tr></thead><tbody>`;
                    v.forEach((t, i) => t.bands.forEach((b, j) => {
                        input += `<tr class="${j === 0 ? 'grp' : ''}">`;
                        if (j === 0) input += `<td rowspan="${t.bands.length}" class="num">${i + 1}</td><td rowspan="${t.bands.length}"><input class="au-input" data-t="${k}" data-i="${i}" data-tf="name" value="${esc(t.name)}"></td>
                            <td rowspan="${t.bands.length}"><input class="au-input" data-t="${k}" data-i="${i}" data-tf="keywords" value="${esc(listVal(t.keywords))}"></td><td rowspan="${t.bands.length}"><input class="au-input" data-t="${k}" data-i="${i}" data-tf="exclude" value="${esc(listVal(t.exclude))}"></td>`;
                        ['maxFloor', 'min', 'max'].forEach(f => { input += `<td class="n"><input type="number" class="au-input" data-t="${k}" data-i="${i}" data-j="${j}" data-tf="${f}" value="${esc(b[f])}"></td>`; });
                        input += '</tr>';
                    }));
                    input += '</tbody></table>';
                } else if (it.type === 'profitTable') {
                    input = `<table class="au-ptable"><thead><tr><th>工期 ≤（月）</th><th>利潤率下限 %</th><th>利潤率上限 %</th></tr></thead><tbody>` +
                        v.map((t, i) => `<tr>${['maxMonths', 'min', 'max'].map(f => `<td class="n"><input type="number" class="au-input" data-t="${k}" data-i="${i}" data-tf="${f}" value="${esc(t[f])}"></td>`).join('')}</tr>`).join('') + '</tbody></table>';
                }
                const used = usedBy(k);
                html += `<div class="au-param ${it.wide ? 'wide' : ''}" data-pkey="${k}"><label class="au-label">${esc(it.label)}</label>${it.desc ? `<div class="desc">${esc(it.desc)}</div>` : ''}${input}
                    <div class="au-use">使用規則：${used.length ? used.map(r => `<b>${r.code}</b> ${esc(r.name)}`).join('、') : '—'}</div></div>`;
            });
            html += '</div></div>';
        });
        $('auParams').innerHTML = html;
    }
    function onParamInput(e) {
        const el = e.target, P = S.draft.params, d = el.dataset;
        if (d.num) P[d.num] = el.value === '' ? 0 : Number(el.value);
        else if (d.t) {
            const row = P[d.t][Number(d.i)]; if (!row) return;
            const target = d.j !== undefined ? row.bands[Number(d.j)] : row;
            if (d.tf === 'keywords' || d.tf === 'exclude') target[d.tf] = splitList(el.value);
            else if (d.tf === 'name') target[d.tf] = el.value.trim();
            else target[d.tf] = el.value === '' ? 0 : Number(el.value);
        } else return;
        updateDirty();
    }
    const isDirty = () => JSON.stringify(S.draft) !== JSON.stringify(S.applied);
    function updateDirty() {
        const d = isDirty();
        $('auDirtyBar').classList.toggle('au-hide', !d); $('auDirtyRun').classList.toggle('au-hide', !d); $('auTabDirty').classList.toggle('au-hide', !d);
        if (d) $('auAppliedMsg').classList.add('au-hide');
    }
    let msgTimer;
    function applyConfig() {
        S.applied = clone(S.draft);
        const ok = lsSet(LS_CFG, S.applied); updateDirty();
        let msg = '✓ 設定已套用' + (ok ? '並儲存於本機。' : '（本機儲存失敗，關閉後將還原，請匯出參數設定備份）。');
        if (S.records.length) { runChecks(); refreshRunPage(); msg += `已重新檢核：${S.records.length} 筆資料，異常 ${S.records.filter(r => r.hits.length).length} 筆，命中規則 ${S.hits.length} 列（人工註記保留）。`; }
        else msg += '下次按「開始檢核」時生效。';
        const box = $('auAppliedMsg'); box.textContent = msg; box.classList.remove('au-hide');
        clearTimeout(msgTimer); msgTimer = setTimeout(() => box.classList.add('au-hide'), 6000);
    }

    return { init };
})();

export default {
  name: 'LahPrcAudit',
  mounted () {
    if (typeof window !== 'undefined') {
      window.XLSX = XLSX
      window.saveAs = saveAs
    }

    const initEngine = () => {
      try {
        if (typeof AuditEngine !== 'undefined' && AuditEngine.init) {
          AuditEngine.init()
        }
      } catch (err) {
        console.error('AuditEngine.init error:', err)
      }
    }

    if (typeof window !== 'undefined' && window.ExcelJS) {
      initEngine()
    } else if (typeof document !== 'undefined') {
      const existing = document.querySelector('script[src="/js/exceljs.min.js"]')
      if (existing) {
        existing.addEventListener('load', initEngine)
      } else {
        const script = document.createElement('script')
        script.src = '/js/exceljs.min.js'
        script.onload = initEngine
        document.head.appendChild(script)
      }
    }
  }
}
</script>

<style scoped>
        /* ════════ 共用元件（四個工具一致；色票與 10日檢核相同） ════════ */
        body.app{--ui-ink:#17324D;--ui-ink2:#2A4A69;--ink:#17324D;--ink-2:#2A4A69;--paper:#EEF2F1;--line:#CFD8D6;--line-2:#E3E9E7;--soft:#F7FAF9;--text:#1B2429;--muted:#5A6A72;
            --err:#B42318;--err-bg:#FDECEA;--err-bd:#F3B8B2;--warn:#8A5A00;--warn-bg:#FFF1CC;--warn-bd:#EBCB7A;--info:#1D5FA8;--info-bg:#E6F0FB;--info-bd:#B5CFEE;--ok:#2E7D4F;--ok-bg:#E5F4EA;
            font-family:"Noto Sans TC","Microsoft JhengHei","PingFang TC","微軟正黑體",sans-serif;font-variant-numeric:tabular-nums}
        /* 工具外框 */
        .ui-frame{height:100%;display:flex;flex-direction:column;overflow:hidden;background:#fff;border:1px solid var(--line);border-radius:8px;box-shadow:0 1px 3px rgba(23,50,77,.06);font-size:15px;line-height:1.6;color:var(--text)}
        .ui-frame.hidden{display:none!important}
        .ui-head{display:flex;justify-content:space-between;align-items:center;gap:16px;min-height:62px;padding:10px 20px;background:var(--ui-ink);color:#fff;flex-shrink:0}
        .ui-head h2{margin:0;font-size:17px;font-weight:700;letter-spacing:.5px;line-height:1.4}
        .ui-head .sub{display:block;font-size:12px;color:#C3D3E0;line-height:1.5}
        .ui-headr{display:flex;align-items:center;gap:14px}
        .ui-head .meta{font-size:12px;color:#C3D3E0;text-align:right;line-height:1.5}
        .ui-close{border:1px solid #6F8AA6;background:transparent;color:#fff;border-radius:5px;padding:4px 12px;font-size:13px;cursor:pointer;white-space:nowrap;line-height:1.5}
        .ui-close:hover{background:var(--ui-ink2)}
        /* 頁籤（買賣實例檢核、10日檢核共用外觀） */
        .au-tabs,#tool-tenday-view nav.main{display:flex;gap:4px;padding:8px 20px 0;background:#E6ECEB;border-bottom:2px solid var(--ui-ink);flex-shrink:0}
        .au-tab,#tool-tenday-view nav.main button{border:1px solid var(--line);border-bottom:0;background:#D9E1E0;color:var(--muted);padding:7px 22px;border-radius:5px 5px 0 0;cursor:pointer;font-weight:700;font-size:14px;line-height:1.6;margin:0}
        .au-tab:hover,#tool-tenday-view nav.main button:hover{color:var(--ui-ink)}
        .au-tab.on,#tool-tenday-view nav.main button[aria-current=page]{background:var(--ui-ink);border-color:var(--ui-ink);color:#fff}
        .ui-body,.au-body,#tool-tenday-view .ui-body{flex:1;overflow:auto;background:var(--paper);padding:16px 20px 32px;scrollbar-gutter:stable}
        /* 卡片 */
        .ui-card{background:#fff;border:1px solid var(--line);border-radius:6px;margin-bottom:16px}
        .ui-card-h{margin:0;padding:12px 18px;border-bottom:1px solid var(--line-2);font-size:16.5px;font-weight:700;display:flex;align-items:center;gap:10px;flex-wrap:wrap;color:var(--text);line-height:1.5}
        .ui-card-h .n,.au-card-h .n{display:inline-grid;place-items:center;width:25px;height:25px;border-radius:50%;background:var(--ui-ink);color:#fff;font-size:13.5px;flex-shrink:0}
        .ui-card-h .aside{margin-left:auto;font-weight:400;font-size:13px;color:var(--muted)}
        .ui-card-b{padding:15px 18px}
        .ui-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:11px 18px;border-top:1px solid var(--line-2);background:var(--soft);border-radius:0 0 6px 6px}
        .ui-actions .note{color:var(--muted);font-size:13px}
        .ui-actions .sp{margin-left:auto}
        /* 按鈕 */
        .ui-btn{display:inline-flex;align-items:center;justify-content:center;gap:4px;border:1px solid var(--line);background:#fff;color:var(--text);border-radius:5px;padding:5px 12px;font-size:14px;line-height:1.5;cursor:pointer;white-space:nowrap}
        .ui-btn:hover{background:#F2F5F4}
        .ui-btn:disabled{opacity:.45;cursor:not-allowed}
        .ui-btn.primary{background:var(--ui-ink);border-color:var(--ui-ink);color:#fff;font-weight:600;padding:8px 22px}
        .ui-btn.primary:hover{background:var(--ui-ink2)}
        .ui-btn.primary:disabled{background:#8C9BA5;border-color:#8C9BA5;opacity:1}
        .ui-btn.dl{background:var(--ok);border-color:var(--ok);color:#fff;font-weight:600}
        .ui-btn.dl:hover{background:#256A42}
        .ui-btn.sm{padding:2px 9px;font-size:13px}
        .ui-btn.danger{color:var(--err);border-color:var(--err-bd)}
        /* 輸入 */
        .ui-input{border:1px solid var(--line);border-radius:5px;padding:5px 8px;font-size:14px;background:#fff;color:var(--text);line-height:1.5}
        .ui-input:focus,.ui-file:focus{outline:2px solid #9FB8D3;outline-offset:0;border-color:var(--ui-ink2)}
        .ui-file,.au-file{width:100%;height:38px;font-size:13.5px;border:1px solid var(--line);border-radius:5px;padding:4px 5px;background:#fff;color:var(--muted)}
        .ui-file::file-selector-button,.au-file::file-selector-button{margin-right:10px;padding:3px 12px;border:1px solid var(--line);background:var(--soft);border-radius:4px;color:var(--text);cursor:pointer;font-size:13px;font-weight:600}
        .ui-file::file-selector-button:hover,.au-file::file-selector-button:hover{background:#E6ECEB}
        /* 提示、標籤、狀態 */
        .ui-note{border:1px solid var(--info-bd);background:var(--info-bg);color:#17497F;border-radius:6px;padding:9px 13px;font-size:13.5px;line-height:1.6;margin-bottom:14px}
        .ui-note b{font-weight:700}
        .ui-badge{display:inline-block;font-size:12px;line-height:20px;padding:0 8px;border-radius:10px;font-weight:600;white-space:nowrap}
        .ui-badge.req{background:var(--err-bg);color:var(--err)}
        .ui-badge.opt{background:#E9EEEC;color:var(--muted)}
        .ui-status{margin:0 0 16px;padding:10px 14px;border-radius:6px;font-size:13.5px;white-space:pre-wrap;line-height:1.7}
        .ui-status.info{background:var(--soft);border:1px solid var(--line-2);color:var(--muted);font-family:Consolas,"Courier New",monospace}
        .ui-status.success{background:var(--ok-bg);border:1px solid #B7DFC4;color:#1E6B3F;font-weight:600}
        .ui-status.error{background:var(--err-bg);border:1px solid var(--err-bd);color:var(--err);font-weight:600}
        .ui-status.hidden{display:none}
        .sys-error{background:var(--err-bg);border:1px solid var(--err-bd);color:var(--err);padding:10px 14px;border-radius:6px;margin-bottom:16px;font-size:14px}
        /* 上傳檔案方塊 */
        .ui-filegrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
        .ui-filebox{display:flex;flex-direction:column;gap:8px;border:1px solid var(--line);border-radius:6px;padding:12px 14px;background:#fff}
        .ui-filebox.opt{border-style:dashed;background:var(--soft)}
        .fb-h{display:flex;align-items:center;gap:8px;font-weight:700;font-size:15px;color:var(--text)}
        .fb-h .ui-badge{margin-left:auto}
        .fb-spec{margin-top:auto;font-size:12.5px;color:var(--muted);line-height:1.6;border-top:1px dotted var(--line);padding-top:7px}
        .ui-msg{display:block;min-height:20px;font-size:13px;font-weight:600;color:var(--muted)}
        .ui-msg.ok{color:var(--ok)} .ui-msg.fail{color:var(--err)}
        /* 選項列、內嵌欄位 */
        .ui-radio{display:flex;flex-direction:column;gap:6px;border:1px solid var(--line-2);background:var(--soft);border-radius:6px;padding:10px 12px;margin-bottom:12px}
        .ui-radio label{display:flex;align-items:flex-start;gap:8px;cursor:pointer;font-size:14px}
        .ui-radio input{margin-top:5px;accent-color:var(--ui-ink)}
        .ui-radio b{font-weight:700;color:var(--ui-ink)}
        .ui-radio span{color:var(--muted)}
        .ui-inline{display:flex;flex-wrap:wrap;gap:10px 28px;align-items:center}
        .ui-inline label{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600}
        .ui-inline .ui-input{width:90px;text-align:center;font-weight:700}
        .ui-hint{font-size:12.5px;color:var(--muted);margin-top:8px}
        /* 統計列（同 10日檢核） */
        .ui-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid var(--line);border-radius:6px;overflow:hidden}
        .ui-stats .col{padding:11px 15px;border-left:1px solid var(--line-2)}
        .ui-stats .col:first-child{border-left:0;background:#F4F7FA}
        .ui-stats h4{margin:0 0 4px;font-size:13.5px;color:var(--muted);font-weight:500}
        .ui-stats .big{font-size:27px;font-weight:700;line-height:1.15;color:var(--ui-ink)}
        .ui-stats .big.bad{color:var(--err)}
        .ui-stats .big small{font-size:13px;font-weight:400;color:var(--muted);margin-left:3px}
        /* 資料表（同 10日檢核） */
        .ui-tablewrap{overflow-x:auto;border:1px solid var(--line);border-radius:6px;margin-top:14px}
        .ui-table{width:100%;border-collapse:collapse;font-size:13.5px}
        .ui-table th{background:#F4F7FA;font-weight:600;font-size:13px;text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);white-space:nowrap}
        .ui-table td{padding:7px 10px;border-bottom:1px solid var(--line-2)}
        .ui-table .num{text-align:right}
        .ui-table tr.bad td{background:#FFF8F7}
        .ui-table td.hit{color:var(--err);font-weight:700}
        .ui-table td.zero{color:#A3ADB3}
        @media (max-width:1100px){.ui-filegrid{grid-template-columns:1fr}.ui-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}

        /* ===== 功能C：買賣實例檢核 v2.0 專用樣式（深藍公務風） ===== */
        .au-root{--navy:#17324D;--navy2:#2A4A69;--navyl:#E7EDF3;--line:#d3dbe6;--ink:#1e293b;--mut:#5f6b7c;
            --ebg:#fde3e1;--efg:#a4161a;--ebd:#efa7a2;--wbg:#fff3c4;--wfg:#7a5000;--wbd:#e6cb6d;--ibg:#dde9fb;--ifg:#1c4d8a;--ibd:#a7c4ec;
            font-size:14px;color:var(--ink);border-radius:6px}
        .au-hide{display:none!important}
        .au-head{display:flex;justify-content:space-between;align-items:center;padding:10px 20px;background:var(--navy);color:#fff;flex-shrink:0}
        .au-head h2{font-size:17px;font-weight:700;letter-spacing:.5px}
        .au-head span{font-size:12px;color:#c5d3e6}
        .au-tabs{display:flex;gap:4px;padding:8px 20px 0;background:#eef2f7;border-bottom:2px solid var(--navy);flex-shrink:0}
        .au-tab{padding:8px 22px;font-weight:700;font-size:14px;color:var(--mut);background:#dfe6ef;border:1px solid var(--line);border-bottom:none;border-radius:4px 4px 0 0;position:relative;cursor:pointer}
        .au-tab:hover{color:var(--navy)}
        .au-tab.on{background:var(--navy);color:#fff;border-color:var(--navy)}
        .au-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#f59e0b;margin-left:6px;vertical-align:middle}
        .au-body{flex:1;overflow:auto;padding:14px 20px 24px;background:#EEF2F1}
        .au-card{background:#fff;border:1px solid var(--line);border-radius:4px;margin-bottom:14px}
        .au-card-h{padding:8px 14px;background:var(--navyl);border-bottom:1px solid var(--line);font-weight:700;color:var(--navy);font-size:15px;display:flex;align-items:center;gap:12px}
        .au-headnote{font-size:12px;font-weight:500;color:var(--mut)}
        .au-card-b{padding:12px 14px}
        .au-bt{border-top:1px solid var(--line)}
        .au-label{display:block;font-size:13px;font-weight:700;color:#334155;margin:0 0 5px}
        .au-flexbetween{display:flex;justify-content:space-between;align-items:center}
        .au-link{color:var(--navy2);font-weight:600;text-decoration:underline}
        .au-muted{color:var(--mut);font-size:12px}
        .au-mt{margin-top:8px}
        .au-ml-auto{margin-left:auto}
        .au-btn{display:inline-flex;align-items:center;gap:4px;border:1px solid #b5c1d1;background:#fff;color:var(--ink);padding:4px 11px;border-radius:3px;font-size:13px;line-height:1.5;cursor:pointer;white-space:nowrap}
        .au-btn:hover{background:#eef3f9;border-color:#8ea1bb}
        .au-btn:disabled{opacity:.5;cursor:not-allowed}
        .au-primary{background:var(--navy);border-color:var(--navy);color:#fff;font-weight:700}
        .au-primary:hover{background:var(--navy2);border-color:var(--navy2)}
        .au-danger{color:#a4161a;border-color:#e2a5a1}
        .au-danger:hover{background:#fdf0ef;border-color:#c96b65}
        .au-btn-ghost{background:transparent;color:#fff;border-color:#7d93b2}
        .au-btn-ghost:hover{background:var(--navy2);color:#fff}
        .au-big{width:100%;justify-content:center;padding:9px;font-size:15px}
        .au-input{border:1px solid #b5c1d1;border-radius:3px;padding:4px 7px;font-size:13px;background:#fff;color:var(--ink);line-height:1.4}
        .au-input:focus{outline:2px solid #9db8dc;outline-offset:0;border-color:var(--navy2)}
        .au-w-year{width:90px;text-align:center;font-weight:700;font-size:15px}
        .au-w-kw{width:250px}
        .au-w-rule{max-width:220px}
        .au-file{width:100%;font-size:13px;border:1px solid var(--line);padding:6px;border-radius:3px;background:#fafbfc}
        .au-uprow{display:flex;flex-wrap:wrap;gap:12px 16px;align-items:flex-end}
        .au-upf{display:flex;flex-direction:column}
        .au-upf .au-label{margin-bottom:4px}
        .au-grow{flex:1;min-width:300px}
        .au-uprow .au-w-year{height:36px;box-sizing:border-box}
        .au-uprow .au-hintbox{flex:none;height:36px;padding:0 14px;box-sizing:border-box}
        .au-uprow .au-file{height:36px;padding:3px 6px;box-sizing:border-box}
        .au-run{height:36px;padding:0 30px;font-size:15px}
        .au-yearrow{display:flex;align-items:stretch;gap:10px;margin-bottom:12px}
        .au-hintbox{flex:1;border:1px solid var(--line);background:#f7f9fc;padding:4px 10px;font-size:12px;color:var(--mut);display:flex;align-items:center;gap:6px}
        .au-hintbox b{color:var(--navy);font-size:14px}
        .au-mini{width:100%;border-collapse:collapse;font-size:12px}
        .au-mini td{border:1px solid var(--line);padding:3px 8px}
        .au-mini td:last-child{text-align:right;font-variant-numeric:tabular-nums;width:70px}
        .au-mini tr.off td{color:#a0a9b6}
        .au-mini tr.tot td{font-weight:700;background:#f3f6fa}
        .au-stats{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--line);margin:14px 0 12px;background:#fbfcfe}
        .au-stat{padding:7px 14px;border-right:1px solid var(--line)}
        .au-stat:last-child{border-right:none}
        .au-stat .k{font-size:12px;color:var(--mut)}
        .au-stat .v{font-size:22px;font-weight:700;color:var(--navy);font-variant-numeric:tabular-nums;line-height:1.3}
        .au-stat .v.bad{color:var(--efg)}
        .au-stat .s{font-size:11px;color:#8a95a5}
        .au-numbox{border:1px solid var(--line);margin-bottom:4px}
        .au-numhead{padding:6px 12px;background:#f2f5f9;border-bottom:1px solid var(--line);font-weight:700;color:var(--navy);font-size:13px;display:flex;gap:8px;align-items:center}
        .au-nrow{display:flex;flex-wrap:wrap;border-bottom:1px solid var(--line)}
        .au-ncell{padding:6px 14px;border-right:1px solid var(--line);display:flex;flex-direction:column;min-width:120px}
        .au-ncell span{font-size:12px;color:var(--mut)}
        .au-ncell b{font-size:16px;color:var(--navy);font-variant-numeric:tabular-nums}
        .au-ncell.bad b{color:var(--efg)} .au-ncell.good b{color:#2e7a4d}
        .au-ntable{width:100%;border-collapse:collapse;font-size:12px}
        .au-ntable th{background:#f7f9fc;text-align:left;padding:4px 10px;border-bottom:1px solid var(--line);color:#334155}
        .au-ntable td{padding:4px 10px;border-bottom:1px solid #edf0f4;vertical-align:top}
        .au-ntable .num{text-align:right;font-variant-numeric:tabular-nums} .au-ntable .bad{color:var(--efg);font-weight:700} .au-ntable .nowrap{white-space:nowrap}
        .au-mchip{display:inline-block;border:1px solid var(--ebd);background:var(--ebg);color:var(--efg);border-radius:2px;padding:0 5px;margin:1px 4px 2px 0;font-size:12px;font-family:Consolas,monospace}
        .au-good{color:#2e7a4d;font-weight:700}
        .au-dups{padding:6px 12px;font-size:12px}
        .au-caseid{font-family:Consolas,monospace;font-size:13px;color:var(--navy)}
        .au-tag{display:inline-block;font-size:11px;padding:0 6px;border:1px solid #a7c4ec;background:#dde9fb;color:#1c4d8a;border-radius:2px;margin-left:4px}
        .au-table tr[data-uid] > td:first-child{box-shadow:inset 3px 0 0 #c0392b}
        .au-chip{background:var(--ebg);border-color:var(--ebd)} .au-chip b{color:var(--efg);border-color:var(--ebd)}
        .au-kv.hit{background:var(--ebg)} .au-kv.hit b{color:var(--efg);font-weight:700}
        #auResultTable td.c-target{min-width:130px}
        .au-log{margin-top:10px;background:#f7f9fc;border:1px solid var(--line);padding:8px 10px;font-family:Consolas,monospace;font-size:12px;color:#475569;white-space:pre-wrap;max-height:130px;overflow:auto}
        .au-filters{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;padding:9px 14px;border-bottom:1px solid var(--line);background:#fafbfd}
        .au-filters-2{padding:6px 14px;background:#fff}
        .au-fl{display:flex;align-items:center;gap:5px;font-size:12px;color:#334155;font-weight:600}
        .au-count{margin-left:auto;font-weight:700;color:var(--navy);font-size:13px}
        .au-tablewrap{overflow:auto;max-height:68vh}
        .au-tablewrap-rules{max-height:none}
        .au-table{width:100%;border-collapse:collapse;font-size:13px}
        #auResultTable{min-width:0;table-layout:auto}
        .au-tablewrap-results{max-height:none;overflow:visible}
        .au-tablewrap-results .au-table th{top:-14px}
        .au-body{scrollbar-gutter:stable}
        #auResultTable td.c-msg{min-width:200px}
        #auResultTable td.c-cells{min-width:200px}
        #auResultTable td.c-note{width:165px}
        .au-table th{position:sticky;top:0;z-index:2;background:#e6ecf4;color:#1f3350;font-weight:700;text-align:left;padding:6px 8px;border-bottom:2px solid #8fa3bf;border-right:1px solid var(--line);white-space:nowrap}
        .au-table th.sortable{cursor:pointer;user-select:none}
        .au-table th.sortable:hover{background:#d9e2ee}
        .au-table th .arr{color:#9aa8bb;margin-left:3px;font-size:11px}
        .au-table th.sorted .arr{color:var(--navy)}
        .au-table td{padding:5px 8px;border-bottom:1px solid #e1e7ef;border-right:1px solid #eef1f5;vertical-align:top}
        .au-table tbody tr:hover > td{background:#f5f8fc}
        .au-table .num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
        .au-table .nowrap{white-space:nowrap}
        .au-table tr.sev-error > td:first-child{box-shadow:inset 3px 0 0 #c0392b}
        .au-table tr.sev-warn > td:first-child{box-shadow:inset 3px 0 0 #d4a106}
        .au-table tr.sev-info > td:first-child{box-shadow:inset 3px 0 0 #3a74c4}
        .au-table tr.st-ok > td{opacity:.42}
        .au-table tr.st-ok:hover > td{opacity:.8}
        .au-table td.au-judge{white-space:nowrap}
        .au-table td.au-judge.bad{background:var(--ebg)!important}
        .au-small{font-size:12px;color:var(--mut)}
        .au-code{font-family:Consolas,monospace;font-weight:700;color:var(--navy)}
        .au-seg{display:inline-flex;border:1px solid #b5c1d1;border-radius:3px;overflow:hidden;background:#fff}
        .au-seg button{padding:2px 7px;font-size:12px;color:var(--mut);border-right:1px solid #d3dbe6;cursor:pointer;background:#fff}
        .au-seg button:last-child{border-right:none}
        .au-seg button:hover{background:#eef3f9}
        .au-seg button.on[data-v="pending"]{background:#5f6b7c;color:#fff}
        .au-seg button.on[data-v="bad"]{background:#b42318;color:#fff}
        .au-seg button.on[data-v="ok"]{background:#2e7a4d;color:#fff}
        .au-caseall{margin-top:5px;font-size:11px;color:var(--mut);display:grid;grid-template-columns:1fr 1fr;gap:3px;width:184px}
        .au-caseall span{grid-column:1/-1}
        .au-caseall button{border:1px solid #c9d2de;border-radius:2px;padding:0 5px;background:#fff;cursor:pointer;font-size:11px}
        .au-caseall button:hover{background:#eef3f9}
        .au-caseall button[data-v="bad"]{color:#a4161a}
        .au-caseall button[data-v="ok"]{color:#2e7a4d}
        .au-sev{display:inline-block;padding:0 7px;border-radius:2px;font-size:12px;font-weight:700;border:1px solid;white-space:nowrap;line-height:1.6}
        .au-sev.error{background:var(--ebg);color:var(--efg);border-color:var(--ebd)}
        .au-sev.warn{background:var(--wbg);color:var(--wfg);border-color:var(--wbd)}
        .au-sev.info{background:var(--ibg);color:var(--ifg);border-color:var(--ibd)}
        .au-chip{display:inline-flex;margin:1px 4px 3px 0;border:1px solid;border-radius:2px;font-size:12px;max-width:100%;line-height:1.5}
        .au-chip b{padding:0 5px;font-weight:700;border-right:1px solid;white-space:nowrap}
        .au-chip span{padding:0 6px;background:rgba(255,255,255,.65);word-break:break-all}
        .au-chip i{color:#94a3b8}
        .au-chip.error{background:var(--ebg);border-color:var(--ebd)} .au-chip.error b{color:var(--efg);border-color:var(--ebd)}
        .au-chip.warn{background:var(--wbg);border-color:var(--wbd)} .au-chip.warn b{color:var(--wfg);border-color:var(--wbd)}
        .au-chip.info{background:var(--ibg);border-color:var(--ibd)} .au-chip.info b{color:var(--ifg);border-color:var(--ibd)}
        .au-explink{font-size:12px;color:var(--navy2);text-decoration:underline;cursor:pointer;background:none;border:none;padding:0;margin-top:2px}
        .au-note{width:100%;min-width:130px;min-height:28px;font-size:12px;resize:vertical}
        .au-note.has{background:#fffdf1;border-color:#d8c67a}
        tr.au-exp > td{background:#f6f8fb!important;opacity:1!important;padding:8px 10px 10px 18px}
        .au-all{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:0 14px}
        .au-kv{display:flex;font-size:12px;border-bottom:1px dotted #cfd7e2;padding:2px 4px}
        .au-kv b{color:var(--mut);font-weight:500;min-width:120px;max-width:150px;margin-right:6px;flex-shrink:0}
        .au-kv span{word-break:break-all}
        .au-kv.error{background:var(--ebg)} .au-kv.error b{color:var(--efg);font-weight:700}
        .au-kv.warn{background:var(--wbg)} .au-kv.warn b{color:var(--wfg);font-weight:700}
        .au-kv.info{background:var(--ibg)} .au-kv.info b{color:var(--ifg);font-weight:700}
        .au-empty{text-align:center;padding:50px 10px;color:#8592a5;font-size:14px}
        .au-empty.good{color:#2e7a4d;font-weight:700}
        .au-pager{display:flex;gap:6px;align-items:center;justify-content:flex-end;padding:8px 14px;font-size:13px;border-top:1px solid var(--line);background:#fafbfd}
        .au-pager input{width:56px;text-align:center}
        .au-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
        .au-banner{display:flex;align-items:center;gap:14px;padding:8px 14px;border:1px solid var(--wbd);background:var(--wbg);color:var(--wfg);margin-bottom:12px;font-weight:700;font-size:13px;border-radius:3px}
        .au-banner.au-ok{border-color:#9fd0b2;background:#e5f5eb;color:#1f6b3f}
        .au-sticky{position:sticky;top:-14px;z-index:20;box-shadow:0 2px 6px rgba(0,0,0,.08)}
        .au-ms{position:relative}
        .au-ms-btn b{color:var(--navy)}
        .au-ms-panel{position:absolute;top:100%;left:0;margin-top:3px;width:320px;background:#fff;border:1px solid #8ea1bb;box-shadow:0 8px 20px rgba(15,30,60,.18);z-index:40;padding:8px;border-radius:3px}
        .au-ms-panel .au-input{width:100%}
        .au-ms-tools{display:flex;gap:12px;font-size:12px;padding:5px 2px;border-bottom:1px solid var(--line);margin-bottom:4px}
        .au-ms-tools a{color:var(--navy2);text-decoration:underline;cursor:pointer}
        .au-ms-list{max-height:300px;overflow:auto}
        .au-ms-opt{display:flex;align-items:center;gap:7px;padding:3px 4px;font-size:13px;cursor:pointer}
        .au-ms-opt:hover{background:#eef3f9}
        .au-ms-opt span{flex:1}
        .au-ms-opt em{font-style:normal;font-size:11px;color:#fff;background:#7d8ea6;border-radius:8px;padding:0 6px;font-variant-numeric:tabular-nums}
        .au-rules tr.au-rrow{cursor:pointer}
        .au-rules tr.au-rrow.off > td{color:#9aa4b2;background:#fafafa}
        .au-rules tr.au-rrow.off .au-sev{opacity:.5}
        .au-rules tr.au-rrow.open > td{background:#eef3f9}
        .au-rules .tog{color:var(--navy2);font-size:11px;width:20px;text-align:center}
        .au-rules td input[type=checkbox]{width:16px;height:16px;cursor:pointer;accent-color:var(--navy)}
        .au-rdetail > td{background:#f8fafc!important;padding:10px 16px 12px 40px}
        .au-dl{display:grid;grid-template-columns:90px 1fr;gap:6px 12px;font-size:13px}
        .au-dl dt{color:var(--mut);font-weight:700}
        .au-fchip{display:inline-block;border:1px solid #c3cfdf;background:#fff;border-radius:2px;padding:0 6px;margin:0 4px 3px 0;font-size:12px}
        .au-psec h4{font-weight:700;color:var(--navy);padding:7px 14px;background:#f2f5f9;border-bottom:1px solid var(--line);border-top:1px solid var(--line);font-size:14px}
        .au-psec:first-child h4{border-top:none}
        .au-pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:14px 18px;padding:12px 14px 14px}
        .au-param .au-label{margin-bottom:4px}
        .au-param .au-input{width:100%}
        .au-param textarea.au-input{min-height:58px;resize:vertical}
        .au-param.wide{grid-column:1/-1}
        .au-param .desc{font-size:12px;color:var(--mut);margin-bottom:4px}
        .au-use{font-size:12px;color:var(--mut);margin-top:4px;line-height:1.5}
        .au-use b{color:var(--navy)}
        .au-ptable{border-collapse:collapse;font-size:12px;width:100%}
        .au-ptable th{background:#e6ecf4;padding:4px 6px;border:1px solid var(--line);text-align:left;white-space:nowrap}
        .au-ptable td{border:1px solid var(--line);padding:2px 4px;vertical-align:middle}
        .au-ptable td .au-input{width:100%;padding:2px 5px;font-size:12px}
        .au-ptable td.n .au-input{text-align:right;min-width:70px}
        .au-ptable tr.grp td{border-top:2px solid #b5c1d1}
        @media (max-width: 1100px){ .au-upload{grid-template-columns:1fr} .au-stats{grid-template-columns:repeat(2,1fr)} }

        /* ════════ 買賣實例檢核：對齊共用元件的數值 ════════ */
        .au-root{font-size:15px;color:var(--text)}
        .au-root{--navy:var(--ink);--navy2:var(--ink-2);--line:#CFD8D6;--ink:#1B2429;--mut:#5A6A72;--ebg:#FDECEA;--efg:#B42318;--ebd:#F3B8B2}
        .au-card{border-color:#CFD8D6;border-radius:6px;margin-bottom:16px}
        .au-card-h{background:#fff;border-bottom:1px solid #E3E9E7;padding:12px 18px;font-size:16.5px;color:#1B2429;gap:10px;line-height:1.5}
        .au-headnote{margin-left:auto;font-size:13px;font-weight:400;color:#5A6A72}
        .au-card-b{padding:15px 18px}
        .au-btn{border-color:#CFD8D6;border-radius:5px;padding:5px 12px;font-size:14px;line-height:1.5;color:#1B2429}
        .au-btn:hover{background:#F2F5F4;border-color:#CFD8D6}
        .au-primary{background:#17324D;border-color:#17324D;color:#fff;font-weight:600}
        .au-primary:hover{background:#2A4A69;border-color:#2A4A69}
        .au-dl{background:#2E7D4F;border-color:#2E7D4F;color:#fff;font-weight:600}
        .au-dl:hover{background:#256A42;border-color:#256A42}
        .au-danger{color:#B42318;border-color:#F3B8B2}
        .au-input{border-color:#CFD8D6;border-radius:5px;padding:5px 8px;font-size:14px}
        .au-label{font-size:13.5px;color:#1B2429}
        .au-filters{background:#fff;padding:12px 18px;border-bottom:1px solid #E3E9E7}
        .au-filters-2{background:#F7FAF9;padding:8px 18px}
        .au-fl{font-size:13.5px;font-weight:600;color:#5A6A72}
        .au-stats{border-color:#CFD8D6;border-radius:6px;background:#fff;overflow:hidden}
        .au-stat{padding:11px 15px;border-right:1px solid #E3E9E7}
        .au-stat:first-child{background:#F4F7FA}
        .au-stat .k{font-size:13.5px;color:#5A6A72}
        .au-stat .v{font-size:27px;line-height:1.15;color:#17324D}
        .au-numbox{border-color:#CFD8D6;border-radius:6px;overflow:hidden;margin-top:14px}
        .au-numhead{background:#F4F7FA;color:#1B2429;font-size:14px;padding:8px 14px}
        .au-log{border-radius:6px;border-color:#E3E9E7;background:#F7FAF9}
        .au-table{font-size:13.5px}
        .au-table th{background:#F4F7FA;color:#1B2429;font-weight:600;font-size:13px;padding:8px 9px;border-bottom:1px solid #CFD8D6;border-right:0}
        .au-table td{padding:7px 9px;border-bottom:1px solid #E3E9E7;border-right:0}
        .au-table tr.st-ok > td{opacity:.5}
        .au-seg{border-color:#CFD8D6;border-radius:5px}
        .au-seg button{padding:3px 9px;font-size:12.5px;line-height:1.5;border-right-color:#CFD8D6}
        .au-seg button[data-v="bad"]{color:#B42318}
        .au-seg button.on[data-v="pending"]{background:#6B7A82;color:#fff}
        .au-seg button.on[data-v="bad"]{background:#B42318;color:#fff}
        .au-seg button.on[data-v="ok"]{background:#6E7C84;color:#fff}
        .au-caseall button{border-color:#CFD8D6;border-radius:4px;padding:1px 6px;font-size:12px}
        .au-chip{display:block;border:0!important;background:none!important;margin:1px 0;font-size:12.5px;line-height:1.6}
        .au-chip b{font-weight:500;color:#5A6A72;border:0!important;padding:0}
        .au-chip b::after{content:"："}
        .au-chip span{background:#FDECEA;color:#B42318;font-weight:600;padding:0 4px;border-radius:3px}
        .au-note{border-color:#CFD8D6;border-radius:4px;font-size:13px}
        .au-note:placeholder-shown{background:#FCFDFD;border-style:dashed}
        .au-pager{background:#fff;border-top:1px solid #E3E9E7}
        .au-banner{border-radius:6px;font-size:13.5px;font-weight:600}
        .au-ms-panel{border-color:#CFD8D6;border-radius:6px;box-shadow:0 8px 24px rgba(23,50,77,.16)}
        .au-psec h4{background:#F7FAF9;color:#1B2429;font-size:14.5px;padding:9px 18px}
        .au-pgrid{padding:14px 18px}
        .au-ptable th{background:#F4F7FA}
        .au-uprow .au-w-year,.au-uprow .au-hintbox,.au-uprow .au-file,.au-run{height:36px}
        .au-hintbox{border-color:#CFD8D6;border-radius:5px;background:#F7FAF9}
        .au-run{padding:0 26px;border-radius:5px}
        /* 規則清單：與 10日檢核相同的展開式清單 */
        .au-rulelist{padding:12px 18px 6px}
        .au-rule{border:1px solid #E3E9E7;border-radius:6px;margin-bottom:7px;background:#fff}
        .au-rule.off{background:#FAFAFA}
        .au-rule .hd{display:flex;gap:10px;align-items:center;padding:8px 11px;cursor:pointer;flex-wrap:wrap}
        .au-rule .hd:hover{background:#F7FAFC}
        .au-rule .hd input{width:16px;height:16px;accent-color:#17324D;cursor:pointer}
        .au-rule .hd .ar{color:#5A6A72;font-size:11px;width:12px}
        .au-rule .hd code{font:12px/1.8 Consolas,"Courier New",monospace;color:#5A6A72;min-width:40px}
        .au-rule .hd .nm{font-weight:500;flex:1;min-width:220px}
        .au-rule.off .hd .nm{color:#8C979C;text-decoration:line-through}
        .au-rule .hd .gt{font-size:12px;color:#5A6A72;border:1px solid #E3E9E7;border-radius:3px;padding:0 6px;white-space:nowrap}
        .au-rule .bd{padding:0 12px 12px 64px;font-size:13.5px}
        .au-rule .bd dl{display:grid;grid-template-columns:86px 1fr;gap:4px 12px;margin:0}
        .au-rule .bd dt{color:#5A6A72;font-size:13px}
        .au-rule .bd dd{margin:0}
        .au-rule .bd .au-fchip{background:#EEF3F7;border:0;border-radius:3px;padding:1px 7px;font-size:12.5px}
        .au-empty{color:#5A6A72}

</style>
