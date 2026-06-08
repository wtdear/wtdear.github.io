function copyCode(text, buttonElement) {
  navigator.clipboard.writeText(text).then(() => {
    const originalInner = buttonElement.innerHTML;
    buttonElement.innerHTML = '<i class="fas fa-check" style="color: #22c55e;"></i>';
    buttonElement.style.pointerEvents = 'none';
    
    setTimeout(() => {
      buttonElement.innerHTML = originalInner;
      buttonElement.style.pointerEvents = 'auto';
    }, 2000);
  }).catch(err => {
    console.error('Ошибка копирования: ', err);
  });
}

document.addEventListener('mousemove', (e) => {
  const glowBg = document.querySelector('.glow-bg');
  if (!glowBg) return;
  
  // Рассчитываем позицию мыши в процентах
  const x = (e.clientX / window.innerWidth) * 100;
  const y = (e.clientY / window.innerHeight) * 100;

  glowBg.style.background = `
    radial-gradient(circle at ${x}% ${y}%, rgba(168, 85, 247, 0.16), transparent 45%),
    radial-gradient(circle at ${100 - x}% ${100 - y}%, rgba(6, 182, 212, 0.12), transparent 45%)
  `;
});

document.querySelectorAll('.nav-link').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    const targetSection = document.querySelector(targetId);
    
    if (targetSection) {
      targetSection.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      
      targetSection.style.borderColor = 'var(--accent)';
      setTimeout(() => {
        targetSection.style.borderColor = 'var(--border)';
      }, 1500);
    }
  });
});
