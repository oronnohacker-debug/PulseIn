import { auth, db } from './firebase-config.js';
import { 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  onAuthStateChanged, signOut, updateProfile 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const authModal = document.getElementById('authModal');
const appContainer = document.getElementById('appContainer');
const authForm = document.getElementById('authForm');
let isSignUp = false;

// Save Credentials locally
function saveAccountLocally(user) {
  let saved = JSON.parse(localStorage.getItem('echoo_saved_accounts') || '[]');
  if (!saved.some(a => a.uid === user.uid)) {
    saved.push({ uid: user.uid, email: user.email, name: user.displayName });
    localStorage.setItem('echoo_saved_accounts', JSON.stringify(saved));
  }
}

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;
  const name = document.getElementById('authName').value;

  try {
    if (isSignUp) {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(res.user, { displayName: name });
      await setDoc(doc(db, "users", res.user.uid), {
        name, email, isPrivate: false, followers: [], following: [], blocked: []
      });
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  } catch (err) { alert(err.message); }
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    saveAccountLocally(user);
    authModal.classList.add('hidden');
    appContainer.classList.remove('hidden');
    document.getElementById('userName').innerText = user.displayName || user.email.split('@')[0];
  } else {
    authModal.classList.remove('hidden');
    appContainer.classList.add('hidden');
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth));