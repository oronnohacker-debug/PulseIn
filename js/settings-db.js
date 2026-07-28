import { auth, db } from './firebase-config.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Router system to switch view pages smoothly
window.router = (pageName) => {
  const pages = ['feed', 'search', 'reels', 'messages', 'notifications', 'dashboard', 'settings', 'profile'];
  
  pages.forEach(p => {
    document.getElementById(`page-${p}`)?.classList.add('hidden');
    document.getElementById(`nav-${p}`)?.classList.remove('active');
  });

  const activePage = document.getElementById(`page-${pageName}`);
  const activeNav = document.getElementById(`nav-${pageName}`);

  if (activePage) activePage.classList.remove('hidden');
  if (activeNav) activeNav.classList.add('active');
};

// Account Private Lock Switcher
document.getElementById('privateAccountToggle')?.addEventListener('change', async (e) => {
  if (auth.currentUser) {
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      isPrivate: e.target.checked
    });
  }
});
