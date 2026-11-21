// Paddle checkout for "Buy" buttons, and the thank-you page download.
// Buttons: <button data-buy data-price-id="pri_..." data-thanks="/work/van-stock/thanks/">
(function () {
  var cfg = document.getElementById('paddle-config');
  if (!cfg) return;
  var env = cfg.getAttribute('data-environment');
  var token = cfg.getAttribute('data-token');
  var ready = null;

  function loadPaddle() {
    if (ready) return ready;
    ready = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
      s.onload = function () {
        if (env === 'sandbox') window.Paddle.Environment.set('sandbox');
        window.Paddle.Initialize({
          token: token,
          eventCallback: function (ev) {
            if (ev.name === 'checkout.completed' && ev.data && ev.data.transaction_id) {
              var thanks = (window.__buyThanks || '/');
              window.location.href = thanks + '?txn=' + encodeURIComponent(ev.data.transaction_id);
            }
          },
        });
        resolve(window.Paddle);
      };
      s.onerror = function () { ready = null; reject(new Error('Paddle failed to load')); };
      document.head.appendChild(s);
    });
    return ready;
  }

  document.querySelectorAll('[data-buy]').forEach(function (btn) {
    btn.addEventListener('pointerenter', loadPaddle, { once: true }); // warm up before the click
    btn.addEventListener('click', function () {
      var label = btn.innerHTML;
      btn.disabled = true; btn.textContent = 'Opening secure checkout…';
      window.__buyThanks = btn.getAttribute('data-thanks');
      loadPaddle().then(function (Paddle) {
        Paddle.Checkout.open({
          items: [{ priceId: btn.getAttribute('data-price-id'), quantity: 1 }],
          settings: { displayMode: 'overlay', theme: 'light', locale: 'en', allowLogout: false },
        });
      }).catch(function () {
        alert('Sorry, the checkout couldn’t load. Please check your connection and try again, or contact us.');
      }).finally(function () { btn.disabled = false; btn.innerHTML = label; });
    });
  });

  // Thank-you page: swap the order number for a download link, retrying while the payment settles.
  var box = document.getElementById('download-box');
  if (box) {
    var txn = new URLSearchParams(location.search).get('txn');
    var status = document.getElementById('download-status');
    var tries = 0;
    var show = function (html, cls) { status.innerHTML = html; status.className = 'form-status ' + (cls || ''); };
    if (!txn) { show('We couldn’t find your order number. Your download link has also been emailed to you.', 'err'); return; }
    var check = function () {
      fetch('/api/claim.php?txn=' + encodeURIComponent(txn), { headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, status: r.status, j: j }; }); })
        .then(function (res) {
          if (res.status === 202 && tries++ < 15) { show('Confirming your payment…'); setTimeout(check, 2000); return; }
          if (!res.ok || !res.j.download_url) throw new Error(res.j.error || 'Not ready');
          var a = document.getElementById('download-link');
          a.href = res.j.download_url; a.hidden = false;
          show('Payment confirmed. ' + (res.j.email ? 'We’ve also emailed the link to <strong>' + res.j.email.replace(/</g, '&lt;') + '</strong>. ' : '') +
            'It works for ' + res.j.link_days + ' days and up to ' + res.j.max_downloads + ' downloads.', 'ok');
        })
        .catch(function (e) {
          show('We couldn’t confirm your download just yet (' + e.message + '). Your link will arrive by email shortly. Order number: <strong>' + txn.replace(/</g, '&lt;') + '</strong>.', 'err');
        });
    };
    check();
  }
})();
