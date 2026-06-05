(function() {
 const pages = [
 { href: '/planner.html', label: '예산 플래너', icon: '' },
 { href: '/ambassador.html', label: '앰버서더', icon: '' },
 { href: '/ads.html', label: '광고 관리', icon: '' },
 { href: '/cheomdan.html', label: '체험단', icon: '' },
 { href: '/viral.html', label: '바이럴', icon: '' },
 { href: '/products.html', label: '제품 관리', icon: '' },
 ];
 const current = location.pathname.split('/').pop();
 const nav = document.getElementById('globalNav');
 if (!nav) return;
 nav.innerHTML = pages.map(p => {
 const active = current === p.href.replace('/','');
 return `<a href="${p.href}" class="gnav-link ${active ? 'active' : ''}">${p.icon} ${p.label}</a>`;
 }).join('');
})();
