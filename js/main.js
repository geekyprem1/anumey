// ===== Vorendis — interactions & animations =====

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Page-level progress + launch sequence ---------- */
const progress = document.createElement('div');
progress.className = 'scroll-progress';
progress.setAttribute('aria-hidden', 'true');
document.body.appendChild(progress);
requestAnimationFrame(() => document.body.classList.add('motion-ready'));

/* ---------- Sticky + hide-on-scroll nav ---------- */
const nav = document.getElementById('nav');
let lastY = 0;
const onScroll = () => {
  const y = window.scrollY;
  if (y > 30) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = scrollable > 0 ? Math.min(y / scrollable, 1) : 0;
  progress.style.transform = `scaleX(${ratio})`;
  // hide when scrolling down past hero, show when scrolling up
  if (y > 300 && y > lastY && !nav.classList.contains('open')) nav.classList.add('hidden');
  else nav.classList.remove('hidden');
  lastY = y;
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Current-page navigation state ---------- */
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav a[href]').forEach(link => {
  const target = link.getAttribute('href').split('#')[0];
  if (target === currentPage) link.setAttribute('aria-current', 'page');
});

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

/* One staggered entrance per content group keeps motion structured. */
document.querySelectorAll('.work-grid, .service-grid, .ind-grid, .testi-grid, .process-steps, .career-principles, .roles-list').forEach(group => {
  [...group.children].forEach((child, index) => {
    child.style.transitionDelay = `${Math.min(index, 4) * 70}ms`;
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

/* ---------- Pointer-responsive depth for the hero system ---------- */
const systemBoard = document.querySelector('.system-board');
if (systemBoard && !prefersReduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  systemBoard.addEventListener('pointermove', (event) => {
    const rect = systemBoard.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    systemBoard.style.setProperty('--board-rx', `${((0.5 - y) * 3).toFixed(2)}deg`);
    systemBoard.style.setProperty('--board-ry', `${(-4 + (x - 0.5) * 4).toFixed(2)}deg`);
    systemBoard.style.setProperty('--board-y', '-3px');
  });
  systemBoard.addEventListener('pointerleave', () => {
    systemBoard.style.removeProperty('--board-rx');
    systemBoard.style.removeProperty('--board-ry');
    systemBoard.style.removeProperty('--board-y');
  });
}

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

/* ---------- Auto-advancing testimonial rail ---------- */
const testimonialRail = document.querySelector('.testi-grid');
if (testimonialRail && !prefersReduced) {
  const testimonialCards = [...testimonialRail.querySelectorAll('.testi')];
  let testimonialTimer = null;
  let railVisible = false;

  const stopTestimonials = () => {
    window.clearInterval(testimonialTimer);
    testimonialTimer = null;
  };

  const advanceTestimonials = () => {
    const gap = parseFloat(getComputedStyle(testimonialRail).gap) || 16;
    const step = testimonialCards[0].getBoundingClientRect().width + gap;
    const atEnd = testimonialRail.scrollLeft + testimonialRail.clientWidth >= testimonialRail.scrollWidth - step * 0.45;
    testimonialRail.scrollTo({ left: atEnd ? 0 : testimonialRail.scrollLeft + step, behavior: 'smooth' });
  };

  const startTestimonials = () => {
    if (!railVisible || testimonialTimer || document.hidden) return;
    testimonialTimer = window.setInterval(advanceTestimonials, 3600);
  };

  testimonialRail.addEventListener('pointerenter', stopTestimonials);
  testimonialRail.addEventListener('pointerleave', startTestimonials);
  testimonialRail.addEventListener('focusin', stopTestimonials);
  testimonialRail.addEventListener('focusout', startTestimonials);
  testimonialRail.addEventListener('touchstart', stopTestimonials, { passive: true });
  testimonialRail.addEventListener('touchend', startTestimonials, { passive: true });
  document.addEventListener('visibilitychange', () => document.hidden ? stopTestimonials() : startTestimonials());

  const railObserver = new IntersectionObserver(([entry]) => {
    railVisible = entry.isIntersecting;
    railVisible ? startTestimonials() : stopTestimonials();
  }, { threshold: 0.25 });
  railObserver.observe(testimonialRail);
}

/* ---------- Contact form (Formspree) ---------- */
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const note = document.getElementById('formNote');
    const button = form.querySelector('[type="submit"]');

    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    note.textContent = 'Sending your message…';
    note.style.color = 'var(--slate)';

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error('Submission failed');
      note.textContent = 'Thanks! Your message has been sent. We will contact you shortly.';
      note.style.color = 'var(--emerald)';
      form.reset();
    } catch (error) {
      note.textContent = 'We could not send your message. Please email info@vorendis.net.';
      note.style.color = 'var(--ember)';
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  });
}
