
document.addEventListener("DOMContentLoaded", () => {

  // 1. Inicialização do Swiper (corrigido e protegido contra duplicidade)
  const swiperEl = document.querySelector('.mySwiper');
  if (swiperEl) {
    // Evita inicialização duplicada
    if (window.swiperInitialized) return;
    window.swiperInitialized = true;

    new Swiper(swiperEl, {
      loop: true,
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
      },
    });
  }

  // 2. Inicialização dos Bootstrap Tooltips (única e correta)
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltipTriggerList.forEach(el => new bootstrap.Tooltip(el));

  // 3. Captcha reload (sem alteração)
  const btnReloadCaptcha = document.getElementById("btn-reload-captcha");
  if (btnReloadCaptcha) {
    btnReloadCaptcha.addEventListener("click", async () => {
      try {
        const response = await fetch("/captcha/refresh/");
        if (!response.ok) throw new Error("Erro ao carregar captcha");
        const data = await response.json();
        document.querySelector(".captcha").src = data.image_url;
        document.getElementById("id_captcha_0").value = data.key;
      } catch (err) {
        console.error(err);
      }
    });
  }

  // 4. Validação de formulários Bootstrap (sem alteração)
  const forms = document.querySelectorAll("form");
  forms.forEach(form => {
    form.addEventListener("submit", e => {
      if (!form.checkValidity()) {
        e.preventDefault();
        e.stopPropagation();
      }
      form.classList.add("was-validated");
    });
  });
});
// --- CÓDIGO PARA O MAIN.JS (Para funcionar em todas as páginas) ---

document.addEventListener("DOMContentLoaded", function() {
    // A ordem importa: primeiro tentamos criar o Admin, depois o Login/Sair
    gerirLoginLogout(); 
    gerirBotaoAdmin();     
       
});

// -------------------------------------------------------------------------
// 1. BOTÃO ADMIN
// -------------------------------------------------------------------------
function gerirBotaoAdmin() {
    const userStr = localStorage.getItem('utilizador');
    
    if (userStr) {
        const utilizador = JSON.parse(userStr);

        // Verifica se é Admin
        if (utilizador.tipo === 'admin' || utilizador.admin === 1) {
            
            const menu = document.getElementById('menuPrincipal');
            
            // Só adiciona se o menu existir e o botão AINDA NÃO existir
            if (menu && !document.getElementById('btn-admin-nav')) {
                
                // Prefixo para pastas
                let prefixo = "";
                const path = window.location.pathname;
                if (path.includes('/socios/') || path.includes('/equipas/') || path.includes('/loja/')) {
                    prefixo = "../";
                }

                const liAdmin = document.createElement('li');
                
                // --- O SEGREDO ESTÁ AQUI (ms-auto) ---
                // ms-auto = margem à esquerda automática (empurra tudo para a direita)
                liAdmin.className = 'nav-item ms-auto d-flex align-items-center'; 
                
                liAdmin.innerHTML = `
                    <a id="btn-admin-nav" href="${prefixo}admin.html" class="btn btn-warning nav-link text-dark fw-bold px-3 shadow-sm rounded-pill" style="margin-left:10px;">
                        <i class="fa-solid fa-lock me-1"></i> ADMIN
                    </a>
                `;
                
                menu.appendChild(liAdmin);
            }
        }
    }
}

// -------------------------------------------------------------------------
// 2. BOTÃO LOGIN / SAIR
// -------------------------------------------------------------------------
function gerirLoginLogout() {
    const menu = document.getElementById('menuPrincipal');
    if (!menu) return;
    if (document.getElementById('li-auth-container')) return;

    // Prefixo para pastas
    let prefixo = "";
    const path = window.location.pathname;
    if (path.includes('/socios/') || path.includes('/equipas/') || path.includes('/loja/')) {
        prefixo = "../";
    }

    const userStr = localStorage.getItem('utilizador');
    
    // Cria o LI
    const liAuth = document.createElement('li');
    liAuth.id = 'li-auth-container';

    // --- LÓGICA DO ESPAÇO ---
    // Verificamos se o botão Admin já lá está a ocupar o lado direito
    const existeAdmin = document.getElementById('btn-admin-nav');

    if (existeAdmin) {
        // Se o Admin JÁ empurrou tudo para a direita, nós só nos encostamos a ele (ms-2)
        liAuth.className = 'nav-item ms-2 d-flex align-items-center gap-2';
    } else {
        // Se NÃO há Admin, este botão é que tem de empurrar tudo (ms-auto)
        liAuth.className = 'nav-item ms-auto d-flex align-items-center gap-2';
    }

    if (userStr) {
        // --- UTILIZADOR LOGADO ---
        const utilizador = JSON.parse(userStr);
        
        liAuth.innerHTML = `
            <div class="d-flex flex-column align-items-end me-2 text-white" style="line-height: 1.2;">
                <span style="font-size: 0.85rem; opacity: 0.8; margin-left: 39rem;" >Olá, ${utilizador.nome}</span>
                
            </div>
            <button onclick="sair()" class="btn btn-danger btn-sm rounded-pill px-3 shadow-sm">
                <i class="fa-solid fa-power-off"></i> Sair
            </button>
        `;
    } else {
        // --- BOTÃO DE LOGIN ---
        liAuth.innerHTML = `
            <a href="${prefixo}login.html" class="btn btn-primary btn-sm rounded-pill px-4 fw-bold shadow-sm" style="margin-left: 48rem;">
                <i class="fas fa-sign-in-alt me-2"></i> Entrar
            </a>
        `;
    }

    menu.appendChild(liAuth);
}
// -------------------------------------------------------------------------
// FUNÇÃO DE SAIR
// -------------------------------------------------------------------------
 // Função Sair
        function sair() { 
            localStorage.removeItem('utilizador'); 
            window.location.href = 'login.html'; 
        }
// public/js/auth.js

