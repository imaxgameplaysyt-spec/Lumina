// =============================================================
// script.js — Interactividad de LUMINA
// Se carga en las tres páginas; cada módulo comprueba primero
// si los elementos que necesita existen en la página actual.
//   1. Modo claro / oscuro            (todas)
//   2. Menú hamburguesa               (todas)
//   3. Filtro y búsqueda de directos  (index.html)
//   4. Login y registro               (login.html)
//   5. Perfil editable                (perfil.html)
// =============================================================

const USER_KEY = 'lumina-user';

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
