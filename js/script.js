// =============================================================
// script.js — Interactividad de LUMINA
// Se carga en las tres páginas; cada módulo comprueba primero
// si los elementos que necesita existen en la página actual.
//   1. Modo claro / oscuro            (todas)
//   2. Menú hamburguesa               (todas)
//   3. Filtro y búsqueda de directos  (index.html)
//   4. Login y registro               (login.html)
//   5. Perfil editable                (perfil.html)
//   6. Ver un directo                 (directo.html?canal=...)
// =============================================================

const USER_KEY = 'lumina-user';

// Datos de los canales en directo (en una web real vendrían de una API)
const STREAMS = {
  novax:   { title: 'Ranked hasta diamante', streamer: 'NovaX', category: 'Juegos', viewers: 2140, followers: 18420, thumb: 'violeta' },
  kraven:  { title: 'Terror a oscuras: parte 3', streamer: 'Kraven', category: 'Juegos', viewers: 5812, followers: 24310, thumb: 'niebla' },
  luna:    { title: 'Paseo nocturno por la ciudad', streamer: 'Luna', category: 'Charlas', viewers: 940, followers: 7350, thumb: 'atardecer' },
  djbrisa: { title: 'Sesión lo-fi para estudiar', streamer: 'DJ Brisa', category: 'Música', viewers: 3320, followers: 15900, thumb: 'lima' },
  codeowl: { title: 'Programamos un juego en vivo', streamer: 'CodeOwl', category: 'Charlas', viewers: 1205, followers: 9880, thumb: 'oceano' },
  aria:    { title: 'Guitarra acústica y peticiones', streamer: 'Aria', category: 'Música', viewers: 780, followers: 5120, thumb: 'grafito' },
};

// Formato de números en español (5812 -> "5.812")
const formatNumber = (n) => n.toLocaleString('es-ES');

// Lectura y escritura segura del usuario en localStorage
const loadUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || {};
  } catch (e) {
    return {};
  }
};

const saveUser = (data) => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify({ ...loadUser(), ...data }));
  } catch (e) {
    // Sin almacenamiento disponible: los datos solo duran esta visita
  }
};

// Iniciales para el avatar a partir del nombre
const initials = (name) => name.trim().slice(0, 2).toUpperCase();

// Muestra el aviso (toast) de la página, si existe
const showToast = (message) => {
  const toastEl = document.getElementById('formToast');
  if (!toastEl) {
    return;
  }
  document.getElementById('formToastText').textContent = message;
  bootstrap.Toast.getOrCreateInstance(toastEl).show();
};

// Marca el formulario como validado y lleva el foco al primer error
const validateForm = (form) => {
  form.classList.add('was-validated');
  if (form.checkValidity()) {
    return true;
  }
  const firstInvalid = form.querySelector(':invalid');
  if (firstInvalid) {
    firstInvalid.focus();
  }
  return false;
};

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMenu();
  initStreamFilter();
  initAuth();
  initProfile();
  initWatch();
});

// ---------- 1. Modo claro / oscuro ----------
function initTheme() {
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');

  const applyTheme = (theme) => {
    root.setAttribute('data-bs-theme', theme);
    const isDark = theme === 'dark';
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    document.querySelector('meta[name="theme-color"]').setAttribute('content', isDark ? '#0f2b31' : '#f3f1f8');
  };

  applyTheme(root.getAttribute('data-bs-theme') || 'dark');

  themeToggle.addEventListener('click', () => {
    const next = root.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try {
      localStorage.setItem('lumina-theme', next);
    } catch (e) {
      // Sin almacenamiento disponible: el tema solo dura esta visita
    }
  });
}

// ---------- 2. Menú hamburguesa ----------
// Al pulsar un enlace en móvil, el menú desplegado se cierra
function initMenu() {
  const menu = document.getElementById('menuPrincipal');
  const collapse = bootstrap.Collapse.getOrCreateInstance(menu, { toggle: false });
  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      if (menu.classList.contains('show')) {
        collapse.hide();
      }
    });
  });
}

// ---------- 3. Filtro y búsqueda de directos ----------
function initStreamFilter() {
  const grid = document.getElementById('streamGrid');
  if (!grid) {
    return;
  }

  const chips = document.querySelectorAll('.filter-chips__chip');
  const cards = grid.querySelectorAll('.col');
  const searchInput = document.getElementById('buscador');
  const emptyMsg = document.getElementById('streamEmpty');
  let activeFilter = 'todos';

  const filterStreams = () => {
    const query = searchInput.value.trim().toLowerCase();
    let visible = 0;
    cards.forEach((card) => {
      const matchesCategory = activeFilter === 'todos' || card.dataset.category === activeFilter;
      const matchesText = card.textContent.toLowerCase().includes(query);
      const show = matchesCategory && matchesText;
      card.classList.toggle('d-none', !show);
      if (show) {
        visible += 1;
      }
    });
    emptyMsg.classList.toggle('d-none', visible > 0);
  };

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => {
        c.classList.remove('is-active');
        c.setAttribute('aria-pressed', 'false');
      });
      chip.classList.add('is-active');
      chip.setAttribute('aria-pressed', 'true');
      activeFilter = chip.dataset.filter;
      filterStreams();
    });
  });

  searchInput.addEventListener('input', filterStreams);
  searchInput.form.addEventListener('submit', (event) => {
    event.preventDefault();
    filterStreams();
    document.getElementById('directos').scrollIntoView();
  });

  // Búsqueda enviada desde otra página (index.html?q=...)
  const query = new URLSearchParams(window.location.search).get('q');
  if (query) {
    searchInput.value = query;
    filterStreams();
    document.getElementById('directos').scrollIntoView();
  }
}

// ---------- 4. Login y registro ----------
function initAuth() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  if (!loginForm || !registerForm) {
    return;
  }

  const loginTab = bootstrap.Tab.getOrCreateInstance(document.getElementById('tab-login'));
  const registerTab = bootstrap.Tab.getOrCreateInstance(document.getElementById('tab-registro'));

  // login.html#registro abre directamente la pestaña de registro
  if (window.location.hash === '#registro') {
    registerTab.show();
  }

  // Mostrar / ocultar contraseña
  document.querySelectorAll('[data-reveal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.reveal);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-pressed', String(show));
      btn.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
    });
  });

  // Inicio de sesión: si es válido, guarda el email y va al perfil
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validateForm(loginForm)) {
      return;
    }
    const email = loginForm.elements.email.value.trim();
    const user = loadUser();
    saveUser({ email, name: user.name || email.split('@')[0] });
    showToast('¡Bienvenido de nuevo! Entrando en tu perfil…');
    setTimeout(() => {
      window.location.href = loginForm.getAttribute('action');
    }, 1200);
  });

  // Registro: las dos contraseñas deben coincidir
  const password = document.getElementById('regPassword');
  const password2 = document.getElementById('regPassword2');

  const checkPasswordMatch = () => {
    const mismatch = password2.value !== password.value;
    password2.setCustomValidity(mismatch || password2.value === '' ? 'Las contraseñas no coinciden' : '');
  };
  password.addEventListener('input', checkPasswordMatch);
  password2.addEventListener('input', checkPasswordMatch);

  registerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    checkPasswordMatch();
    if (!validateForm(registerForm)) {
      return;
    }
    const name = registerForm.elements.usuario.value.trim();
    const email = registerForm.elements.email.value.trim();
    saveUser({ name, email, bio: '' });
    showToast(`¡Cuenta creada, ${name}! Ya puedes iniciar sesión.`);

    // Pasa a la pestaña de login con el email ya escrito
    registerForm.reset();
    registerForm.classList.remove('was-validated');
    loginForm.elements.email.value = email;
    loginTab.show();
    loginForm.elements.password.focus();
  });
}

