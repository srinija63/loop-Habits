/**
 * Loop Habits - Main Application
 * A beautiful habit tracking PWA with user authentication
 */

import * as api from './api.js';
import * as db from './db.js';
import * as score from './habit-score.js';
import * as utils from './utils.js';
import { initConfetti, celebrate } from './confetti.js';
import * as charts from './charts.js';

// ============================================
// Application State
// ============================================

const state = {
  isOnline: true,
  useBackend: false, // Will be set based on backend availability
  habits: [],
  completions: {},
  currentDate: new Date(),
  selectedHabit: null,
  calendarMonth: new Date(),
  user: null,
  settings: {
    darkMode: true,
    weekStartsOn: 0,
    showConfetti: true
  },
  charts: {
    monthly: null,
    weekly: null,
    habitScore: null
  }
};

// ============================================
// DOM Elements
// ============================================

const elements = {
  loadingScreen: document.getElementById('loading-screen'),
  authScreen: document.getElementById('auth-screen'),
  mainApp: document.getElementById('main-app'),
  habitsList: document.getElementById('habits-list'),
  allHabitsList: document.getElementById('all-habits-list'),
  emptyState: document.getElementById('empty-state'),
  currentDate: document.getElementById('current-date'),
  dateSubtitle: document.getElementById('date-subtitle'),
  fab: document.getElementById('fab'),
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toast-message'),
  confettiCanvas: document.getElementById('confetti-canvas'),
  
  // Auth
  loginForm: document.getElementById('login-form'),
  signupForm: document.getElementById('signup-form'),
  loginEmail: document.getElementById('login-email'),
  loginPassword: document.getElementById('login-password'),
  signupName: document.getElementById('signup-name'),
  signupEmail: document.getElementById('signup-email'),
  signupPassword: document.getElementById('signup-password'),
  showSignup: document.getElementById('show-signup'),
  showLogin: document.getElementById('show-login'),
  authError: document.getElementById('auth-error'),
  authErrorMessage: document.getElementById('auth-error-message'),
  
  // User info in side menu
  userName: document.getElementById('user-name'),
  userEmail: document.getElementById('user-email'),
  userAvatar: document.getElementById('user-avatar'),
  
  // Navigation
  tabBtns: document.querySelectorAll('.tab-btn'),
  bottomNavBtns: document.querySelectorAll('.bottom-nav-btn'),
  prevDay: document.getElementById('prev-day'),
  nextDay: document.getElementById('next-day'),
  
  // Side Menu
  sideMenu: document.getElementById('side-menu'),
  menuBtn: document.getElementById('menu-btn'),
  
  // Modals
  habitModal: document.getElementById('habit-modal'),
  habitDetailModal: document.getElementById('habit-detail-modal'),
  statisticsModal: document.getElementById('statistics-modal'),
  settingsModal: document.getElementById('settings-modal'),
  confirmDialog: document.getElementById('confirm-dialog'),
  aboutModal: document.getElementById('about-modal'),
  
  // Forms
  habitForm: document.getElementById('habit-form'),
  habitId: document.getElementById('habit-id'),
  habitName: document.getElementById('habit-name'),
  habitQuestion: document.getElementById('habit-question'),
  habitFrequency: document.getElementById('habit-frequency'),
  habitTimesPerWeek: document.getElementById('habit-times-per-week'),
  habitInterval: document.getElementById('habit-interval'),
  colorPicker: document.getElementById('color-picker'),
  iconPicker: document.getElementById('icon-picker'),
  
  // Settings
  darkModeToggle: document.getElementById('dark-mode-toggle'),
  weekStartSelect: document.getElementById('week-start'),
  confettiToggle: document.getElementById('confetti-toggle'),
  exportBtn: document.getElementById('export-btn'),
  clearDataBtn: document.getElementById('clear-data-btn'),
  
  // Statistics
  totalHabits: document.getElementById('total-habits'),
  completedToday: document.getElementById('completed-today'),
  bestStreak: document.getElementById('best-streak'),
  overallScore: document.getElementById('overall-score'),
  monthlyChart: document.getElementById('monthly-chart'),
  weeklyChart: document.getElementById('weekly-chart'),
  
  // Habit Detail
  detailIcon: document.getElementById('detail-icon'),
  detailTitle: document.getElementById('detail-title'),
  detailScore: document.getElementById('detail-score'),
  detailStreak: document.getElementById('detail-streak'),
  detailBest: document.getElementById('detail-best'),
  detailTotal: document.getElementById('detail-total'),
  calendarMonth: document.getElementById('calendar-month'),
  calendarGrid: document.getElementById('calendar-grid'),
  habitScoreChart: document.getElementById('habit-score-chart'),
  prevMonth: document.getElementById('prev-month'),
  nextMonth: document.getElementById('next-month'),
  editHabitBtn: document.getElementById('edit-habit-btn'),
  deleteHabitBtn: document.getElementById('delete-habit-btn'),
  
  // Confirm Dialog
  confirmTitle: document.getElementById('confirm-title'),
  confirmMessage: document.getElementById('confirm-message'),
  confirmCancel: document.getElementById('confirm-cancel'),
  confirmOk: document.getElementById('confirm-ok'),
  
  // Import
  importFile: document.getElementById('import-file')
};

