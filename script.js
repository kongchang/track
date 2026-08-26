// ============================================================
// ระบบติดตามแฟ้มเอกสาร — app logic (Firebase Auth + Firestore backend)
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  getFirestore, collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';

// ============ Authentication (Firebase Authentication) ============
// บัญชีผู้ใช้ถูกจัดเก็บและตรวจสอบโดย Firebase ไม่ใช่ค่าฝังในโค้ดอีกต่อไป
// ต้องไปเปิดใช้งาน Email/Password ใน Firebase Console > Authentication > Sign-in method
// แล้วเพิ่มผู้ใช้ (Add user) ด้วยอีเมล/รหัสผ่านที่ต้องการก่อนจึงจะล็อกอินได้

// ผู้ใช้กรอก "ชื่อผู้ใช้" ธรรมดาได้ตามเดิม โดยระบบจะต่อโดเมนนี้ให้กลายเป็นอีเมลสำหรับ Firebase Auth
// (ถ้าพิมพ์เป็นอีเมลเต็มอยู่แล้ว เช่น admin@gmail.com ระบบจะใช้ตามที่กรอกโดยไม่ต่อโดเมน)
const AUTH_EMAIL_DOMAIN = 'stnkongchang.local';
function toAuthEmail(usernameOrEmail) {
  const v = usernameOrEmail.trim();
  return v.includes('@') ? v : `${v}@${AUTH_EMAIL_DOMAIN}`;
}

const loginPage = document.getElementById('loginPage');
const loginForm = document.getElementById('loginForm');
const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const passwordToggle = document.getElementById('passwordToggle');
const loginError = document.getElementById('loginError');
const loginButton = loginForm.querySelector('.login-button');

function showLoggedOutUI() {
  loginPage.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function showLoggedInUI() {
  loginPage.classList.add('hidden');
  document.body.style.overflow = 'auto';
}

// จัดการการล็อกเอาต์
function logout() {
  if (!auth) return;
  signOut(auth).catch((err) => console.error('Logout failed:', err));
  loginForm.reset();
  loginError.hidden = true;
}

// Toggle password visibility
passwordToggle.addEventListener('click', () => {
  const isPassword = loginPassword.type === 'password';
  loginPassword.type = isPassword ? 'text' : 'password';
});

// Handle login form submit
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!auth) {
    loginError.textContent = '⚠️ ยังเชื่อมต่อ Firebase Authentication ไม่ได้ ตรวจสอบ firebase-config.js';
    loginError.hidden = false;
    return;
  }

  const email = toAuthEmail(loginUsername.value);
  const password = loginPassword.value;

  loginError.hidden = true;
  loginButton.disabled = true;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginForm.reset();
  } catch (err) {
    console.error('Login failed:', err);
    loginError.textContent = '❌ ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
    loginError.hidden = false;
    loginPassword.value = '';
    loginPassword.focus();
  } finally {
    loginButton.disabled = false;
  }
});

const CHECK_SVG = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.5 4L6 11.5L2.5 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const EDIT_SVG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.474 5.408a2.5 2.5 0 0 1 3.536 3.536L7.5 21.454 3 22l.546-4.5L16.474 5.408Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
const TRASH_SVG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7H20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M9 7V5C9 4.44772 9.44772 4 10 4H14C14.5523 4 15 4.44772 15 5V7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 7L6.75 19.25C6.80228 20.1074 7.51555 20.75 8.375 20.75H15.625C16.4845 20.75 17.1977 20.1074 17.25 19.25L18 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 11V16.5M14 11V16.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const TRASH_SVG_LARGE = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M9 7V5C9 4.44772 9.44772 4 10 4H14C14.5523 4 15 4.44772 15 5V7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 7L6.75 19.25C6.80228 20.1074 7.51555 20.75 8.375 20.75H15.625C16.4845 20.75 17.1977 20.1074 17.25 19.25L18 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 11V16.5M14 11V16.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
const DOC_SVG = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.5 3.5H13L18 8.5V19.5C18 20.0523 17.5523 20.5 17 20.5H6.5C5.94772 20.5 5.5 20.0523 5.5 19.5V4.5C5.5 3.94772 5.94772 3.5 6.5 3.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M13 3.5V7.5C13 8.05228 13.4477 8.5 14 8.5H18" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
const CLOCK_SVG = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:-2px; margin-right:3px;"><circle cx="12" cy="13" r="8" stroke="currentColor" stroke-width="1.8"/><path d="M12 9V13L15 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.5 2.5H14.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

// ---------- Workflow steps ----------
// ลำดับขั้นตอนที่แฟ้มต้องผ่านตามลำดับ ห้ามข้ามขั้นตอน
const WORKFLOW_STEPS = [
  { key: 'name',      label: 'ชื่อ' },
  { key: 'map',       label: 'แผนที่' },
  { key: 'district',  label: 'ช่างเขต' },
  { key: 'architect', label: 'สถาปนิก' },
  { key: 'director',  label: 'ผอ.' },
  { key: 'secretary', label: 'ปลัด' },
  { key: 'deputy',    label: 'รองนายก' }
];

function defaultSteps() {
  const obj = {};
  WORKFLOW_STEPS.forEach(s => { obj[s.key] = { done: false, date: null }; });
  return obj;
}

// รองรับข้อมูลเก่าที่อาจยังไม่มีฟิลด์ steps
function getSteps(entry) {
  return entry.steps || defaultSteps();
}

function getCompletedCount(entry) {
  const steps = getSteps(entry);
  return WORKFLOW_STEPS.reduce((n, s) => n + (steps[s.key] && steps[s.key].done ? 1 : 0), 0);
}