// ---------- 5. Perfil editable ----------
function initProfile() {
  const profileForm = document.getElementById('profileForm');
  if (!profileForm) {
    return;
  }

  const nameEl = document.getElementById('profileName');
  const handleEl = document.getElementById('profileHandle');
  const bioEl = document.getElementById('profileBio');
  const avatarEl = document.getElementById('profileAvatar');
  const emailEl = document.getElementById('accountEmail');
  const bioInput = document.getElementById('editBio');
  const bioCounter = document.getElementById('bioCounter');

  // Pinta en el DOM los datos guardados del usuario
  const renderProfile = () => {
    const user = loadUser();
    if (user.name) {
      nameEl.textContent = user.name;
      handleEl.textContent = user.name.toLowerCase().replace(/\s+/g, '_');
      avatarEl.textContent = initials(user.name);
    }
    if (typeof user.bio === 'string') {
      bioEl.textContent = user.bio || 'Todavía no has escrito tu biografía.';
    }
    if (user.email) {
      emailEl.textContent = user.email;
    }
  };
  renderProfile();

  const updateCounter = () => {
    bioCounter.textContent = `${bioInput.value.length} / ${bioInput.maxLength} caracteres`;
  };
  bioInput.addEventListener('input', updateCounter);

  // Al abrir el formulario se rellena con los datos actuales
  const editPanel = document.getElementById('editarPerfil');
  editPanel.addEventListener('show.bs.collapse', () => {
    const user = loadUser();
    profileForm.elements.nombre.value = nameEl.textContent;
    profileForm.elements.categoria.value = user.category || '';
    bioInput.value = user.bio !== undefined ? user.bio : bioEl.textContent;
    updateCounter();
    profileForm.classList.remove('was-validated');
  });
  editPanel.addEventListener('shown.bs.collapse', () => {
    profileForm.elements.nombre.focus();
  });

  profileForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validateForm(profileForm)) {
      return;
    }
    saveUser({
      name: profileForm.elements.nombre.value.trim(),
      bio: bioInput.value.trim(),
      category: profileForm.elements.categoria.value,
    });
    renderProfile();
    bootstrap.Collapse.getOrCreateInstance(editPanel).hide();
    showToast('Perfil actualizado correctamente.');
  });

  // Botón Empezar / Finalizar directo
  const goLiveBtn = document.getElementById('goLiveBtn');
  const goLiveText = document.getElementById('goLiveText');
  goLiveBtn.addEventListener('click', () => {
    const live = goLiveBtn.getAttribute('aria-pressed') !== 'true';
    goLiveBtn.setAttribute('aria-pressed', String(live));
    goLiveBtn.classList.toggle('is-live', live);
    avatarEl.classList.toggle('avatar--live', live);
    goLiveText.textContent = live ? 'Finalizar directo' : 'Empezar directo';
    showToast(live ? '¡Estás en directo!' : 'Directo finalizado.');
  });

  // Cerrar sesión: borra los datos guardados
  document.getElementById('logoutLink').addEventListener('click', () => {
    try {
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      // Nada que borrar
    }
  });
}

