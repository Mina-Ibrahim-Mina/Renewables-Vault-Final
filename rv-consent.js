/* Renewables Vault: cookie consent. Google Analytics loads only after the visitor clicks Accept. The choice is kept
 * in this browser; "Cookie settings" on the Legal page shows the choice again. */
(function () {
  var ID = 'G-X19FH9Z28D', K = 'rv_consent';
  var get = function () { try { return localStorage.getItem(K); } catch (e) { return null; } };
  var set = function (v) { try { localStorage.setItem(K, v); } catch (e) {} };
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  function load() {
    if (window.__rvga) return; window.__rvga = 1;
    var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.appendChild(s);
    window.gtag('js', new Date()); window.gtag('config', ID, { anonymize_ip: true });
  }
  function banner() {
    if (document.getElementById('rvCookie')) return;
    var d = document.createElement('div');
    d.id = 'rvCookie'; d.setAttribute('role', 'region'); d.setAttribute('aria-label', 'Cookie choice');
    d.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:560px;margin:0 auto;background:#0f1f14;color:#e5efe8;border:1px solid rgba(74,222,128,.3);border-radius:12px;padding:16px 18px;box-shadow:0 12px 30px rgba(0,0,0,.35);font:14px/1.55 Inter,Arial,sans-serif;';
    d.innerHTML = '<div style="margin-bottom:12px;">We use Google Analytics to count visits and improve this site, only if you agree. ' +
      '<a href="legal.html#cookies" style="color:#4ADE80;">Learn more</a></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
      '<button type="button" id="rvCookieNo" style="background:transparent;color:#e5efe8;border:1px solid rgba(255,255,255,.35);border-radius:8px;padding:8px 16px;font:600 13px Inter,Arial,sans-serif;cursor:pointer;">Decline</button>' +
      '<button type="button" id="rvCookieYes" style="background:#4ADE80;color:#0f1f14;border:none;border-radius:8px;padding:8px 18px;font:700 13px Inter,Arial,sans-serif;cursor:pointer;">Accept</button></div>';
    document.body.appendChild(d);
    document.getElementById('rvCookieYes').addEventListener('click', function () { set('yes'); d.remove(); load(); });
    document.getElementById('rvCookieNo').addEventListener('click', function () { set('no'); d.remove(); });
  }
  window.rvCookieSettings = function () {
    try { localStorage.removeItem(K); } catch (e) {}
    if (window.__rvga) { set('no'); location.reload(); return; }   // stop analytics already running on this page
    banner();
  };
  var c = get();
  if (c === 'yes') load();
  else if (c !== 'no') { if (document.body) banner(); else document.addEventListener('DOMContentLoaded', banner); }
})();
