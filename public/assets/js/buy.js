// Stripe checkout for "Buy" buttons, and the thank-you page.
// Buttons: <button data-buy data-product="van-stock">. The server creates a Stripe Checkout Session
// and we send the buyer to Stripe's payment page.
(function () {
  document.querySelectorAll('[data-buy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var label = btn.innerHTML;
      btn.disabled = true; btn.textContent = 'Opening secure checkout…';
      var body = new URLSearchParams({ product: btn.getAttribute('data-product') });
      fetch('/api/checkout.php', { method: 'POST', body: body, headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.url) throw new Error(j.error || 'Checkout unavailable'); return j; }); })
        .then(function (j) { window.location.href = j.url; })
        .catch(function (e) {
          alert('Sorry, the checkout couldn’t open (' + e.message + '). Please try again, or contact us.');
          btn.disabled = false; btn.innerHTML = label;
        });
    });
  });
  // Coming back with the browser's Back button: re-enable buttons.
  window.addEventListener('pageshow', function () { document.querySelectorAll('[data-buy]').forEach(function (b) { b.disabled = false; }); });

  // Thank-you page: swap the order number for a download link, retrying while the payment settles.
  var box = document.getElementById('download-box');
  if (box) {
    var txn = new URLSearchParams(location.search).get('session_id');
    var status = document.getElementById('download-status');
    var tries = 0;
    var show = function (html, cls) { status.innerHTML = html; status.className = 'form-status ' + (cls || ''); };
    if (!txn) { show('We couldn’t find your order reference. Your link has also been emailed to you.', 'err'); return; }
    var check = function () {
      fetch('/api/claim.php?session_id=' + encodeURIComponent(txn), { headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, status: r.status, j: j }; }); })
        .then(function (res) {
          if (res.status === 202 && tries++ < 15) { show('Confirming your payment…'); setTimeout(check, 2000); return; }
          if (res.status === 403) { show(res.j.error, 'err'); return; } // non-UK buyer, already refunded
          if (!res.ok || !res.j.url) throw new Error(res.j.error || 'Not ready');
          var a = document.getElementById('download-link');
          var mail = res.j.email ? 'We’ve also emailed it to <strong>' + res.j.email.replace(/</g, '&lt;') + '</strong>. ' : '';
          a.href = res.j.url; a.hidden = false;
          if (res.j.type === 'app') {
            a.textContent = 'Open ' + res.j.product;
            var copy = document.getElementById('copy-link');
            if (copy) { copy.hidden = false; copy.onclick = function () { navigator.clipboard.writeText(res.j.url).then(function () { copy.textContent = 'Link copied'; }); }; }
            var steps = document.getElementById('install-steps'); if (steps) steps.hidden = false;
            show('Payment confirmed. This is your personal link. ' + mail + 'Keep the email safe in case you change phone.', 'ok');
          } else {
            show('Payment confirmed. ' + mail + 'The link works for ' + res.j.link_days + ' days and up to ' + res.j.max_downloads + ' downloads.', 'ok');
          }
        })
        .catch(function (e) {
          show('We couldn’t confirm your order just yet (' + e.message + '). Your link will arrive by email shortly. Order reference: <strong>' + txn.replace(/</g, '&lt;') + '</strong>.', 'err');
        });
    };
    check();
  }
})();