// index (0-based) ของขั้นตอนแรกที่ยังไม่เสร็จ, หรือความยาว WORKFLOW_STEPS ถ้าเสร็จหมดแล้ว
function getCurrentStepIndex(entry) {
  const steps = getSteps(entry);
  for (let i = 0; i < WORKFLOW_STEPS.length; i++) {
    if (!steps[WORKFLOW_STEPS[i].key] || !steps[WORKFLOW_STEPS[i].key].done) return i;
  }
  return WORKFLOW_STEPS.length;
}

function getEntryStatus(entry) {
  const n = getCompletedCount(entry);
  if (n === 0) return 'not-started';
  if (n === WORKFLOW_STEPS.length) return 'done';
  return 'pending';
}

// ---------- Elements ----------
const navBtns = document.querySelectorAll('.nav-btn:not(.logout-btn)');
const logoutBtn = document.getElementById('logoutBtn');
const pages = document.querySelectorAll('.page');

const addFileHeader = document.getElementById('addFileHeader');
const form = document.getElementById('addFileForm');
const titleInput = document.getElementById('titleInput');
const receiveNoInput = document.getElementById('receiveNoInput');
const receiveDateInput = document.getElementById('receiveDateInput');
const descInput = document.getElementById('descInput');
const noteInput = document.getElementById('noteInput');
const photoInput = document.getElementById('photoInput');
const photoUploadBox = document.getElementById('photoUploadBox');
const photoPreview = document.getElementById('photoPreview');
const previewImg = document.getElementById('previewImg');
const previewName = document.getElementById('previewName');
const removePhotoBtn = document.getElementById('removePhotoBtn');
const submitBtn = document.getElementById('submitBtn');

const fileList = document.getElementById('fileList');
const emptyState = document.getElementById('emptyState');
const emptyTitle = document.getElementById('emptyTitle');
const emptyText = document.getElementById('emptyText');

const statTotal = document.getElementById('statTotal');
const statPending = document.getElementById('statPending');
const statDone = document.getElementById('statDone');
const countAll = document.getElementById('countAll');
const countPending = document.getElementById('countPending');
const countDone = document.getElementById('countDone');

const filterTabs = document.querySelectorAll('.filter-tab');
const timeframeChips = document.querySelectorAll('.timeframe-chip');
const timeframeCustomRange = document.getElementById('timeframeCustomRange');
const timeframeDate = document.getElementById('timeframeDate');
const searchInput = document.getElementById('searchInput');
const searchClearBtn = document.getElementById('searchClearBtn');
const pagination = document.getElementById('pagination');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');
const connStatus = document.getElementById('connStatus');
const detailModalBackdrop = document.getElementById('detailModalBackdrop');
const detailModalBody = document.getElementById('detailModalBody');
const detailModalClose = document.getElementById('detailModalClose');
const detailEditBtn = document.getElementById('detailEditBtn');
const detailDeleteBtn = document.getElementById('detailDeleteBtn');

// ---------- State ----------
let state = { entries: [] };
let seqMap = new Map(); // id -> running number, computed each render from createdAt order
let currentFilter = 'all';
let currentTimeframe = 'all'; // 'all' | 'today' | 'week' | 'month' | 'year' | 'custom'
let customDate = ''; // ISO date string (yyyy-mm-dd) เลือกจาก "เลือกวันที่"
let searchQuery = '';
let currentPage = 1;
const PAGE_SIZE = 6;
let pendingPhoto = null;
let pendingPhotoFile = null;
let editingDateFor = null; // { id, key } เช่น { id: 'e123', key: 'map' } — ขั้นตอนที่กำลังกรอกวันที่ค้างอยู่
let editingEntryId = null; // id ของแฟ้มที่กำลังแก้ไข, null = โหมดเพิ่มแฟ้มใหม่
let openModalEntryId = null; // id ของแฟ้มที่หน้าต่างรายละเอียดกำลังเปิดอยู่ (ใช้รีเฟรชเนื้อหาเมื่อ state เปลี่ยน)

// ============ Connection status banner ============
function showConnMessage(msg, isError) {
  connStatus.textContent = msg;
  connStatus.hidden = false;
  connStatus.classList.toggle('error', !!isError);
}
function hideConnMessage() {
  connStatus.hidden = true;
}

// ============ Firebase setup (Auth + Firestore share one app instance) ============
let auth = null;
let db = null;
let entriesCol = null;

if (firebaseConfig.apiKey === 'YOUR_API_KEY') {
  showConnMessage('⚠️ ยังไม่ได้ตั้งค่า Firebase — แก้ไขไฟล์ firebase-config.js ด้วยค่าโปรเจกต์ของคุณ แล้วรีเฟรชหน้านี้', true);
  showLoggedOutUI();
} else {
  try {
    const app = initializeApp(firebaseConfig);

    // --- Authentication ---
    auth = getAuth(app);
    // Firebase คงสถานะล็อกอินให้อัตโนมัติ และแจ้งเตือนทุกครั้งที่สถานะเปลี่ยน (ล็อกอิน/ล็อกเอาต์/รีเฟรชหน้า)
    onAuthStateChanged(auth, (user) => {
      if (user) {
        showLoggedInUI();
      } else {
        showLoggedOutUI();
      }
    });

    // --- Firestore ---
    db = getFirestore(app);
    entriesCol = collection(db, 'entries');
    const entriesQuery = query(entriesCol, orderBy('createdAt', 'desc'));

    onSnapshot(entriesQuery, (snapshot) => {
      state.entries = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      hideConnMessage();
      render();
    }, (err) => {
      console.error('Firestore sync error:', err);
      showConnMessage('⚠️ เชื่อมต่อ Firestore ไม่สำเร็จ — ตรวจสอบ Firestore Rules และการตั้งค่าโปรเจกต์', true);
    });
  } catch (err) {
    console.error('Firebase init error:', err);
    showConnMessage('⚠️ ตั้งค่า Firebase ไม่ถูกต้อง — ตรวจสอบไฟล์ firebase-config.js', true);
    showLoggedOutUI();
  }
}

// ============ Firestore write helpers ============
async function addEntry(entryData) {
  if (!entriesCol) {
    showConnMessage('⚠️ ยังเชื่อมต่อ Firebase ไม่ได้ ตรวจสอบ firebase-config.js', true);
    return false;
  }
  try {
    await addDoc(entriesCol, entryData);
    return true;
  } catch (err) {
    console.error('Add failed:', err);
    showConnMessage('⚠️ บันทึกแบบไม่สำเร็จ ลองใหม่อีกครั้ง', true);
    return false;
  }
}

async function updateEntry(id, patch) {
  if (!db) {
    showConnMessage('⚠️ ยังเชื่อมต่อ Firebase ไม่ได้ ตรวจสอบ firebase-config.js', true);
    return false;
  }
  try {
    await updateDoc(doc(db, 'entries', id), patch);
    return true;
  } catch (err) {
    console.error('Update failed:', err);
    showConnMessage('⚠️ อัปเดตข้อมูลไม่สำเร็จ ลองใหม่อีกครั้ง', true);
    return false;
  }
}

async function removeEntry(id) {
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'entries', id));
  } catch (err) {
    console.error('Delete failed:', err);
    showConnMessage('⚠️ ลบแบบไม่สำเร็จ ลองใหม่อีกครั้ง', true);
  }
}

// ============ Navigation ============
navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const pageId = btn.dataset.page + '-page';
    if (pageId === 'add-file-page') {
      // เข้าหน้านี้ผ่านเมนูโดยตรง = เริ่มเพิ่มแฟ้มใหม่ ไม่ใช่แก้ไขแฟ้มเดิม
      resetFormToAddMode();
    } else {
      editingEntryId = null;
    }
    switchPage(pageId);
    navBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// Logout button
logoutBtn.addEventListener('click', () => {
  if (confirm('คุณแน่ใจหรือว่าต้องการออกจากระบบ?')) {
    logout();
  }
});

function switchPage(pageId) {
  const target = document.getElementById(pageId);
  if (!target) {
    console.warn('switchPage: ไม่พบหน้า', pageId); // กันหน้าจอขาวทั้งหน้าเผื่อมี id ไม่ตรงกัน
    return;
  }
  pages.forEach(p => p.classList.remove('active'));
  target.classList.add('active');
}

// ============ Add / Edit form mode helpers ============
function resetFormToAddMode() {
  editingEntryId = null;
  titleInput.value = '';
  receiveNoInput.value = '';
  receiveDateInput.value = new Date().toISOString().split('T')[0];
  descInput.value = '';
  noteInput.value = '';
  pendingPhoto = null;
  pendingPhotoFile = null;
  photoInput.value = '';
  photoPreview.classList.remove('show');
  addFileHeader.textContent = 'เพิ่มแบบใหม่';
  submitBtn.textContent = 'บันทึกแบบใหม่';
}

function openEditForm(id) {
  const entry = state.entries.find(x => x.id === id);
  if (!entry) return;

  editingEntryId = id;
  titleInput.value = entry.title || '';
  receiveNoInput.value = entry.receiveNo || '';
  receiveDateInput.value = entry.receiveDate || new Date().toISOString().split('T')[0];
  descInput.value = entry.desc || '';
  noteInput.value = entry.note || '';

  if (entry.photo) {
    pendingPhoto = entry.photo;
    pendingPhotoFile = null;
    displayPhotoPreview();
  } else {
    pendingPhoto = null;
    pendingPhotoFile = null;
    photoInput.value = '';
    photoPreview.classList.remove('show');
  }

  addFileHeader.textContent = 'แก้ไขแบบ';
  submitBtn.textContent = 'บันทึกการแก้ไข';

  switchPage('add-file-page');
  navBtns.forEach(b => b.classList.remove('active'));
  navBtns[1].classList.add('active');
}

// ============ Photo Upload ============
photoUploadBox.addEventListener('click', () => photoInput.click());

photoUploadBox.addEventListener('dragover', (e) => {
  e.preventDefault();
  photoUploadBox.style.background = '#f0f2f7';
});

photoUploadBox.addEventListener('dragleave', () => {
  photoUploadBox.style.background = '';
});

photoUploadBox.addEventListener('drop', (e) => {
  e.preventDefault();
  photoUploadBox.style.background = '';
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    photoInput.files = files;
    handlePhotoSelect();
  }
});

photoInput.addEventListener('change', handlePhotoSelect);

function handlePhotoSelect() {
  const file = photoInput.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert('ไฟล์ใหญ่เกินไป (สูงสุด 5MB)');
    photoInput.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxW = 600;
      const scale = Math.min(1, maxW / img.width);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      pendingPhoto = canvas.toDataURL('image/jpeg', 0.75);
      pendingPhotoFile = file;
      displayPhotoPreview();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function displayPhotoPreview() {
  previewImg.src = pendingPhoto;
  previewName.textContent = pendingPhotoFile ? pendingPhotoFile.name : 'รูปที่แนบไว้เดิม';
  photoPreview.classList.add('show');
}

removePhotoBtn.addEventListener('click', (e) => {
  e.preventDefault();
  pendingPhoto = null;
  pendingPhotoFile = null;
  photoInput.value = '';
  photoPreview.classList.remove('show');
});

// ============ Form Submit (เพิ่มแฟ้มใหม่ / แก้ไขแฟ้ม) ============
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  if (!title) return;

  const isEditing = !!editingEntryId;

  submitBtn.disabled = true;
  submitBtn.textContent = 'กำลังบันทึก...';

  let ok;
  if (isEditing) {
    ok = await updateEntry(editingEntryId, {
      title: title,
      receiveNo: receiveNoInput.value.trim(),
      receiveDate: receiveDateInput.value || null,
      desc: descInput.value.trim(),
      note: noteInput.value.trim(),
      photo: pendingPhoto
    });
  } else {
    ok = await addEntry({
      title: title,
      receiveNo: receiveNoInput.value.trim(),
      receiveDate: receiveDateInput.value || null,
      desc: descInput.value.trim(),
      note: noteInput.value.trim(),
      photo: pendingPhoto,
      steps: defaultSteps(),
      createdAt: Date.now()
    });
  }

  submitBtn.disabled = false;

  if (!ok) {
    submitBtn.textContent = isEditing ? 'บันทึกการแก้ไข' : 'บันทึกแบบใหม่';
    return;
  }

  currentPage = 1;
  resetFormToAddMode();

  // Switch to dashboard
  switchPage('dashboard-page');
  navBtns.forEach(b => b.classList.remove('active'));
  navBtns[0].classList.add('active');
});

// ============ Step Toggle (7 ขั้นตอนตามลำดับ) ============
function toggleStep(id, stepKey, btn) {
  const entry = state.entries.find(x => x.id === id);
  if (!entry) return;

  // การ์ดในหน้า Dashboard และหน้าต่างรายละเอียด ต่างก็มี id/step ซ้ำกันได้
  // เลยต้องจำไว้ก่อน render() ว่าปุ่มที่กดอยู่ในกล่องไหน (fileList หรือ modal) เพื่อคุมโฟกัสให้ถูกจุด
  const container = (btn && btn.closest('#fileList')) ? fileList : detailModalBody;

  const steps = getSteps(entry);
  const idx = WORKFLOW_STEPS.findIndex(s => s.key === stepKey);
  if (idx === -1) return;

  const isPendingEdit = editingDateFor && editingDateFor.id === id && editingDateFor.key === stepKey;
  const stepDone = steps[stepKey] && steps[stepKey].done;

  // ถ้าขั้นตอนนี้เสร็จแล้ว -> ยกเลิก และยกเลิกทุกขั้นตอนถัดจากนี้ไปด้วย (เพราะขึ้นกับขั้นตอนนี้)
  if (stepDone) {
    const patchSteps = { ...steps };
    for (let i = idx; i < WORKFLOW_STEPS.length; i++) {
      patchSteps[WORKFLOW_STEPS[i].key] = { done: false, date: null };
    }
    updateEntry(id, { steps: patchSteps });
    editingDateFor = null;
    render();
    return;
  }

  // ถ้ากำลังกรอกวันที่ค้างอยู่ (ยังไม่กดบันทึก) แล้วกดซ้ำ ให้ยกเลิกการติ๊ก
  if (isPendingEdit) {
    editingDateFor = null;
    render();
    return;
  }

  // ต้องทำขั้นตอนก่อนหน้าให้เสร็จก่อน ถึงจะเริ่มขั้นตอนนี้ได้ (ห้ามข้ามขั้นตอน)
  for (let i = 0; i < idx; i++) {
    if (!steps[WORKFLOW_STEPS[i].key] || !steps[WORKFLOW_STEPS[i].key].done) return;
  }

  editingDateFor = { id, key: stepKey };
  render();

  setTimeout(() => {
    const datePicker = container.querySelector(`[data-entry-id="${id}"][data-step-key="${stepKey}"] .date-input`);
    if (datePicker) {
      datePicker.focus();
      if (datePicker.showPicker) {
        try { datePicker.showPicker(); } catch (e) {}
      }
    }
  }, 0);
}

function saveStepDate(id, stepKey, btn) {
  const entry = state.entries.find(x => x.id === id);
  if (!entry) return;

  const container = (btn && btn.closest('#fileList')) ? fileList : detailModalBody;
  const picker = container.querySelector(`.date-picker-inline[data-entry-id="${id}"][data-step-key="${stepKey}"]`);
  const input = picker ? picker.querySelector('.date-input') : null;
  if (!input || !input.value) return;

  const steps = getSteps(entry);
  const patchSteps = { ...steps, [stepKey]: { done: true, date: input.value } };

  updateEntry(id, { steps: patchSteps });
  editingDateFor = null;
  render();
}

function cancelStepDate() {
  editingDateFor = null;
  render();
}

function deleteEntry(id) {
  // Show custom confirm dialog with animation
  showDeleteConfirmDialog(id);
}

function showDeleteConfirmDialog(id) {
  // Create custom confirm dialog
  const backdrop = document.createElement('div');
  backdrop.className = 'delete-confirm-backdrop';
  backdrop.innerHTML = `
    <div class="delete-confirm-dialog">
      <div class="delete-confirm-icon">${TRASH_SVG_LARGE}</div>
      <h3 class="delete-confirm-title">ลบแบบนี้?</h3>
      <p class="delete-confirm-text">การกระทำนี้ไม่สามารถยกเลิกได้</p>
      <div class="delete-confirm-actions">
        <button class="delete-confirm-cancel">ยกเลิก</button>
        <button class="delete-confirm-ok">ลบแบบ</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(backdrop);
  
  // Trigger animation
  requestAnimationFrame(() => {
    backdrop.classList.add('show');
  });
  
  const cancelBtn = backdrop.querySelector('.delete-confirm-cancel');
  const okBtn = backdrop.querySelector('.delete-confirm-ok');
  
  function closeDialog() {
    backdrop.classList.remove('show');
    setTimeout(() => {
      backdrop.remove();
    }, 300);
  }
  
  cancelBtn.addEventListener('click', closeDialog);
  
  okBtn.addEventListener('click', async () => {
    // Add deleting animation to the card
    const card = document.querySelector(`[data-action="delete"][data-id="${id}"]`).closest('.file-card');
    card.classList.add('deleting');
    
    // Close dialog
    closeDialog();
    
    // Wait for animation to complete
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Delete the entry
    removeEntry(id);
  });
  
  // Close on backdrop click
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeDialog();
  });
  
  // Close on escape key
  document.addEventListener('keydown', function handleEscape(e) {
    if (e.key === 'Escape') {
      closeDialog();
      document.removeEventListener('keydown', handleEscape);
    }
  });
}

// ============ Rendering ============
function rebuildSeqMap() {
  seqMap = new Map();
  const asc = [...state.entries].sort((a, b) => a.createdAt - b.createdAt);
  asc.forEach((e, idx) => seqMap.set(e.id, idx + 1));
}

function render() {
  rebuildSeqMap();
  refreshOpenModal();

  const total = state.entries.length;
  const pending = state.entries.filter(e => getEntryStatus(e) === 'pending').length;
  const done = state.entries.filter(e => getEntryStatus(e) === 'done').length;

  statTotal.textContent = total;
  statPending.textContent = pending;
  statDone.textContent = done;
  countAll.textContent = total;
  countPending.textContent = pending;
  countDone.textContent = done;

  filterTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.filter === currentFilter);
  });

  timeframeChips.forEach(chip => {
    chip.classList.toggle('active', chip.dataset.timeframe === currentTimeframe);
  });

  const filtered = applyFilter(state.entries);

  if (filtered.length === 0) {
    fileList.innerHTML = '';
    pagination.innerHTML = '';
    emptyState.classList.remove('hidden');
    if (total === 0) {
      emptyTitle.textContent = 'ยังไม่มีแบบในระบบ';
      emptyText.textContent = 'กดปุ่ม "เพิ่มแบบใหม่" เพื่อเริ่มติดตามแบบเอกสารของคุณ';
    } else if (searchQuery) {
      emptyTitle.textContent = 'ไม่พบแบบที่ค้นหา';
      emptyText.textContent = 'ลองค้นหาด้วยคำอื่น หรือล้างคำค้นหา';
    } else {
      emptyTitle.textContent = 'ไม่มีแบบในหมวดนี้';
      emptyText.textContent = 'ลองเลือกแท็บอื่นเพื่อดูแบบทั้งหมด';
    }
    return;
  }

  emptyState.classList.add('hidden');

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  fileList.innerHTML = pageItems.map(entry => createFileCard(entry)).join('');

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  let html = `<button class="page-btn" data-page="prev" ${currentPage === 1 ? 'disabled' : ''} aria-label="ก่อนหน้า">‹</button>`;

  getPageNumbers(currentPage, totalPages).forEach(p => {
    if (p === '...') {
      html += `<span class="page-ellipsis">…</span>`;
    } else {
      html += `<button class="page-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
    }
  });

  html += `<button class="page-btn" data-page="next" ${currentPage === totalPages ? 'disabled' : ''} aria-label="ถัดไป">›</button>`;

  pagination.innerHTML = html;
}

function getPageNumbers(current, total) {
  const delta = 1;
  const range = [];
  const withDots = [];
  let last;

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i);
    }
  }

  range.forEach(i => {
    if (last !== undefined) {
      if (i - last === 2) withDots.push(last + 1);
      else if (i - last !== 1) withDots.push('...');
    }
    withDots.push(i);
    last = i;
  });

  return withDots;
}

function applyFilter(entries) {
  let result = entries;
  if (currentFilter === 'pending') result = result.filter(e => getEntryStatus(e) === 'pending');
  else if (currentFilter === 'done') result = result.filter(e => getEntryStatus(e) === 'done');

  const range = getTimeframeRange();
  if (range) {
    result = result.filter(e => e.createdAt >= range.start.getTime() && e.createdAt < range.end.getTime());
  }

  if (searchQuery) {
    result = result.filter(e => entrySearchText(e).includes(searchQuery));
  }

  // Sort by status: not started → pending → done, then by createdAt descending
  result.sort((a, b) => {
    const statusA = getEntryStatus(a);
    const statusB = getEntryStatus(b);
    const statusOrder = { 'not-started': 0, 'pending': 1, 'done': 2 };
    
    if (statusOrder[statusA] !== statusOrder[statusB]) {
      return statusOrder[statusA] - statusOrder[statusB];
    }
    // If same status, sort by createdAt descending (newest first)
    return b.createdAt - a.createdAt;
  });

  return result;
}

