/* Renewables Vault — shared account helpers (do not edit) */
var RV = {
  api: function () { return (typeof RV_API === 'string' && /^https:\/\//.test(RV_API)) ? RV_API : ''; },
  key: function (email, pass) {
    var d = new TextEncoder().encode(String(email).toLowerCase().trim() + '|' + pass + '|RV');
    return crypto.subtle.digest('SHA-256', d).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    });
  },
  post: function (body) {
    return fetch(RV.api(), { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); });
  },
  /* Save an account returned by the server on this browser and log in */
  restore: function (profile, assets, pass) {
    var email = String(profile.email).toLowerCase(), users = [];
    try { users = JSON.parse(localStorage.getItem('rv_users')) || []; } catch (e) {}
    var old = users.filter(function (u) { return String(u.email).toLowerCase() === email; })[0];
    users = users.filter(function (u) { return String(u.email).toLowerCase() !== email; });
    var u = {}; for (var k in profile) u[k] = profile[k];
    u.password = pass; u.status = 'pending'; u.consent = true;
    u.approved = !!(old && old.approved);
    users.push(u);
    localStorage.setItem('rv_users', JSON.stringify(users));
    localStorage.setItem('rv_user', JSON.stringify(u));
    if (profile.type === 'developer' && assets) {
      var key = 'rv_assets_' + email, local = [];
      try { local = JSON.parse(localStorage.getItem(key)) || []; } catch (e) {}
      var ids = {}; assets.forEach(function (a) { ids[a.id] = 1; });
      local.forEach(function (a) { if (!ids[a.id]) assets.push(a); });
      localStorage.setItem(key, JSON.stringify(assets));
    }
    return u;
  },
  home: function (u) { return u.type === 'investor' ? 'dashboard-investor.html' : 'dashboard-developer.html'; }
};
