// Toffee Apple Web: small progressive enhancements. The site works without this file.
(function () {
  document.documentElement.classList.add('js');

  // Mobile menu
  var btn = document.querySelector('.menu-btn');
  var links = document.getElementById('nav-links');
  if (btn && links) {
    btn.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && links.classList.contains('open')) { links.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
    });
  }

  // Header border once scrolled
  var header = document.querySelector('.site-header');
  var onScroll = function () { header && header.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Reveal on scroll
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else { items.forEach(function (el) { el.classList.add('in'); }); }

  // Portfolio filters
  var filterBar = document.querySelector('.filters');
  if (filterBar) {
    filterBar.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var f = b.getAttribute('data-filter');
      filterBar.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      document.querySelectorAll('[data-kind]').forEach(function (card) {
        card.hidden = !(f === 'all' || card.getAttribute('data-kind').split(' ').indexOf(f) !== -1);
      });
    });
  }

  // Contact form: sends to the existing /sendText.php handler (texts Peter) without leaving the page.
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = document.getElementById('form-status');
      if (form.elements.website && form.elements.website.value) return; // honeypot
      var params = new URLSearchParams();
      ['name', 'phone', 'email', 'message'].forEach(function (k) { params.append(k, form.elements[k].value.trim()); });
      var svc = form.elements.service; var extra = svc && svc.value ? '[' + svc.value + '] ' : '';
      params.set('message', extra + params.get('message'));
      var submit = form.querySelector('button[type=submit]');
      submit.disabled = true; submit.textContent = 'Sending…';
      fetch(form.action + '?' + params.toString(), { method: 'GET' })
        .then(function (r) { if (!r.ok) throw new Error(r.status); })
        .then(function () {
          status.className = 'form-status ok'; status.hidden = false;
          status.textContent = 'Thanks ' + (form.elements.name.value.split(' ')[0] || '') + ', your message is on its way. We’ll be in touch soon.';
          form.reset();
        })
        .catch(function () {
          status.className = 'form-status err'; status.hidden = false;
          status.innerHTML = 'Sorry, that didn’t send. Please email <a href="mailto:info@uk-web-apps.co.uk">info@uk-web-apps.co.uk</a> or call 07723 104412.';
        })
        .finally(function () { submit.disabled = false; submit.textContent = 'Send message'; status.focus(); });
    });
  }

  var y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
})();