// คำนวณช่วงวันที่ (start inclusive, end exclusive) ตาม currentTimeframe ที่เลือกไว้
// คืนค่า null เมื่อไม่ได้กรองตามช่วงเวลา (เลือก "ทั้งหมด" หรือยังไม่ได้กำหนดช่วงเองครบ)
function getTimeframeRange() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (currentTimeframe === 'today') {
    const start = startOfToday;
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  if (currentTimeframe === 'week') {
    const dayOfWeek = startOfToday.getDay(); // 0 = อาทิตย์
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const start = new Date(startOfToday);
    start.setDate(start.getDate() - diffToMonday);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end };
  }

  if (currentTimeframe === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { start, end };
  }

  if (currentTimeframe === 'year') {
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear() + 1, 0, 1);
    return { start, end };
  }

  if (currentTimeframe === 'custom' && customDate) {
    const start = isoToDateObj(customDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  return null;
}

// รวมข้อความสำหรับค้นหา: ชื่อเรื่อง, รายละเอียด, หมายเหตุ, และวันที่ (สร้าง/ส่งขึ้น/รับลงมา)
// ในหลายรูปแบบ (ไทยเต็ม, ไทยย่อ, ตัวเลข วัน/เดือน/ปี) เพื่อให้ค้นด้วยวัน เดือน หรือปีได้
function entrySearchText(entry) {
  const parts = [entry.title, entry.desc || '', entry.note || '', entry.receiveNo || ''];

  parts.push(dateSearchTokens(new Date(entry.createdAt)));
  if (entry.receiveDate) {
    parts.push(dateSearchTokens(isoToDateObj(entry.receiveDate)));
  }
  const steps = getSteps(entry);
  WORKFLOW_STEPS.forEach(s => {
    if (steps[s.key] && steps[s.key].date) {
      parts.push(dateSearchTokens(isoToDateObj(steps[s.key].date)));
    }
  });

  return parts.join(' ').toLowerCase();
}

function isoToDateObj(isoStr) {
  const [year, month, day] = isoStr.split('-');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

function dateSearchTokens(d) {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const buddhistYear = year + 543;
  const thaiLong = d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  const thaiShort = d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });

  return [
    thaiLong, thaiShort,
    `${day}/${month}/${year}`,
    `${day}-${month}-${year}`,
    `${year}-${month}-${day}`,
    String(year), String(buddhistYear)
  ].join(' ');
}

