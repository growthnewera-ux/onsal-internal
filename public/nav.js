// 공통 네비게이션 렌더러
(function() {
  const pages = [
    { href: '/planner.html',    label: '예산 플래너',  icon: '📊' },
    { href: '/ambassador.html', label: '앰버서더',     icon: '👥' },
    { href: '/ads.html',        label: '광고 관리',    icon: '📢' },
  ];
  const current = location.pathname.split('/').pop();

  const nav = document.getElementById('globalNav');
  if (!nav) return;
  nav.innerHTML = pages.map(p => {
    const active = current === p.href.replace('/','');
    return `<a href="${p.href}" class="gnav-link ${active ? 'active' : ''}">${p.icon} ${p.label}</a>`;
  }).join('');
})();
