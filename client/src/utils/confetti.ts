import confetti from 'canvas-confetti';

export function fireCelebrationConfetti() {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 }
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: ['#FF6B00', '#3b82f6', '#10b981', '#f59e0b', '#ec4899']
  });
  fire(0.2, {
    spread: 60,
    colors: ['#FF6B00', '#3b82f6', '#10b981']
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    colors: ['#FFD700', '#FFA500', '#FF4500']
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45
  });
}

export function firePodiumConfetti() {
  const duration = 2.5 * 1000;
  const animationEnd = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.8 },
      colors: ['#FF6B00', '#3b82f6', '#10b981']
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.8 },
      colors: ['#FFD700', '#FF6B00', '#3b82f6']
    });

    if (Date.now() < animationEnd) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}

export function fireSmallStreak() {
  confetti({
    particleCount: 30,
    spread: 60,
    origin: { y: 0.85 },
    colors: ['#FF6B00', '#F97316', '#EF4444']
  });
}