function createFileCard(entry) {
  const photoHtml = entry.photo
    ? `<img class="file-photo" src="${entry.photo}" alt="รูป: ${escapeHtml(entry.title)}" data-full="${entry.photo}" />`
    : `<div class="file-photo placeholder">${DOC_SVG}</div>`;

  const completed = getCompletedCount(entry);
  const totalSteps = WORKFLOW_STEPS.length;
  const curIdx = getCurrentStepIndex(entry);
  const pct = Math.round((completed / totalSteps) * 100);

  let progressText;
  if (completed === 0) progressText = 'ยังไม่เริ่มดำเนินการ';
  else if (completed === totalSteps) progressText = 'เสร็จสิ้นทุกขั้นตอน';
  else progressText = `ขั้นตอนถัดไป: ${curIdx + 1}. ${escapeHtml(WORKFLOW_STEPS[curIdx].label)}`;

  return `
    <div class="file-card" data-id="${entry.id}">
      <div style="display: flex; gap: 14px;">
        ${photoHtml}
        <div class="file-header" style="margin: 0; gap: 0;">
          <div class="file-title-section">
            <p class="file-title">${escapeHtml(entry.title)}</p>
            ${(entry.receiveNo || entry.receiveDate) ? `<p class="file-meta">เลขรับ ${escapeHtml(entry.receiveNo || '-')}${entry.receiveDate ? ' · ' + isoToThaiDate(entry.receiveDate) : ''}</p>` : ''}
            <p class="file-meta">${formatDateTime(entry.createdAt)}</p>
            ${entry.desc ? `<p class="file-meta">${escapeHtml(entry.desc)}</p>` : ''}
            ${entry.note ? `<p class="file-meta">หมายเหตุ: ${escapeHtml(entry.note)}</p>` : ''}
          </div>
          <div class="file-code">#${docCode(entry)}</div>
        </div>
      </div>

      <div class="file-status">
        <div class="step-progress">
          <div class="step-progress-top">
            <span class="step-progress-text">${progressText}</span>
            <span class="step-progress-count">${completed}/${totalSteps}</span>
          </div>
          <div class="step-progress-track">
            <div class="step-progress-fill" style="width: ${pct}%;"></div>
          </div>
        </div>
      </div>

      <div class="file-footer">
        <div class="file-actions">
          <button class="edit-btn" data-action="edit" data-id="${entry.id}" title="แก้ไข" aria-label="แก้ไข">${EDIT_SVG}</button>
          <button class="delete-btn" data-action="delete" data-id="${entry.id}" title="ลบ" aria-label="ลบ">${TRASH_SVG}</button>
        </div>
      </div>

      ${createStepsListHtml(entry)}
    </div>
  `;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function docCode(entry) {
  const seq = seqMap.get(entry.id) || 0;
  return String(seq).padStart(4, '0');
}

function formatDateTime(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) +
         ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function isoToThaiDate(isoStr) {
  if (!isoStr) return '';
  const [year, month, day] = isoStr.split('-');
  const d = new Date(year, parseInt(month) - 1, day);
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ============ TimeFrame Helper Functions ============
function getDaysDiff(dateStr) {
  if (!dateStr) return null;
  const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
  const today = new Date();
  const diffMs = today - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
}

function formatTimeframe(days) {
  if (days === null || days === undefined) return '-';
  if (days === 0) return 'วันนี้';
  if (days === 1) return 'เมื่อวาน';
  if (days < 7) return `${days} วัน`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} สัปดาห์`;
  const months = Math.floor(days / 30);
  return `${months} เดือน`;
}

// การ์ดสรุประยะเวลาของแต่ละขั้นตอนทั้ง 7 ขั้น (แสดงผลอย่างเดียว — กดที่การ์ดเพื่อจัดการขั้นตอนในหน้าต่างรายละเอียด)
function createStepChipsHtml(entry) {
  const steps = getSteps(entry);
  const curIdx = getCurrentStepIndex(entry);

  const chipsHtml = WORKFLOW_STEPS.map((s, i) => {
    const st = steps[s.key] || { done: false, date: null };
    let cls = '';
    let valueText = '-';

    if (st.done && st.date) {
      cls = 'active';
      valueText = formatTimeframe(getDaysDiff(new Date(st.date + 'T00:00:00')));
    } else if (i === curIdx) {
      cls = 'pending';
      valueText = 'ถัดไป';
    }

    return `
      <div class="timeframe-item ${cls}">
        <div class="timeframe-item-label">${escapeHtml(s.label)}</div>
        <div class="timeframe-item-value">${valueText}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="file-timeframe">
      <div class="timeframe-label">${CLOCK_SVG} ระยะเวลาแต่ละขั้นตอน</div>
      <div class="timeframe-detail">${chipsHtml}</div>
    </div>
  `;
}

// ============ Detail Modal (กดที่แฟ้มเพื่อดู/จัดการขั้นตอน) ============
const STATUS_TEXT = { 'not-started': 'ยังไม่เริ่ม', 'pending': 'กำลังดำเนินการ', 'done': 'เสร็จสิ้น' };

function openDetailModal(id) {
  const entry = state.entries.find(x => x.id === id);
  if (!entry) return;

  openModalEntryId = id;
  renderDetailModalContent(entry);

  detailEditBtn.dataset.id = id;
  detailDeleteBtn.dataset.id = id;

  detailModalBackdrop.classList.add('open');
}

function closeDetailModal() {
  detailModalBackdrop.classList.remove('open');
  openModalEntryId = null;
  editingDateFor = null;
}

// เรียกทุกครั้งที่ render() หลัก เพื่อให้หน้าต่างรายละเอียด (ถ้าเปิดอยู่) แสดงข้อมูลล่าสุดเสมอ
function refreshOpenModal() {
  if (!openModalEntryId) return;
  const entry = state.entries.find(x => x.id === openModalEntryId);
  if (entry) renderDetailModalContent(entry);
  else closeDetailModal();
}

function renderDetailModalContent(entry) {
  const statusClass = getEntryStatus(entry);
  const statusText = STATUS_TEXT[statusClass];

  const photoHtml = entry.photo
    ? `<img class="detail-photo" src="${entry.photo}" alt="รูป: ${escapeHtml(entry.title)}" data-full="${entry.photo}" />`
    : '';

  const infoItems = [
    { label: 'รหัสแฟ้ม', value: `#${docCode(entry)}` },
    { label: 'เลขรับ', value: entry.receiveNo || '-' },
    { label: 'วันที่รับ', value: entry.receiveDate ? isoToThaiDate(entry.receiveDate) : '-' },
    { label: 'วันที่สร้าง', value: formatDateTime(entry.createdAt) }
  ];

  const infoHtml = infoItems.map(item => `
    <div class="detail-info-item">
      <div class="detail-info-label">${item.label}</div>
      <div class="detail-info-value">${escapeHtml(item.value)}</div>
    </div>
  `).join('');

  const descHtml = entry.desc ? `
    <div class="detail-note-block">
      <div class="detail-note-label">รายละเอียดเพิ่มเติม</div>
      <div class="detail-note-text">${escapeHtml(entry.desc)}</div>
    </div>
  ` : '';

  const noteHtml = entry.note ? `
    <div class="detail-note-block">
      <div class="detail-note-label">หมายเหตุ</div>
      <div class="detail-note-text">${escapeHtml(entry.note)}</div>
    </div>
  ` : '';

  detailModalBody.innerHTML = `
    <span class="detail-status-badge ${statusClass}">${statusText}</span>
    <h2 class="detail-modal-title">${escapeHtml(entry.title)}</h2>
    ${photoHtml}
    <div class="detail-info-grid">${infoHtml}</div>
    ${descHtml}
    ${noteHtml}
    ${createStepsListHtml(entry)}
  `;
}

