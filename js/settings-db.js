import { auth, db } from './firebase-config.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Single Page Router
window.router = (pageName) => {
  ['feed', 'reels', 'messages', 'search', 'dashboard', 'settings'].forEach(p => {
    document.getElementById(`page-${p}`)?.classList.add('hidden');
  });
  document.getElementById(`page-${pageName}`)?.classList.remove('hidden');
};

// Toggle Private Account Lock
document.getElementById('privateAccountToggle')?.addEventListener('change', async (e) => {
  if (auth.currentUser) {
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      isPrivate: e.target.checked
    });
    document.getElementById('lockStatus').innerHTML = e.target.checked 
      ? '<i class="fa-solid fa-lock text-yellow-400"></i> Private' 
      : '<i class="fa-solid fa-globe"></i> Public';
  }
});