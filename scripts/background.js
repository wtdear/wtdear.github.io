   document.querySelectorAll('a.nav-link').forEach(link => {
      link.addEventListener('click', e => {
        document.querySelectorAll('a.nav-link').forEach(l => l.classList.remove('active'));
        e.currentTarget.classList.add('active');
      });
    });
    const sections = Array.from(document.querySelectorAll('main .section'));
    function onScroll(){
      const fromTop = window.scrollY + 140;
      sections.forEach(sec=>{
        const top = sec.offsetTop;
        const height = sec.offsetHeight;
        const id = sec.getAttribute('id');
        const link = document.querySelector('a.nav-link[href="#'+id+'"]');
        if(fromTop >= top && fromTop < top + height){
          document.querySelectorAll('a.nav-link').forEach(l=>l.classList.remove('active'));
          if(link) link.classList.add('active');
        }
      });
    }
    window.addEventListener('scroll', onScroll);
    document.querySelectorAll('a[href^="#"]').forEach(a=>{
      a.addEventListener('click', function(e){
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if(target) target.scrollIntoView({behavior:'smooth', block:'start'});
      });
    });

    const canvas = document.getElementById('bgCanvas');
    const ctx = canvas.getContext('2d');
    let DPR = window.devicePixelRatio || 1;
    function resize(){ canvas.width = window.innerWidth * DPR; canvas.height = window.innerHeight * DPR; canvas.style.width = window.innerWidth+'px'; canvas.style.height = window.innerHeight+'px'; ctx.scale(DPR, DPR); }
    resize(); window.addEventListener('resize', resize);

    const dots = [];
    for(let i=0; i<500; i++){
      dots.push({
        x: Math.random()*innerWidth, 
        y: Math.random()*innerHeight, 
        r: 0.6+Math.random()*1, 
        dx: (Math.random()-.5)*0.6, 
        dy: (Math.random()-.5)*0.3, 
        alpha: 0.2+Math.random()*0.6
      });
    }
    
    function draw(){
      ctx.clearRect(0,0,canvas.width,canvas.height);

      const g = ctx.createLinearGradient(0,0,innerWidth,innerHeight);
      g.addColorStop(0,'rgba(118, 183, 53, 0.04)');
      g.addColorStop(1,'rgba(0,200,255,0.02)');
      ctx.fillStyle = g;
      ctx.fillRect(0,0,innerWidth,innerHeight);

      dots.forEach(d=>{
        ctx.beginPath();
        ctx.globalAlpha = d.alpha * 0.6;
        ctx.fillStyle = 'white';
        ctx.arc(d.x, d.y, d.r, 0, Math.PI*2);
        ctx.fill();

        d.x += d.dx; 
        d.y += d.dy;
        
        if(d.x < -20) d.x = innerWidth + 20;
        if(d.x > innerWidth + 20) d.x = -20;
        if(d.y < -20) d.y = innerHeight + 20;
        if(d.y > innerHeight + 20) d.y = -20;
      });
      
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    }
    
    draw();