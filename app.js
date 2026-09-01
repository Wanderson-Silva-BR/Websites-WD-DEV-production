import { animate, stagger } from "https://cdn.jsdelivr.net/npm/motion@11.18.2/+esm";

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const profiles = [...document.querySelectorAll('.profile')];
const transition = document.querySelector('#transition');
const transitionName = document.querySelector('#transitionName');

if (!reduceMotion) {
  animate('.wd-logo, .contact-link', { opacity: [0, 1], y: [-12, 0] }, { duration: .55, delay: stagger(.08) });
  animate('.eyebrow, .intro h1, .intro p', { opacity: [0, 1], y: [24, 0] }, { duration: .7, delay: stagger(.1, { startDelay: .12 }), ease: 'easeOut' });
  animate('.profile', { opacity: [0, 1], scale: [.92, 1], y: [28, 0] }, { duration: .65, delay: stagger(.09, { startDelay: .38 }), ease: [.2, .8, .2, 1] });
  animate('.hint', { opacity: [0, 1] }, { duration: .6, delay: 1 });
}

profiles.forEach(profile => {
  profile.addEventListener('pointermove', event => {
    if (reduceMotion) return;
    const art = profile.querySelector('.profile-art');
    const rect = art.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    art.style.transform = `translateY(-10px) perspective(700px) rotateY(${x * 7}deg) rotateX(${y * -7}deg) scale(1.025)`;
  });

  profile.addEventListener('pointerleave', () => {
    profile.querySelector('.profile-art').style.transform = '';
  });

  profile.addEventListener('click', async () => {
    const { project, name, color } = profile.dataset;
    transitionName.textContent = name;
    transition.style.setProperty('--transition-color', color);
    transition.style.pointerEvents = 'all';
    transition.setAttribute('aria-hidden', 'false');

    if (reduceMotion) {
      window.location.href = `${project}/`;
      return;
    }

    await animate(transition, { clipPath: ['circle(0% at 50% 50%)', 'circle(150% at 50% 50%)'] }, { duration: .8, ease: [.75, 0, .2, 1] }).finished;
    animate('.transition-brand', { opacity: [0, 1], y: [18, 0] }, { duration: .45 });
    await animate('.loading-line i', { transform: ['translateX(-100%)', 'translateX(0%)'] }, { duration: .8, ease: 'easeInOut' }).finished;
    window.location.href = `${project}/`;
  });
});
