/**
 * db-sync.js
 * 모든 HTML 페이지에서 localStorage ↔ Neon DB 자동 동기화
 * 어느 기기 · 브라우저에서 접속해도 동일한 데이터 유지
 */
(function () {
  const SYNC_KEYS = [
    'onsal_candidates_v1',
    'onsal_ambassadors_v1',
    'onsal_products_v1',
    'cat_budgets_v2',
    'onsal_plan_v1',
    'onsal_cheomdan_v1',
    'onsal_viral_v1',
    'onsal_ads_v2',
    // yt_cache는 제외 (크고 자주 바뀌는 캐시)
  ];

  // ── DB → localStorage 동기화 (페이지 로드 시) ──────────────
  async function syncFromDB() {
    try {
      const res = await fetch('/api/data');
      if (!res.ok) return;
      const rows = await res.json(); // [{key, value}, ...]
      let changed = false;
      rows.forEach(row => {
        if (SYNC_KEYS.includes(row.key) && row.value !== null) {
          const serialized = JSON.stringify(row.value);
          // localStorage보다 DB가 최신이면 덮어쓰기
          if (localStorage.getItem(row.key) !== serialized) {
            _origSetItem(row.key, serialized);
            changed = true;
          }
        }
      });
      if (changed) triggerRerender();
    } catch (e) {
      console.warn('[db-sync] DB 로드 실패, 로컬 데이터 사용:', e.message);
    }
  }

  // ── localStorage → DB 저장 (setItem 호출 시 자동) ──────────
  const _origSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function (key, value) {
    _origSetItem(key, value);
    if (SYNC_KEYS.includes(key)) {
      try {
        const parsed = JSON.parse(value);
        fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value: parsed }),
        }).catch(() => {});
      } catch (_) {}
    }
  };

  // ── 변경 시 렌더 함수들 재호출 ─────────────────────────────
  function triggerRerender() {
    const fns = [
      'renderCands', 'renderAmbs', 'renderProducts',
      'renderMain', 'renderAll', 'renderMonthlyView',
      'renderTable', 'renderPlanTable', 'renderCatGrid',
    ];
    fns.forEach(fn => {
      try { if (typeof window[fn] === 'function') window[fn](); } catch (_) {}
    });
  }

  // ── 초기화: 페이지 로드 후 DB에서 최신 데이터 가져오기 ─────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncFromDB);
  } else {
    // 이미 DOMContentLoaded 이후면 약간 지연 후 실행 (페이지 init 후)
    setTimeout(syncFromDB, 300);
  }

  // ── 전역으로 수동 동기화 함수 노출 ─────────────────────────
  window.dbSync = syncFromDB;
})();