// ============================================
// Initialization
// ============================================

async function init() {
  try {
    // Initialize confetti
    initConfetti(elements.confettiCanvas);
    
    // Check if backend is available
    state.useBackend = await api.healthCheck();
    console.log('Backend available:', state.useBackend);
    
    if (state.useBackend) {
      // Check if user is logged in
      if (api.isLoggedIn()) {
        state.user = api.getUser();
        await initAuthenticatedApp();
      } else {
        showAuthScreen();
      }
    } else {
      // Fallback to local storage mode
      console.log('Using offline mode with local storage');
      await initLocalApp();
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Register service worker
    registerServiceWorker();
    
  } catch (error) {
    console.error('Failed to initialize app:', error);
    // Fallback to local mode
    await initLocalApp();
  }
}

async function initAuthenticatedApp() {
  try {
    // Load settings from user profile
    if (state.user?.settings) {
      state.settings = { ...state.settings, ...state.user.settings };
    }
    
    // Apply theme
    applyTheme();
    updateSettingsUI();
    
    // Load habits from backend
    await loadHabitsFromBackend();
    
    // Update user info in UI
    updateUserInfo();
    
    // Render
    renderDateHeader();
    renderHabits();
    
    // Show main app
    hideLoading();
    showMainApp();
    
    console.log('Authenticated app initialized');
  } catch (error) {
    console.error('Failed to init authenticated app:', error);
    showToast('Failed to load data. Please try again.');
  }
}

async function initLocalApp() {
  try {
    // Initialize local database
    await db.initDB();
    
    // Load settings from local storage
    await loadLocalSettings();
    
    // Apply theme
    applyTheme();
    updateSettingsUI();
    
    // Load habits from local DB
    await loadHabitsFromLocal();
    
    // Render
    renderDateHeader();
    renderHabits();
    
    // Show main app (skip auth in local mode)
    hideLoading();
    showMainApp();
    
    console.log('Local app initialized');
  } catch (error) {
    console.error('Failed to init local app:', error);
    showToast('Failed to load app. Please refresh.');
  }
}

// ============================================
// Data Loading
// ============================================

async function loadHabitsFromBackend() {
  state.habits = await api.getHabits();
  
  // Load completions for each habit
  state.completions = {};
  for (const habit of state.habits) {
    const dates = await api.getCompletions(habit._id);
    state.completions[habit._id] = dates;
  }
}

async function loadHabitsFromLocal() {
  state.habits = await db.getAllHabits();
  
  // Load completions for each habit
  state.completions = {};
  for (const habit of state.habits) {
    const completions = await db.getCompletionsForHabit(habit.id);
    state.completions[habit.id] = completions.map(c => c.date);
  }
}

async function loadLocalSettings() {
  const settings = await db.getAllSettings();
  state.settings = {
    darkMode: settings.darkMode ?? true,
    weekStartsOn: settings.weekStartsOn ?? 0,
    showConfetti: settings.showConfetti ?? true
  };
}

// ============================================
// Authentication
// ============================================

function clearAuthForms() {
  // Forcefully clear ALL form fields to prevent Safari autofill
  setTimeout(() => {
    // Clear login form
    if (elements.loginEmail) elements.loginEmail.value = '';
    if (elements.loginPassword) elements.loginPassword.value = '';
    // Clear signup form
    if (elements.signupName) elements.signupName.value = '';
    if (elements.signupEmail) elements.signupEmail.value = '';
    if (elements.signupPassword) elements.signupPassword.value = '';
    
    // Also clear any fake/honeypot fields
    document.querySelectorAll('input[name^="fake"]').forEach(el => el.value = '');
  }, 100);
  
  // Run again after a delay (Safari sometimes fills after initial load)
  setTimeout(() => {
    if (elements.loginEmail) elements.loginEmail.value = '';
    if (elements.loginPassword) elements.loginPassword.value = '';
    if (elements.signupName) elements.signupName.value = '';
    if (elements.signupEmail) elements.signupEmail.value = '';
    if (elements.signupPassword) elements.signupPassword.value = '';
  }, 500);
}

function showAuthScreen() {
  elements.loadingScreen.classList.add('hidden');
  elements.authScreen.classList.remove('hidden');
  elements.mainApp.classList.add('hidden');
  
  // Clear forms to prevent autofill
  clearAuthForms();
  
  // Clear any existing auth data when showing auth screen
  api.clearAuth();
  
  // Aggressively clear all form fields multiple times to beat Safari autofill
  const clearForms = () => {
    if (elements.loginEmail) {
      elements.loginEmail.value = '';
      elements.loginEmail.setAttribute('value', '');
    }
    if (elements.loginPassword) {
      elements.loginPassword.value = '';
      elements.loginPassword.setAttribute('value', '');
    }
    if (elements.signupName) {
      elements.signupName.value = '';
      elements.signupName.setAttribute('value', '');
    }
    if (elements.signupEmail) {
      elements.signupEmail.value = '';
      elements.signupEmail.setAttribute('value', '');
    }
    if (elements.signupPassword) {
      elements.signupPassword.value = '';
      elements.signupPassword.setAttribute('value', '');
    }
  };
  
  // Clear immediately and after delays to beat autofill
  clearForms();
  setTimeout(clearForms, 50);
  setTimeout(clearForms, 100);
  setTimeout(clearForms, 300);
  setTimeout(clearForms, 500);
  
  // Show signup form by default for new users
  elements.loginForm.classList.add('hidden');
  elements.signupForm.classList.remove('hidden');
  hideAuthError();
}

function showMainApp() {
  elements.authScreen.classList.add('hidden');
  elements.mainApp.classList.remove('hidden');
}

function hideLoading() {
  elements.loadingScreen.classList.add('hidden');
}

async function handleLogin(e) {
  e.preventDefault();
  
  const email = elements.loginEmail.value.trim().toLowerCase();
  const password = elements.loginPassword.value;
  
  if (!email || !password) {
    showAuthError('Please fill in all fields');
    return;
  }
  
  // Simple email validation
  if (!email.includes('@') || !email.includes('.')) {
    showAuthError('Please enter a valid email address');
    return;
  }
  
  setAuthLoading(elements.loginForm, true);
  hideAuthError();
  
  try {
    const data = await api.login(email, password);
    state.user = data.user;
    await initAuthenticatedApp();
  } catch (error) {
    showAuthError(error.message || 'Login failed. Please try again.');
  } finally {
    setAuthLoading(elements.loginForm, false);
  }
}

async function handleSignup(e) {
  e.preventDefault();
  
  const name = elements.signupName.value.trim();
  const email = elements.signupEmail.value.trim().toLowerCase();
  const password = elements.signupPassword.value;
  
  if (!name || !email || !password) {
    showAuthError('Please fill in all fields');
    return;
  }
  
  // Simple email validation
  if (!email.includes('@') || !email.includes('.')) {
    showAuthError('Please enter a valid email address');
    return;
  }
  
  if (password.length < 6) {
    showAuthError('Password must be at least 6 characters');
    return;
  }
  
  setAuthLoading(elements.signupForm, true);
  hideAuthError();
  
  try {
    const data = await api.signup(name, email, password);
    state.user = data.user;
    await initAuthenticatedApp();
    
    // Celebrate new account
    if (state.settings.showConfetti) {
      celebrate({ count: 50 });
    }
  } catch (error) {
    showAuthError(error.message || 'Signup failed. Please try again.');
  } finally {
    setAuthLoading(elements.signupForm, false);
  }
}

function handleLogout() {
  // Clear all auth data
  api.logout();
  localStorage.clear(); // Clear everything
  sessionStorage.clear();
  
  state.user = null;
  state.habits = [];
  state.completions = {};
  
  // Force reload the page to clear everything
  window.location.reload();
}

function showAuthError(message) {
  elements.authErrorMessage.textContent = message;
  elements.authError.classList.remove('hidden');
}

function hideAuthError() {
  elements.authError.classList.add('hidden');
}

function setAuthLoading(form, loading) {
  const btn = form.querySelector('button[type="submit"]');
  const btnText = btn.querySelector('.btn-text');
  const btnLoader = btn.querySelector('.btn-loader');
  
  if (loading) {
    btn.disabled = true;
    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');
  } else {
    btn.disabled = false;
    btnText.classList.remove('hidden');
    btnLoader.classList.add('hidden');
  }
}

function updateUserInfo() {
  if (state.user) {
    elements.userName.textContent = state.user.name;
    elements.userEmail.textContent = state.user.email;
    elements.userAvatar.textContent = state.user.name.charAt(0).toUpperCase();
  }
}

// ============================================
// Theme Management
// ============================================

function applyTheme() {
  document.documentElement.setAttribute(
    'data-theme',
    state.settings.darkMode ? 'dark' : 'light'
  );
}

function updateSettingsUI() {
  elements.darkModeToggle.checked = state.settings.darkMode;
  elements.weekStartSelect.value = state.settings.weekStartsOn;
  elements.confettiToggle.checked = state.settings.showConfetti;
}

// ============================================
// Rendering Functions
// ============================================

function renderDateHeader() {
  const dateStr = utils.formatDateDisplay(state.currentDate);
  const subtitle = utils.formatDate(state.currentDate);
  
  elements.currentDate.textContent = dateStr;
  elements.dateSubtitle.textContent = subtitle !== dateStr ? subtitle : '';
}

function getHabitId(habit) {
  return state.useBackend ? habit._id : habit.id;
}

function renderHabits() {
  const dateStr = utils.formatDate(state.currentDate);
  const today = utils.getToday();
  
  // Filter habits that are active
  const activeHabits = state.habits.filter(h => !h.archived);
  
  if (activeHabits.length === 0) {
    elements.habitsList.innerHTML = '';
    elements.emptyState.classList.remove('hidden');
    return;
  }
  
  elements.emptyState.classList.add('hidden');
  
  // Get week dates
  const weekStart = utils.getWeekStart(state.currentDate, state.settings.weekStartsOn);
  const weekDates = utils.getWeekDates(weekStart);
  
  elements.habitsList.innerHTML = activeHabits.map(habit => {
    const habitId = getHabitId(habit);
    const completions = state.completions[habitId] || [];
    const stats = score.getHabitStats(completions, habit);
    
    return `
      <div class="habit-card" data-habit-id="${habitId}" style="--habit-color: ${habit.color}">
        <div class="habit-header">
          <div class="habit-icon">${habit.icon}</div>
          <div class="habit-info">
            <div class="habit-name">${utils.escapeHtml(habit.name)}</div>
            <div class="habit-meta">
              <span class="habit-streak">
                ${stats.currentStreak > 0 ? `<span class="streak-fire">🔥</span> ${stats.currentStreak} day${stats.currentStreak !== 1 ? 's' : ''}` : 'No streak'}
              </span>
            </div>
          </div>
        </div>
        
        <div class="habit-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${Math.round(stats.score * 100)}%"></div>
          </div>
          <div class="progress-text">
            <span>${Math.round(stats.score * 100)}% strength</span>
            <span>${stats.total} total</span>
          </div>
        </div>
        
        <div class="habit-week">
          ${weekDates.map(date => {
            const dayStr = utils.formatDate(date);
            const isCompleted = completions.includes(dayStr);
            const isToday = utils.isSameDay(date, today);
            const isFuture = utils.isFuture(date);
            
            return `
              <div class="week-day">
                <span class="week-day-label">${utils.getDayName(date)}</span>
                <button 
                  class="week-day-check ${isCompleted ? 'completed' : ''} ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''}"
                  data-date="${dayStr}"
                  ${isFuture ? 'disabled' : ''}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
  
  // Also render all habits view
  renderAllHabits();
}

function renderAllHabits() {
  const activeHabits = state.habits.filter(h => !h.archived);
  
  elements.allHabitsList.innerHTML = activeHabits.map(habit => {
    const habitId = getHabitId(habit);
    const completions = state.completions[habitId] || [];
    const stats = score.getHabitStats(completions, habit);
    
    return `
      <div class="habit-card" data-habit-id="${habitId}" style="--habit-color: ${habit.color}">
        <div class="habit-header">
          <div class="habit-icon">${habit.icon}</div>
          <div class="habit-info">
            <div class="habit-name">${utils.escapeHtml(habit.name)}</div>
            <div class="habit-meta">
              <span>${getFrequencyLabel(habit)}</span>
              <span>•</span>
              <span>${Math.round(stats.score * 100)}%</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function getFrequencyLabel(habit) {
  switch (habit.frequency) {
    case 'daily': return 'Every day';
    case 'weekly': return `${habit.timesPerWeek}x per week`;
    case 'interval': return `Every ${habit.interval} days`;
    default: return 'Every day';
  }
}

// ============================================
// Event Listeners
// ============================================

function setupEventListeners() {
  // Auth form handlers
  elements.loginForm?.addEventListener('submit', handleLogin);
  elements.signupForm?.addEventListener('submit', handleSignup);
  
  // Auth switch links
  elements.showSignup?.addEventListener('click', (e) => {
    e.preventDefault();
    elements.loginForm.classList.add('hidden');
    elements.signupForm.classList.remove('hidden');
    hideAuthError();
  });
  
  elements.showLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    elements.signupForm.classList.add('hidden');
    elements.loginForm.classList.remove('hidden');
    hideAuthError();
  });
  
  // FAB - Add habit
  elements.fab.addEventListener('click', () => openHabitModal());
  
  // Date navigation
  elements.prevDay.addEventListener('click', () => navigateDate(-1));
  elements.nextDay.addEventListener('click', () => navigateDate(1));
  
  // Tab navigation
  elements.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  
  // Bottom navigation
  elements.bottomNavBtns.forEach(btn => {
    btn.addEventListener('click', () => handleBottomNav(btn.dataset.view));
  });
  
  // Side menu
  elements.menuBtn.addEventListener('click', () => toggleSideMenu(true));
  elements.sideMenu.querySelector('.side-menu-overlay').addEventListener('click', () => toggleSideMenu(false));
  
  // Menu actions
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      handleMenuAction(item.dataset.action);
    });
  });
  
  // Habit card clicks
  elements.habitsList.addEventListener('click', handleHabitClick);
  elements.allHabitsList.addEventListener('click', handleHabitClick);
  
  // Habit form
  elements.habitForm.addEventListener('submit', handleHabitSubmit);
  document.getElementById('cancel-habit-btn').addEventListener('click', () => closeModal(elements.habitModal));
  
  // Frequency change
  elements.habitFrequency.addEventListener('change', handleFrequencyChange);
  
  // Color picker
  elements.colorPicker.addEventListener('click', (e) => {
    if (e.target.classList.contains('color-option')) {
      selectColor(e.target);
    }
  });
  
  // Icon picker
  elements.iconPicker.addEventListener('click', (e) => {
    if (e.target.classList.contains('icon-option')) {
      selectIcon(e.target);
    }
  });
  
  // Modal close buttons
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal');
      closeModal(modal);
    });
  });
  
  // Modal backdrop clicks
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  });
  
  // Settings
  elements.darkModeToggle.addEventListener('change', handleDarkModeToggle);
  elements.weekStartSelect.addEventListener('change', handleWeekStartChange);
  elements.confettiToggle.addEventListener('change', handleConfettiToggle);
  elements.exportBtn.addEventListener('click', handleExport);
  elements.clearDataBtn.addEventListener('click', handleClearData);
  
  // Header buttons
  document.getElementById('stats-btn').addEventListener('click', () => openStatisticsModal());
  document.getElementById('settings-btn').addEventListener('click', () => openModal(elements.settingsModal));
  
  // Habit detail
  elements.prevMonth.addEventListener('click', () => navigateMonth(-1));
  elements.nextMonth.addEventListener('click', () => navigateMonth(1));
  elements.editHabitBtn.addEventListener('click', () => editSelectedHabit());
  elements.deleteHabitBtn.addEventListener('click', () => confirmDeleteHabit());
  
  // Confirm dialog
  elements.confirmCancel.addEventListener('click', () => closeModal(elements.confirmDialog));
  
  // Import file
  elements.importFile?.addEventListener('change', handleImport);
  
  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboard);
}

function handleHabitClick(e) {
  const card = e.target.closest('.habit-card');
  if (!card) return;
  
  const habitId = card.dataset.habitId;
  const checkBtn = e.target.closest('.week-day-check');
  
  if (checkBtn && !checkBtn.disabled) {
    // Toggle completion
    const date = checkBtn.dataset.date;
    toggleHabitCompletion(habitId, date, checkBtn);
  } else if (!checkBtn) {
    // Open habit detail
    openHabitDetail(habitId);
  }
}

async function toggleHabitCompletion(habitId, date, button) {
  try {
    const wasCompleted = button.classList.contains('completed');
    let isNowCompleted;
    
    if (state.useBackend) {
      isNowCompleted = await api.toggleCompletion(habitId, date);
    } else {
      isNowCompleted = await db.toggleCompletion(parseInt(habitId), date);
    }
    
    // Update local state
    if (!state.completions[habitId]) {
      state.completions[habitId] = [];
    }
    
    if (isNowCompleted) {
      if (!state.completions[habitId].includes(date)) {
        state.completions[habitId].push(date);
      }
      button.classList.add('completed');
      
      // Celebrate with confetti
      if (state.settings.showConfetti && utils.isToday(date)) {
        const rect = button.getBoundingClientRect();
        celebrate({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          count: 25
        });
      }
      
      // Haptic feedback
      utils.vibrate(10);
    } else {
      state.completions[habitId] = state.completions[habitId].filter(d => d !== date);
      button.classList.remove('completed');
    }
    
    // Update the habit card stats
    renderHabits();
    
  } catch (error) {
    console.error('Failed to toggle completion:', error);
    showToast('Failed to update habit');
  }
}

// ============================================
// Navigation
// ============================================

function navigateDate(direction) {
  const newDate = new Date(state.currentDate);
  newDate.setDate(newDate.getDate() + direction);
  
  // Don't go into the future
  if (newDate > utils.getToday()) return;
  
  state.currentDate = newDate;
  renderDateHeader();
  renderHabits();
}

function switchTab(tab) {
  elements.tabBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  
  document.querySelectorAll('.view').forEach(view => {
    view.classList.toggle('active', view.id === `${tab}-view`);
  });
}

function handleBottomNav(view) {
  elements.bottomNavBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  
  switch (view) {
    case 'home':
      closeAllModals();
      break;
    case 'statistics':
      openStatisticsModal();
      break;
    case 'settings':
      openModal(elements.settingsModal);
      break;
  }
}

// ============================================
// Modal Management
// ============================================

function openModal(modal) {
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
  modal.classList.remove('open');
  document.body.style.overflow = '';
  
  // Destroy charts when closing modals
  if (modal === elements.statisticsModal) {
    charts.destroyChart(state.charts.monthly);
    charts.destroyChart(state.charts.weekly);
    state.charts.monthly = null;
    state.charts.weekly = null;
  }
  if (modal === elements.habitDetailModal) {
    charts.destroyChart(state.charts.habitScore);
    state.charts.habitScore = null;
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal.open').forEach(modal => {
    closeModal(modal);
  });
}

function openHabitModal(habit = null) {
  const isEdit = !!habit;
  
  document.getElementById('habit-modal-title').textContent = isEdit ? 'Edit Habit' : 'Create Habit';
  
  // Reset form
  elements.habitForm.reset();
  elements.habitId.value = '';
  
  // Reset pickers
  document.querySelectorAll('.color-option').forEach((opt, i) => {
    opt.classList.toggle('selected', i === 0);
  });
  document.querySelectorAll('.icon-option').forEach((opt, i) => {
    opt.classList.toggle('selected', i === 0);
  });
  
  // Hide frequency options
  document.getElementById('weekly-options').style.display = 'none';
  document.getElementById('interval-options').style.display = 'none';
  
  if (isEdit) {
    const habitId = getHabitId(habit);
    elements.habitId.value = habitId;
    elements.habitName.value = habit.name;
    elements.habitQuestion.value = habit.question || '';
    elements.habitFrequency.value = habit.frequency || 'daily';
    elements.habitTimesPerWeek.value = habit.timesPerWeek || 3;
    elements.habitInterval.value = habit.interval || 2;
    
    // Select color
    document.querySelectorAll('.color-option').forEach(opt => {
      opt.classList.toggle('selected', opt.dataset.color === habit.color);
    });
    
    // Select icon
    document.querySelectorAll('.icon-option').forEach(opt => {
      opt.classList.toggle('selected', opt.dataset.icon === habit.icon);
    });
    
    handleFrequencyChange();
  }
  
  openModal(elements.habitModal);
  elements.habitName.focus();
}

async function handleHabitSubmit(e) {
  e.preventDefault();
  
  const id = elements.habitId.value;
  const name = elements.habitName.value.trim();
  const question = elements.habitQuestion.value.trim();
  const frequency = elements.habitFrequency.value;
  const color = document.querySelector('.color-option.selected')?.dataset.color || '#6c5ce7';
  const icon = document.querySelector('.icon-option.selected')?.dataset.icon || '🎯';
  
  if (!name) {
    showToast('Please enter a habit name');
    return;
  }
  
  const habitData = {
    name,
    question,
    frequency,
    color,
    icon,
    timesPerWeek: parseInt(elements.habitTimesPerWeek.value) || 3,
    interval: parseInt(elements.habitInterval.value) || 2
  };
  
  try {
    if (id) {
      // Update existing habit
      if (state.useBackend) {
        await api.updateHabit(id, habitData);
      } else {
        const existingHabit = state.habits.find(h => h.id === parseInt(id));
        await db.updateHabit({ ...existingHabit, ...habitData });
      }
      showToast('Habit updated');
    } else {
      // Create new habit
      if (state.useBackend) {
        await api.createHabit(habitData);
      } else {
        await db.createHabit(habitData);
      }
      showToast('Habit created');
      
      // Celebrate new habit
      if (state.settings.showConfetti) {
        celebrate({ count: 50 });
      }
    }
    
    // Reload and render
    if (state.useBackend) {
      await loadHabitsFromBackend();
    } else {
      await loadHabitsFromLocal();
    }
    renderHabits();
    closeModal(elements.habitModal);
    
  } catch (error) {
    console.error('Failed to save habit:', error);
    showToast('Failed to save habit');
  }
}

function handleFrequencyChange() {
  const frequency = elements.habitFrequency.value;
  
  document.getElementById('weekly-options').style.display = 
    frequency === 'weekly' ? 'block' : 'none';
  document.getElementById('interval-options').style.display = 
    frequency === 'interval' ? 'block' : 'none';
}

function selectColor(option) {
  document.querySelectorAll('.color-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  option.classList.add('selected');
}

function selectIcon(option) {
  document.querySelectorAll('.icon-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  option.classList.add('selected');
}

// ============================================
// Habit Detail
// ============================================

function openHabitDetail(habitId) {
  const habit = state.habits.find(h => getHabitId(h) === habitId);
  if (!habit) return;
  
  state.selectedHabit = habit;
  state.calendarMonth = new Date();
  
  const completions = state.completions[habitId] || [];
  const stats = score.getHabitStats(completions, habit);
  
  // Update header
  elements.detailIcon.textContent = habit.icon;
  elements.detailTitle.textContent = habit.name;
  
  // Update stats
  elements.detailScore.textContent = `${Math.round(stats.score * 100)}%`;
  elements.detailStreak.textContent = stats.currentStreak;
  elements.detailBest.textContent = stats.bestStreak;
  elements.detailTotal.textContent = stats.total;
  
  // Render calendar
  renderCalendar();
  
  // Render score chart
  renderHabitScoreChart(stats.scoreHistory, habit.color);
  
  openModal(elements.habitDetailModal);
}

function renderCalendar() {
  const habit = state.selectedHabit;
  if (!habit) return;
  
  const habitId = getHabitId(habit);
  const year = state.calendarMonth.getFullYear();
  const month = state.calendarMonth.getMonth();
  const completions = new Set(state.completions[habitId] || []);
  const today = utils.getToday();
  
  // Update month label
  elements.calendarMonth.textContent = `${utils.getMonthName(state.calendarMonth)} ${year}`;
  
  // Get calendar days
  const days = utils.getCalendarDays(year, month, state.settings.weekStartsOn);
  
  elements.calendarGrid.innerHTML = days.map(({ date, isCurrentMonth }) => {
    if (!isCurrentMonth) {
      return '<div class="calendar-day empty"></div>';
    }
    
    const dateStr = utils.formatDate(date);
    const isCompleted = completions.has(dateStr);
    const isToday = utils.isSameDay(date, today);
    const isFuture = utils.isFuture(date);
    
    return `
      <div 
        class="calendar-day ${isCompleted ? 'completed' : ''} ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''}"
        data-date="${dateStr}"
      >
        ${date.getDate()}
      </div>
    `;
  }).join('');
  
  // Add click handlers for calendar days
  elements.calendarGrid.querySelectorAll('.calendar-day:not(.empty):not(.future)').forEach(day => {
    day.addEventListener('click', async () => {
      const date = day.dataset.date;
      const habitId = getHabitId(state.selectedHabit);
      
      let isCompleted;
      if (state.useBackend) {
        isCompleted = await api.toggleCompletion(habitId, date);
      } else {
        isCompleted = await db.toggleCompletion(parseInt(habitId), date);
      }
      
      if (isCompleted) {
        if (!state.completions[habitId].includes(date)) {
          state.completions[habitId].push(date);
        }
        day.classList.add('completed');
      } else {
        state.completions[habitId] = state.completions[habitId].filter(d => d !== date);
        day.classList.remove('completed');
      }
      
      // Update stats
      const completions = state.completions[habitId] || [];
      const stats = score.getHabitStats(completions, state.selectedHabit);
      
      elements.detailScore.textContent = `${Math.round(stats.score * 100)}%`;
      elements.detailStreak.textContent = stats.currentStreak;
      elements.detailBest.textContent = stats.bestStreak;
      elements.detailTotal.textContent = stats.total;
      
      // Update main view
      renderHabits();
    });
  });
}

function navigateMonth(direction) {
  state.calendarMonth.setMonth(state.calendarMonth.getMonth() + direction);
  renderCalendar();
}

function renderHabitScoreChart(scoreHistory, habitColor) {
  charts.destroyChart(state.charts.habitScore);
  
  const ctx = elements.habitScoreChart.getContext('2d');
  state.charts.habitScore = charts.createScoreChart(ctx, scoreHistory, habitColor);
}

function editSelectedHabit() {
  if (!state.selectedHabit) return;
  closeModal(elements.habitDetailModal);
  openHabitModal(state.selectedHabit);
}

function confirmDeleteHabit() {
  if (!state.selectedHabit) return;
  
  elements.confirmTitle.textContent = 'Delete Habit?';
  elements.confirmMessage.textContent = `Are you sure you want to delete "${state.selectedHabit.name}"? This action cannot be undone.`;
  elements.confirmOk.textContent = 'Delete';
  elements.confirmOk.onclick = deleteSelectedHabit;
  
  openModal(elements.confirmDialog);
}

async function deleteSelectedHabit() {
  if (!state.selectedHabit) return;
  
  const habitId = getHabitId(state.selectedHabit);
  
  try {
    if (state.useBackend) {
      await api.deleteHabit(habitId);
    } else {
      await db.deleteHabit(parseInt(habitId));
    }
    delete state.completions[habitId];
    
    if (state.useBackend) {
      await loadHabitsFromBackend();
    } else {
      await loadHabitsFromLocal();
    }
    renderHabits();
    
    closeModal(elements.confirmDialog);
    closeModal(elements.habitDetailModal);
    
    showToast('Habit deleted');
    state.selectedHabit = null;
    
  } catch (error) {
    console.error('Failed to delete habit:', error);
    showToast('Failed to delete habit');
  }
}

// ============================================
// Statistics
// ============================================

async function openStatisticsModal() {
  // Calculate stats
  const todayStr = utils.formatDate(utils.getToday());
  let completedToday = 0;
  let bestStreakOverall = 0;
  let totalScore = 0;
  
  state.habits.forEach(habit => {
    const habitId = getHabitId(habit);
    const completions = state.completions[habitId] || [];
    const stats = score.getHabitStats(completions, habit);
    
    if (completions.includes(todayStr)) {
      completedToday++;
    }
    
    if (stats.bestStreak > bestStreakOverall) {
      bestStreakOverall = stats.bestStreak;
    }
    
    totalScore += stats.score;
  });
  
  const avgScore = state.habits.length > 0 ? totalScore / state.habits.length : 0;
  
  // Update stats display
  elements.totalHabits.textContent = state.habits.length;
  elements.completedToday.textContent = completedToday;
  elements.bestStreak.textContent = bestStreakOverall;
  elements.overallScore.textContent = `${Math.round(avgScore * 100)}%`;
  
  // Build completions map for charts
  const completionsMap = {};
  
  Object.values(state.completions).forEach(dates => {
    dates.forEach(date => {
      completionsMap[date] = (completionsMap[date] || 0) + 1;
    });
  });
  
  // Generate chart data
  const dailyData = charts.generateDailyData(completionsMap, 30);
  
  // Calculate weekly data
  const weeklyData = [0, 0, 0, 0, 0, 0, 0];
  Object.values(state.completions).forEach(dates => {
    dates.forEach(dateStr => {
      const date = new Date(dateStr);
      weeklyData[date.getDay()]++;
    });
  });
  
  // Destroy existing charts
  charts.destroyChart(state.charts.monthly);
  charts.destroyChart(state.charts.weekly);
  
  // Create new charts
  const monthlyCtx = elements.monthlyChart.getContext('2d');
  state.charts.monthly = charts.createMonthlyChart(monthlyCtx, dailyData, state.habits.length);
  
  const weeklyCtx = elements.weeklyChart.getContext('2d');
  state.charts.weekly = charts.createWeeklyChart(weeklyCtx, weeklyData);
  
  openModal(elements.statisticsModal);
}

// ============================================
// Settings
// ============================================

async function handleDarkModeToggle() {
  state.settings.darkMode = elements.darkModeToggle.checked;
  
  if (state.useBackend) {
    await api.updateSettings({ darkMode: state.settings.darkMode });
  } else {
    await db.setSetting('darkMode', state.settings.darkMode);
  }
  
  applyTheme();
}

async function handleWeekStartChange() {
  state.settings.weekStartsOn = parseInt(elements.weekStartSelect.value);
  
  if (state.useBackend) {
    await api.updateSettings({ weekStartsOn: state.settings.weekStartsOn });
  } else {
    await db.setSetting('weekStartsOn', state.settings.weekStartsOn);
  }
  
  renderHabits();
}

async function handleConfettiToggle() {
  state.settings.showConfetti = elements.confettiToggle.checked;
  
  if (state.useBackend) {
    await api.updateSettings({ showConfetti: state.settings.showConfetti });
  } else {
    await db.setSetting('showConfetti', state.settings.showConfetti);
  }
}

async function handleExport() {
  try {
    // Build CSV from current state
    const habits = state.habits;
    const allDates = new Set();
    
    Object.values(state.completions).forEach(dates => {
      dates.forEach(d => allDates.add(d));
    });
    
    const sortedDates = [...allDates].sort();
    
    if (sortedDates.length === 0) {
      showToast('No data to export');
      return;
    }
    
    let csv = 'Habit,' + sortedDates.join(',') + '\n';
    
    habits.forEach(habit => {
      const habitId = getHabitId(habit);
      const completions = new Set(state.completions[habitId] || []);
      const row = [habit.name];
      
      sortedDates.forEach(date => {
        row.push(completions.has(date) ? '1' : '0');
      });
      
      csv += row.join(',') + '\n';
    });
    
    const date = utils.formatDate(new Date());
    utils.downloadFile(csv, `loop-habits-${date}.csv`, 'text/csv');
    showToast('Data exported successfully');
  } catch (error) {
    console.error('Export failed:', error);
    showToast('Failed to export data');
  }
}

function handleClearData() {
  elements.confirmTitle.textContent = 'Clear All Data?';
  elements.confirmMessage.textContent = 'This will delete all habits and completion history. This action cannot be undone.';
  elements.confirmOk.textContent = 'Clear All';
  elements.confirmOk.onclick = async () => {
    try {
      if (!state.useBackend) {
        await db.clearAllData();
      }
      // For backend, user would need to delete habits one by one or we'd need a clear endpoint
      
      state.habits = [];
      state.completions = {};
      renderHabits();
      closeModal(elements.confirmDialog);
      closeModal(elements.settingsModal);
      showToast('All data cleared');
    } catch (error) {
      console.error('Failed to clear data:', error);
      showToast('Failed to clear data');
    }
  };
  
  openModal(elements.confirmDialog);
}

async function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  try {
    const content = await utils.readFileAsText(file);
    const data = JSON.parse(content);
    
    if (!state.useBackend) {
      await db.importData(data);
      await loadHabitsFromLocal();
    }
    
    renderHabits();
    showToast('Data imported successfully');
  } catch (error) {
    console.error('Import failed:', error);
    showToast('Failed to import data. Make sure file is valid JSON.');
  }
  
  // Reset file input
  e.target.value = '';
}

// ============================================
// Side Menu
// ============================================

function toggleSideMenu(open) {
  elements.sideMenu.classList.toggle('open', open);
}

function handleMenuAction(action) {
  toggleSideMenu(false);
  
  switch (action) {
    case 'export-csv':
      handleExport();
      break;
    case 'import':
      elements.importFile?.click();
      break;
    case 'about':
      openModal(elements.aboutModal);
      break;
    case 'logout':
      handleLogout();
      break;
  }
}

// ============================================
// Utilities
// ============================================

function showToast(message, duration = 3000) {
  elements.toastMessage.textContent = message;
  elements.toast.classList.add('show');
  
  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, duration);
}

function handleKeyboard(e) {
  // Escape to close modals
  if (e.key === 'Escape') {
    const openModal = document.querySelector('.modal.open');
    if (openModal) {
      closeModal(openModal);
    } else if (elements.sideMenu.classList.contains('open')) {
      toggleSideMenu(false);
    }
  }
  
  // N for new habit
  if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
    const activeElement = document.activeElement;
    if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
      openHabitModal();
    }
  }
}

// ============================================
// Service Worker
// ============================================

async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered:', registration.scope);
    } catch (error) {
      console.log('Service Worker registration failed:', error);
    }
  }
}

// ============================================
// Start the App
// ============================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
