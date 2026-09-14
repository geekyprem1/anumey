// ===== Vorendis — interactions & animations =====

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Sticky + hide-on-scroll nav ---------- */
const nav = document.getElementById('nav');
let lastY = 0;
const onScroll = () => {
  const y = window.scrollY;
  if (y > 30) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
  // hide when scrolling down past hero, show when scrolling up
  if (y > 300 && y > lastY && !nav.classList.contains('open')) nav.classList.add('hidden');
  else nav.classList.remove('hidden');
  lastY = y;
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Mobile nav toggle ---------- */
const toggle = document.getElementById('navToggle');
if (toggle) {
  toggle.setAttribute('aria-expanded', 'false');
  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
  // close mobile menu when a real link is tapped
  document.querySelectorAll('.nav-links a').forEach(a =>
    a.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    })
  );
}

/* ---------- Dropdown / submenu ---------- */
const dropdownItems = document.querySelectorAll('.nav-item[data-dropdown]');
dropdownItems.forEach(item => {
  const trigger = item.querySelector('.nav-trigger');
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    const willOpen = !item.classList.contains('open');
    // close siblings
    dropdownItems.forEach(other => {
      if (other !== item) { other.classList.remove('open'); other.querySelector('.nav-trigger').setAttribute('aria-expanded', 'false'); }
    });
    item.classList.toggle('open', willOpen);
    trigger.setAttribute('aria-expanded', String(willOpen));
  });
});

// close open dropdowns when clicking outside (desktop)
document.addEventListener('click', (e) => {
  if (!e.target.closest('.nav-item[data-dropdown]')) {
    dropdownItems.forEach(item => {
      item.classList.remove('open');
      item.querySelector('.nav-trigger').setAttribute('aria-expanded', 'false');
    });
  }
});

// close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    dropdownItems.forEach(item => {
      item.classList.remove('open');
      item.querySelector('.nav-trigger').setAttribute('aria-expanded', 'false');
    });
    nav.classList.remove('open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }
});

/* ---------- Word-reveal headings ----------
   Wrap each word of .reveal-words in span for a mask-up animation. */
document.querySelectorAll('.reveal-words').forEach(el => {
  const text = el.textContent.trim();
  const accentStart = Number.parseInt(el.dataset.accentStart || '', 10);
  el.innerHTML = '';
  text.split(/\s+/).forEach((word, i) => {
    const outer = document.createElement('span');
    outer.className = 'word';
    if (Number.isFinite(accentStart) && i >= accentStart) outer.classList.add('accent-word');
    const inner = document.createElement('span');
    inner.textContent = word;
    inner.style.transitionDelay = (i * 0.06) + 's';
    outer.appendChild(inner);
    el.appendChild(outer);
    el.appendChild(document.createTextNode(' '));
  });
});

/* ---------- Reveal on scroll (reveal, line-reveal, reveal-words) ---------- */
const revealTargets = document.querySelectorAll('.reveal, .line-reveal, .reveal-words');
if (prefersReduced) {
  revealTargets.forEach(el => el.classList.add('in'));
} else {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  revealTargets.forEach(el => revealObserver.observe(el));
}

/* ---------- Marquee: duplicate content for seamless loop ---------- */
document.querySelectorAll('.marquee-track').forEach(track => {
  track.innerHTML += track.innerHTML;
});

/* ---------- Animated counters ---------- */
const animateCount = (el) => {
  const target = parseFloat(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  const prefix = el.dataset.prefix || '';
  const duration = 1600;
  const start = performance.now();
  const step = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = prefix + Math.round(target * eased) + suffix;
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = prefix + target + suffix;
  };
  requestAnimationFrame(step);
};
const countEls = document.querySelectorAll('[data-count]');
if (prefersReduced) {
  countEls.forEach(el => el.textContent = (el.dataset.prefix||'') + el.dataset.count + (el.dataset.suffix||''));
} else {
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { animateCount(entry.target); countObserver.unobserve(entry.target); }
    });
  }, { threshold: 0.5 });
  countEls.forEach(el => countObserver.observe(el));
}

/* ---------- FAQ accordion ---------- */
document.querySelectorAll('.faq-item').forEach(item => {
  const q = item.querySelector('.faq-q');
  const a = item.querySelector('.faq-a');
  q.setAttribute('aria-expanded', 'false');
  q.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    // close all
    document.querySelectorAll('.faq-item.open').forEach(other => {
      other.classList.remove('open');
      other.querySelector('.faq-a').style.maxHeight = null;
      other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
    });
    if (!isOpen) {
      item.classList.add('open');
      a.style.maxHeight = a.scrollHeight + 'px';
      q.setAttribute('aria-expanded', 'true');
    }
  });
});

/* ---------- Subtle parallax on tagged elements ---------- */
if (!prefersReduced) {
  const parallaxEls = document.querySelectorAll('[data-parallax]');
  if (parallaxEls.length) {
    window.addEventListener('scroll', () => {
      const vh = window.innerHeight;
      parallaxEls.forEach(el => {
        const rect = el.getBoundingClientRect();
        const speed = parseFloat(el.dataset.parallax) || 0.08;
        const offset = (rect.top + rect.height / 2 - vh / 2) * -speed;
        el.style.transform = `translateY(${offset.toFixed(1)}px)`;
      });
    }, { passive: true });
  }
}

/* ---------- Contact form (demo) ---------- */
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const note = document.getElementById('formNote');
    note.textContent = 'Thanks for filling out the form! We will contact you as soon as possible.';
    note.style.color = 'var(--emerald)';
    form.reset();
  });
}
