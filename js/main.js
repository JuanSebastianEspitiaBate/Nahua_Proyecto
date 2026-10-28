/* NAHUA · Mejoras con JavaScript (el sitio sigue funcionando sin este archivo) */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* 1. Menú móvil: cerrar al elegir un enlace, con Escape o al hacer clic fuera */
  var toggle = document.getElementById('nav-toggle');
  if (toggle) {
    var close = function () { toggle.checked = false; };
    document.querySelectorAll('.main-nav a').forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    document.addEventListener('click', function (e) { if (!e.target.closest('.site-header')) close(); });
  }

  /* 2. Cabecera con sombra al hacer scroll + botón "volver arriba" */
  var header = document.querySelector('.site-header');
  var top = document.createElement('a');
  top.href = '#contenido';
  top.className = 'to-top';
  top.setAttribute('aria-label', 'Volver arriba');
  top.textContent = '↑';
  document.body.appendChild(top);
  var onScroll = function () {
    var y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 20);
    top.classList.toggle('show', y > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* 3. Aparición al hacer scroll en navegadores sin animation-timeline */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var supportsTimeline = window.CSS && CSS.supports && CSS.supports('animation-timeline: view()');
  if (!supportsTimeline && !reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('reveal-pre'); io.observe(el); });
  }

  /* 4. Contadores animados (meta 2030) */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduce) {
    var fmt = new Intl.NumberFormat('es-CO', { useGrouping: true });
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var end = parseInt(el.getAttribute('data-count'), 10);
        var raw = el.getAttribute('data-nogroup') === 'true';
        var start = null, dur = 1600;
        var step = function (ts) {
          if (start === null) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var v = Math.round(end * (1 - Math.pow(1 - p, 3)));
          el.textContent = raw ? String(v) : fmt.format(v);
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        co.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { c.textContent = '0'; co.observe(c); });
  }

  /* 5. Visor de productos: Escape cierra, flechas izquierda/derecha cambian de producto */
  var boxes = Array.prototype.slice.call(document.querySelectorAll('.lightbox'));
  if (boxes.length) {
    var current = function () {
      return boxes.findIndex(function (b) { return ('#' + b.id) === location.hash; });
    };
    document.addEventListener('keydown', function (e) {
      var i = current();
      if (i < 0) return;
      if (e.key === 'Escape') { location.hash = 'catalogo'; }
      else if (e.key === 'ArrowRight') { location.hash = boxes[(i + 1) % boxes.length].id; }
      else if (e.key === 'ArrowLeft') { location.hash = boxes[(i - 1 + boxes.length) % boxes.length].id; }
    });
    boxes.forEach(function (b) {
      b.addEventListener('click', function (e) { if (e.target === b) location.hash = 'catalogo'; });
      var t = b.querySelector('.lightbox-text');
      if (t) {
        var tip = document.createElement('p');
        tip.className = 'form-note';
        tip.textContent = 'Tip: usa las flechas ← → del teclado para ver otro producto.';
        t.appendChild(tip);
      }
    });
  }

  /* 6. Formularios (contacto y boletín).
        Si el formulario tiene data-endpoint (por ejemplo Formspree) se envía directo con fetch;
        si no, se mantiene el envío por correo (mailto) y se muestra un aviso. */
  document.querySelectorAll('form[data-form]').forEach(function (form) {
    var status = form.querySelector('.form-status') || (form.parentNode && form.parentNode.querySelector('.form-status'));
    var say = function (msg, ok) {
      if (!status) return;
      status.textContent = msg;
      status.className = 'form-status ' + (ok ? 'ok' : 'err');
    };
    form.addEventListener('submit', function (e) {
      var endpoint = form.getAttribute('data-endpoint');
      if (!endpoint) { say('Se abrirá tu aplicación de correo para enviar el mensaje.', true); return; }
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      say('Enviando…', true);
      fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error('fallo');
          form.reset();
          say(form.getAttribute('data-ok') || '¡Gracias! Recibimos tu mensaje.', true);
        })
        .catch(function () { say('No pudimos enviar el mensaje. Inténtalo de nuevo o escríbenos por correo.', false); })
        .then(function () { if (btn) btn.disabled = false; });
    });
  });
})();