// ---------- 6. Ver un directo ----------
function initWatch() {
  const player = document.getElementById('player');
  if (!player) {
    return;
  }

  // Canal elegido en la URL (directo.html?canal=kraven)
  const id = new URLSearchParams(window.location.search).get('canal');
  const stream = STREAMS[id] || STREAMS.kraven;
  const screen = document.getElementById('playerScreen');

  // Rellena la página con los datos del canal
  document.title = `${stream.title} · ${stream.streamer} · LUMINA`;
  screen.className = `player__screen player__screen--${stream.thumb}`;
  document.getElementById('streamTitle').textContent = stream.title;
  document.getElementById('streamStreamer').textContent = stream.streamer;
  document.getElementById('streamCategory').textContent = stream.category;
  document.getElementById('streamAvatar').textContent = initials(stream.streamer);

  // Espectadores que varían un poco cada pocos segundos
  const viewerEl = document.getElementById('viewerCount');
  let viewers = stream.viewers;
  viewerEl.textContent = formatNumber(viewers);
  setInterval(() => {
    viewers = Math.max(1, viewers + Math.round((Math.random() - 0.45) * viewers * 0.02));
    viewerEl.textContent = formatNumber(viewers);
  }, 3000);

  // Tiempo en directo
  const uptimeEl = document.getElementById('uptime');
  let seconds = 5077;
  const pad = (n) => String(n).padStart(2, '0');
  setInterval(() => {
    seconds += 1;
    uptimeEl.textContent = `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}`;
  }, 1000);

  // ----- Controles del reproductor -----
  const playBtn = document.getElementById('playBtn');
  const pausedMsg = document.getElementById('pausedMsg');
  playBtn.addEventListener('click', () => {
    const playing = playBtn.getAttribute('aria-pressed') !== 'true';
    playBtn.setAttribute('aria-pressed', String(playing));
    playBtn.setAttribute('aria-label', playing ? 'Pausar' : 'Reproducir');
    player.classList.toggle('is-paused', !playing);
    pausedMsg.hidden = playing;
  });

  const muteBtn = document.getElementById('muteBtn');
  const volume = document.getElementById('volumeRange');
  const setMuted = (muted) => {
    muteBtn.setAttribute('aria-pressed', String(muted));
    muteBtn.setAttribute('aria-label', muted ? 'Activar sonido' : 'Silenciar');
    player.classList.toggle('is-muted', muted);
  };
  muteBtn.addEventListener('click', () => {
    const muted = muteBtn.getAttribute('aria-pressed') !== 'true';
    setMuted(muted);
    if (!muted && Number(volume.value) === 0) {
      volume.value = 50;
    }
  });
  volume.addEventListener('input', () => setMuted(Number(volume.value) === 0));

  document.getElementById('fullscreenBtn').addEventListener('click', () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (player.requestFullscreen) {
      player.requestFullscreen();
    }
  });

  // ----- Seguir al canal -----
  const followBtn = document.getElementById('followBtn');
  const followText = document.getElementById('followText');
  const followerEl = document.getElementById('followerCount');
  let followers = stream.followers;
  followerEl.textContent = formatNumber(followers);
  followBtn.addEventListener('click', () => {
    const following = followBtn.getAttribute('aria-pressed') !== 'true';
    followBtn.setAttribute('aria-pressed', String(following));
    followBtn.classList.toggle('is-following', following);
    followText.textContent = following ? 'Siguiendo' : 'Seguir';
    followers += following ? 1 : -1;
    followerEl.textContent = formatNumber(followers);
    showToast(following ? `Ahora sigues a ${stream.streamer}.` : `Has dejado de seguir a ${stream.streamer}.`);
  });

  document.getElementById('shareBtn').addEventListener('click', () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(
        () => showToast('Enlace del directo copiado.'),
        () => showToast(url),
      );
    } else {
      showToast(url);
    }
  });

  // ----- Chat en vivo (simulado) -----
  const chatList = document.getElementById('chatList');
  const chatLog = document.getElementById('chatLog');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const MAX_MESSAGES = 60;
  const fakeUsers = ['pixelfan', 'noctambulo', 'sara_gg', 'tioMario', 'lumi_lover', 'kaiser', 'neon_cat', 'ruta66'];
  const fakeMessages = ['¡Qué buen directo!', 'Hola a todos 👋', 'JAJAJA', 'Eso ha sido increíble', '¿Cuándo es el próximo?', 'Saludos desde Alcalá', 'GG', 'Me encanta este canal', 'Subid el volumen 🔊', '¡Vamos!'];

  const addMessage = (author, text, own = false) => {
    const item = document.createElement('li');
    item.className = own ? 'chat__msg chat__msg--own' : 'chat__msg';
    const name = document.createElement('strong');
    name.className = 'chat__author';
    name.textContent = `${author}:`;
    item.append(name, ` ${text}`);
    chatList.append(item);
    while (chatList.children.length > MAX_MESSAGES) {
      chatList.firstElementChild.remove();
    }
    chatLog.scrollTop = chatLog.scrollHeight;
  };

  const random = (list) => list[Math.floor(Math.random() * list.length)];
  setInterval(() => {
    if (!player.classList.contains('is-paused')) {
      addMessage(random(fakeUsers), random(fakeMessages));
    }
  }, 2500);

  chatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    chatInput.value = chatInput.value.trim();
    if (!validateForm(chatForm)) {
      return;
    }
    addMessage(loadUser().name || 'Invitado', chatInput.value, true);
    chatForm.reset();
    chatForm.classList.remove('was-validated');
    chatInput.focus();
  });

  // ----- Más directos: tarjetas creadas a partir de los datos -----
  const more = document.getElementById('moreStreams');
  Object.entries(STREAMS)
    .filter(([, s]) => s !== stream)
    .slice(0, 3)
    .forEach(([key, s]) => {
      const col = document.createElement('div');
      col.className = 'col';
      col.innerHTML = `
        <article class="stream-card">
          <a class="stream-card__link" href="directo.html?canal=${key}">
            <div class="stream-card__thumb stream-card__thumb--${s.thumb}">
              <span class="live-badge live-badge--sm">En directo</span>
            </div>
            <div class="stream-card__body">
              <span class="avatar avatar--sm" aria-hidden="true">${initials(s.streamer)}</span>
              <div>
                <h3 class="stream-card__title"></h3>
                <p class="stream-card__meta"></p>
              </div>
            </div>
          </a>
        </article>`;
      col.querySelector('.stream-card__title').textContent = s.title;
      col.querySelector('.stream-card__meta').textContent = `${s.streamer} · ${formatNumber(s.viewers)} espectadores`;
      more.append(col);
    });
}