// รายการขั้นตอนทั้ง 7 แบบโต้ตอบได้ (ติ๊ก + เลือกวันที่) เรียงตามลำดับ ห้ามข้ามขั้นตอน
function createStepsListHtml(entry) {
  const steps = getSteps(entry);
  const curIdx = getCurrentStepIndex(entry);
  const todayStr = new Date().toISOString().split('T')[0];

  const itemsHtml = WORKFLOW_STEPS.map((s, i) => {
    const st = steps[s.key] || { done: false, date: null };
    const isEditingThis = editingDateFor && editingDateFor.id === entry.id && editingDateFor.key === s.key;
    const isLocked = !st.done && i > curIdx;
    const isCurrent = !st.done && i === curIdx;

    const checkSvg = (st.done || isEditingThis) ? CHECK_SVG : '';
    const dateValue = st.done && st.date ? st.date : todayStr;
    const dateDisplay = st.done && st.date ? isoToThaiDate(st.date) : '';

    let itemClass = 'detail-step-item';
    if (st.done) itemClass += ' done';
    if (isLocked) itemClass += ' locked';
    if (isCurrent) itemClass += ' current';

    return `
      <div class="${itemClass}">
        <button class="status-item" data-action="toggle-step" data-id="${entry.id}" data-step="${s.key}" ${isLocked ? 'disabled' : ''} style="background: none; border: none; padding: 4px; text-align: left; width: 100%;">
          <div class="status-checkbox ${(st.done || isEditingThis) ? 'checked' : ''}">${checkSvg}</div>
          <div>
            <div class="status-label">ขั้นตอนที่ ${i + 1} : ${escapeHtml(s.label)}</div>
            ${dateDisplay ? `<div class="status-date">${dateDisplay}</div>` : ''}
            ${isEditingThis && !st.done ? `<div class="status-date">เลือกวันที่แล้วกดบันทึก</div>` : ''}
          </div>
        </button>
        ${(st.done || isEditingThis) ? `
          <div class="date-picker-inline ${isEditingThis ? 'show' : ''}" data-entry-id="${entry.id}" data-step-key="${s.key}" style="margin-top: 8px;">
            <input type="date" class="date-input" value="${dateValue}" max="${todayStr}" />
            <button class="date-save-btn" data-action="save-step-date" data-id="${entry.id}" data-step="${s.key}">บันทึก</button>
            <button class="date-cancel-btn" data-action="cancel-step-date" data-id="${entry.id}" data-step="${s.key}">ยกเลิก</button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="detail-steps">
      <div class="detail-steps-label">ขั้นตอนดำเนินการ (${getCompletedCount(entry)}/${WORKFLOW_STEPS.length})</div>
      ${itemsHtml}
    </div>
  `;
}

detailModalClose.addEventListener('click', closeDetailModal);
detailModalBackdrop.addEventListener('click', (e) => {
  if (e.target === detailModalBackdrop) closeDetailModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDetailModal();
});

detailEditBtn.addEventListener('click', () => {
  const id = detailEditBtn.dataset.id;
  closeDetailModal();
  openEditForm(id);
});
detailDeleteBtn.addEventListener('click', () => {
  const id = detailDeleteBtn.dataset.id;
  closeDetailModal();
  deleteEntry(id);
});

// คลิกในหน้าต่างรายละเอียด: ดูรูปขยาย หรือ ติ๊ก/บันทึก/ยกเลิกขั้นตอน
detailModalBody.addEventListener('click', (e) => {
  const img = e.target.closest('.detail-photo[data-full]');
  if (img) {
    lightboxImg.src = img.dataset.full;
    lightbox.classList.add('open');
    return;
  }

  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  const stepKey = btn.dataset.step;

  if (action === 'toggle-step') toggleStep(id, stepKey, btn);
  else if (action === 'save-step-date') saveStepDate(id, stepKey, btn);
  else if (action === 'cancel-step-date') cancelStepDate();
});

// ============ Event Delegation ============
fileList.addEventListener('click', (e) => {
  const img = e.target.closest('.file-photo[data-full]');
  if (img) {
    lightboxImg.src = img.dataset.full;
    lightbox.classList.add('open');
    return;
  }

  // คลิกที่ช่องเลือกวันที่โดยตรง (ไม่ใช่ปุ่ม) -> ปล่อยให้ input ทำงานตามปกติ ไม่ต้องเปิด modal
  if (e.target.closest('.date-picker-inline') && !e.target.closest('[data-action]')) {
    return;
  }

  const btn = e.target.closest('[data-action]');
  if (btn) {
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    const stepKey = btn.dataset.step;

    if (action === 'edit') {
      openEditForm(id);
    } else if (action === 'delete') {
      deleteEntry(id);
    } else if (action === 'toggle-step') {
      toggleStep(id, stepKey, btn);
    } else if (action === 'save-step-date') {
      saveStepDate(id, stepKey, btn);
    } else if (action === 'cancel-step-date') {
      cancelStepDate();
    }
    return;
  }

  // คลิกที่ตัวการ์ดเอง (ไม่ใช่ปุ่ม/รูป/รายการขั้นตอน) -> เปิดหน้าต่างรายละเอียดเพื่อจัดการขั้นตอนของแฟ้มนั้น
  const card = e.target.closest('.file-card');
  if (card && card.dataset.id) {
    openDetailModal(card.dataset.id);
  }
});

lightboxClose.addEventListener('click', () => lightbox.classList.remove('open'));
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) lightbox.classList.remove('open');
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') lightbox.classList.remove('open');
});

// Filter tabs
filterTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    currentFilter = tab.dataset.filter;
    currentPage = 1;
    render();
  });
});

// TimeFrame filter
timeframeChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const tf = chip.dataset.timeframe;
    currentTimeframe = tf;
    currentPage = 1;

    if (tf === 'custom') {
      timeframeCustomRange.classList.add('show');
      setTimeout(() => timeframeDate.focus(), 0);
      // ยังไม่กรองจนกว่าจะเลือกวันที่
      if (!customDate) return;
    } else {
      timeframeCustomRange.classList.remove('show');
    }
    render();
  });
});

timeframeDate.addEventListener('change', () => {
  if (!timeframeDate.value) return;
  customDate = timeframeDate.value;
  currentTimeframe = 'custom';
  currentPage = 1;
  render();
});

// Search bar
searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value.trim().toLowerCase();
  searchClearBtn.classList.toggle('show', searchQuery.length > 0);
  currentPage = 1;
  render();
});

searchClearBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchQuery = '';
  searchClearBtn.classList.remove('show');
  currentPage = 1;
  render();
  searchInput.focus();
});

// Pagination
pagination.addEventListener('click', (e) => {
  const btn = e.target.closest('.page-btn');
  if (!btn || btn.disabled) return;
  const p = btn.dataset.page;
  if (p === 'prev') currentPage -= 1;
  else if (p === 'next') currentPage += 1;
  else currentPage = parseInt(p, 10);
  render();
});

// Initial render (data populates once Firestore's onSnapshot fires)
render();
