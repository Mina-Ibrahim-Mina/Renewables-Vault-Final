/* Renewables Vault: shared account helpers (do not edit) */
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
  /* Save an account returned by the server on this browser and log in. Only the one-way key is kept, never the password. */
  restore: function (profile, assets, key) {
    var email = String(profile.email).toLowerCase(), users = [];
    try { users = JSON.parse(localStorage.getItem('rv_users')) || []; } catch (e) {}
    var old = users.filter(function (u) { return String(u.email).toLowerCase() === email; })[0];
    users = users.filter(function (u) { return String(u.email).toLowerCase() !== email; });
    var u = {}; for (var k in profile) u[k] = profile[k];
    u.k = key; delete u.password; u.status = 'pending'; u.consent = true;
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
  ascii: function (s) {
    return String(s == null ? '' : s)
      .replace(/[\u0660-\u0669]/g, function (d) { return String(d.charCodeAt(0) - 0x0660); })
      .replace(/[\u06F0-\u06F9]/g, function (d) { return String(d.charCodeAt(0) - 0x06F0); })
      .replace(/\u066C/g, ',').replace(/\u066B/g, '.');
  },
  /* Register on the server first. cb(result): 'new' | 'restored' (same email+password existed) | 'exists' | 'check' (looked automated: press again) | 'offline' */
  serverRegister: function (body, pass, cb, knownKey) {
    if (!RV.api()) return cb('offline');
    (knownKey ? Promise.resolve(knownKey) : RV.key(body.email, pass)).then(function (k) { body.key = k; return RV.post(body); }).then(function (r) {
      if (r && r.ok && r.existing) { RV.restore(r.profile, r.assets, r.session || body.key); cb('restored', r.session || body.key); }
      else if (r && r.ok) cb('new', r.session || body.key);
      else if (r && r.error === 'exists') cb('exists');
      else if (r && r.error === 'check') cb('check');
      else cb('offline');
    }).catch(function () { cb('offline'); });
  },
  /* The key for a logged in user. Older sessions that still hold the password are upgraded once: the password is replaced by the key. */
  userKey: function (u) {
    if (u && RV.isCred(u.k)) return Promise.resolve(u.k);
    if (!u || !u.password) return Promise.resolve('');
    return RV.key(u.email, u.password).then(function (k) {
      u.k = k; delete u.password;
      try {
        var cur = JSON.parse(localStorage.getItem('rv_user') || 'null');
        if (cur && String(cur.email).toLowerCase() === String(u.email).toLowerCase()) { cur.k = k; delete cur.password; localStorage.setItem('rv_user', JSON.stringify(cur)); }
        var us = JSON.parse(localStorage.getItem('rv_users') || '[]');
        us.forEach(function (x) { if (String(x.email).toLowerCase() === String(u.email).toLowerCase()) { x.k = k; delete x.password; } });
        localStorage.setItem('rv_users', JSON.stringify(us));
      } catch (e) {}
      return k;
    });
  },
  /* What the browser keeps after login: a session pass (rvs1...) from the server, or an older login key */
  isCred: function (k) { return /^[a-f0-9]{64}$/.test(k || '') || /^rvs1\.[a-z0-9]{6,12}\.[a-f0-9]{64}$/.test(k || ''); },
  home: function (u) { return u.type === 'investor' ? 'dashboard-investor.html' : 'dashboard-developer.html'; },
  /* Optional profile photo or company logo. mode 'cover' crops a photo to a square, 'contain' fits a logo on white. cb(dataUrl) or cb(null, message) */
  pickPhoto: function (mode, cb) {
    var inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*'; inp.style.display = 'none';
    document.body.appendChild(inp);
    inp.onchange = function () {
      var f = inp.files && inp.files[0]; document.body.removeChild(inp);
      if (!f) return;
      if (!/^image\//.test(f.type || 'image/')) return cb(null, 'Please choose an image file (JPG or PNG).');
      if (f.size > 15 * 1024 * 1024) return cb(null, 'This image is too large. Please choose one under 15 MB.');
      var rd = new FileReader();
      rd.onerror = function () { cb(null, 'Could not read this image. Please try a JPG or PNG.'); };
      rd.onload = function () {
        var img = new Image();
        img.onerror = function () { cb(null, 'Could not read this image. Please try a JPG or PNG.'); };
        img.onload = function () {
          var S = 240, c = document.createElement('canvas'); c.width = S; c.height = S;
          var x = c.getContext('2d'), w = img.naturalWidth, h = img.naturalHeight;
          x.fillStyle = '#ffffff'; x.fillRect(0, 0, S, S);
          if (mode === 'contain') { var k = Math.min((S - 24) / w, (S - 24) / h); x.drawImage(img, (S - w * k) / 2, (S - h * k) / 2, w * k, h * k); }
          else { var m = Math.min(w, h); x.drawImage(img, (w - m) / 2, (h - m) / 2, m, m, 0, 0, S, S); }
          var q = 0.85, out = c.toDataURL('image/jpeg', q);
          while (out.length > 40000 && q > 0.4) { q -= 0.15; out = c.toDataURL('image/jpeg', q); }
          cb(out);
        };
        img.src = rd.result;
      };
      rd.readAsDataURL(f);
    };
    inp.click();
  },
  /* LinkedIn profile or company page: returns a clean https link, or '' if it is not a LinkedIn link */
  linkedin: function (s) {
    s = String(s || '').trim().replace(/\s+/g, '');
    if (!s) return '';
    if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
    s = s.replace(/^http:/i, 'https:').split(/[?#]/)[0];
    return /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/(in|company|pub|profile|school)\/[^\/\s]+/i.test(s) ? s : '';
  },
  avatar: function (img, name, size, square) {
    var ini = String(name || '?').trim().split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase();
    var st = 'width:' + size + 'px;height:' + size + 'px;border-radius:' + (square ? '12px' : '50%') + ';flex-shrink:0;';
    if (img && /^data:image\//.test(img)) return '<img src="' + img + '" alt="" style="' + st + 'object-fit:cover;border:1px solid #d1e8d8;background:#fff;">';
    return '<div style="' + st + 'background:#1A472A;color:#4ADE80;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:' + Math.round(size * 0.38) + 'px;">' + ini.replace(/[<>&"]/g, '') + '</div>';
  }
};

/* Older versions of the site kept the password itself in this browser. Any that are left are replaced once by the
 * one-way key, so no readable password stays on the device. */
(function () {
  try {
    var read = function (k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
    var todo = read('rv_users', []).concat([read('rv_user', null)]).filter(function (x) { return x && x.email && x.password; });
    if (!todo.length || !window.crypto || !crypto.subtle) return;
    var keys = {};
    Promise.all(todo.map(function (x) {
      return RV.key(x.email, x.password).then(function (k) { keys[String(x.email).toLowerCase() + '|' + x.password] = k; });
    })).then(function () {
      var fix = function (x) {
        if (!x || !x.password) return x;
        var k = keys[String(x.email).toLowerCase() + '|' + x.password];
        if (k) { if (!/^[a-f0-9]{64}$/.test(x.k || '')) x.k = k; delete x.password; }
        return x;
      };
      localStorage.setItem('rv_users', JSON.stringify(read('rv_users', []).map(fix)));   // read again: the page may have changed it meanwhile
      var cur = read('rv_user', null);
      if (cur && cur.password) localStorage.setItem('rv_user', JSON.stringify(fix(cur)));
    }).catch(function () {});
  } catch (e) {}
})();

/* Session passes. Browsers that still hold the older login key swap it once for a session pass, which reveals nothing
 * about the password and expires 30 days after login. Keys of other accounts once used on this browser are removed.
 * An expired pass logs the browser out. */
(function () {
  try {
    var read = function (k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
    var cur = read('rv_user', null), me = cur && String(cur.email || '').toLowerCase();
    var us = read('rv_users', []), changed = false;
    us.forEach(function (x) { if (x && String(x.email || '').toLowerCase() !== me && /^[a-f0-9]{64}$/.test(x.k || '')) { delete x.k; changed = true; } });
    if (changed) localStorage.setItem('rv_users', JSON.stringify(us));
    if (!cur) return;
    var m = /^rvs1\.([a-z0-9]+)\./.exec(cur.k || '');
    if (m && parseInt(m[1], 36) < Date.now()) {                      // pass expired: log out on this browser
      localStorage.removeItem('rv_user');
      localStorage.setItem('rv_users', JSON.stringify(read('rv_users', []).filter(function (x) { return String(x && x.email || '').toLowerCase() !== me; })));
      return;
    }
    if (!/^[a-f0-9]{64}$/.test(cur.k || '') || !RV.api()) return;
    RV.post({ action: 'session', email: cur.email, key: cur.k }).then(function (r) {
      if (!r || !r.ok || !r.session) return;
      var fix = function (x) { if (x && String(x.email || '').toLowerCase() === me && /^[a-f0-9]{64}$/.test(x.k || '')) x.k = r.session; return x; };
      if (window.U && typeof window.U === 'object') fix(window.U);   // the dashboard's own copy, so it never saves the old key back
      var now = read('rv_user', null); if (now) localStorage.setItem('rv_user', JSON.stringify(fix(now)));
      localStorage.setItem('rv_users', JSON.stringify(read('rv_users', []).map(fix)));
    }).catch(function () {});
  } catch (e) {}
})();
