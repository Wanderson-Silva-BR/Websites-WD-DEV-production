const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
if (!reduceMotion) {
  import('https://cdn.jsdelivr.net/npm/motion@13.1.0/+esm').then(({ animate, inView, stagger }) => {
    const hero = document.querySelector('.hero');
    if (hero) {
      const eyebrow = hero.querySelector('.eyebrow');
      const title = hero.querySelector('h1');
      const copy = hero.querySelector('p');
      const actions = hero.querySelector('.hero-actions');
      const phones = hero.querySelectorAll('.hero-phones img');
      if (eyebrow) animate(eyebrow, { opacity: [0,1], y: [12,0] }, { duration: .45, easing: 'ease-out' });
      if (title) animate(title, { opacity: [0,1], y: [24,0] }, { duration: .65, delay: .08, easing: [0.22,1,0.36,1] });
      if (copy) animate(copy, { opacity: [0,1], y: [18,0] }, { duration: .55, delay: .16 });
      if (actions) animate(actions, { opacity: [0,1], y: [16,0] }, { duration: .5, delay: .23 });
      if (phones.length) animate(phones, { opacity: [0,1], scale: [.94,1], y: [26,0] }, { delay: stagger(.1, { startDelay: .18 }), duration: .7, easing: [0.22,1,0.36,1] });
    }
    inView('.product-card', (el) => {
      animate(el, { opacity: [0,1], y: [22,0] }, { duration: .5, easing: [0.22,1,0.36,1] });
    }, { amount: .18, margin: '0px 0px -8% 0px' });
    inView('.trust, .panel', (el) => {
      animate(el, { opacity: [0,1], y: [16,0] }, { duration: .45 });
    }, { amount: .15 });
  }).catch(() => {});
}
