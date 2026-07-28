import { auth, db, storage } from './firebase-config.js';
import { 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  onAuthStateChanged, signOut, updateProfile 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  collection, addDoc, query, orderBy, onSnapshot, 
  doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

let currentUser = null;
let isSignUp = false;
let selectedFile = null;

// Auth Elements
const authOverlay = document.getElementById('authOverlay');
const mainApp = document.getElementById('mainApp');
const authForm = document.getElementById('authForm');
const toggleAuthBtn = document.getElementById('toggleAuthBtn');
const nameField = document.getElementById('nameField');
const authBtn = document.getElementById('authBtn');
const toggleText = document.getElementById('toggleText');

toggleAuthBtn.addEventListener('click', () => {
  isSignUp = !isSignUp;
  nameField.classList.toggle('hidden', !isSignUp);
  authBtn.innerText = isSignUp ? "Sign Up" : "Log In";
  toggleText.innerText = isSignUp ? "Already have an account?" : "Don't have an account?";
  toggleAuthBtn.innerText = isSignUp ? "Log In" : "Sign Up";
});

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;
  const name = document.getElementById('authName').value;

  try {
    if (isSignUp) {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(res.user, { displayName: name || email.split('@')[0] });
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
    authForm.reset();
  } catch (err) {
    alert(err.message);
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    authOverlay.classList.add('hidden');
    mainApp.classList.remove('hidden');
    document.getElementById('userNameDisplay').innerText = user.displayName || user.email.split('@')[0];
    document.getElementById('userAvatar').innerText = (user.displayName || user.email)[0].toUpperCase();
    listenToPosts();
    listenToChat();
  } else {
    currentUser = null;
    authOverlay.classList.remove('hidden');
    mainApp.classList.add('hidden');
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth));

// Post Media Handle
const postImage = document.getElementById('postImage');
postImage.addEventListener('change', (e) => {
  selectedFile = e.target.files[0];
  if (selectedFile) {
    document.getElementById('imgPreview').src = URL.createObjectURL(selectedFile);
    document.getElementById('imgPreviewHolder').classList.remove('hidden');
  }
});

document.getElementById('clearImgBtn').addEventListener('click', () => {
  selectedFile = null;
  postImage.value = '';
  document.getElementById('imgPreviewHolder').classList.add('hidden');
});

// Create Post
document.getElementById('submitPostBtn').addEventListener('click', async () => {
  const text = document.getElementById('postText').value.trim();
  if (!text && !selectedFile) return alert("Please enter text or select an image.");

  const btn = document.getElementById('submitPostBtn');
  btn.disabled = true;
  btn.innerText = "Pulsing...";

  try {
    let imgUrl = "";
    if (selectedFile) {
      const storageRef = ref(storage, `posts/${Date.now()}_${selectedFile.name}`);
      await uploadBytes(storageRef, selectedFile);
      imgUrl = await getDownloadURL(storageRef);
    }

    await addDoc(collection(db, "posts"), {
      uid: currentUser.uid,
      author: currentUser.displayName || currentUser.email.split('@')[0],
      text: text,
      imgUrl: imgUrl,
      likes: [],
      createdAt: serverTimestamp()
    });

    document.getElementById('postText').value = "";
    document.getElementById('clearImgBtn').click();
  } catch (err) {
    alert("Post failed: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerText = "Pulse";
  }
});

// Listen to Posts
function listenToPosts() {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    const container = document.getElementById('postsContainer');
    container.innerHTML = "";
    
    snapshot.forEach((docSnap) => {
      const post = docSnap.data();
      const pid = docSnap.id;
      const isLiked = post.likes?.includes(currentUser.uid);

      const el = document.createElement('div');
      el.className = "bg-slate-900/50 border border-slate-800/80 rounded-2xl overflow-hidden";
      el.innerHTML = `
        <div class="p-4 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 font-bold text-black flex items-center justify-center text-xs">
              ${post.author ? post.author[0].toUpperCase() : 'U'}
            </div>
            <span class="text-xs font-bold">${post.author}</span>
          </div>
        </div>
        ${post.imgUrl ? `<img src="${post.imgUrl}" class="w-full max-h-[450px] object-cover">` : ''}
        <div class="p-4 space-y-2">
          <p class="text-sm text-slate-200">${post.text}</p>
          <div class="flex items-center space-x-4 pt-2 text-xs">
            <button onclick="toggleLike('${pid}', ${isLiked})" class="${isLiked ? 'text-red-500' : 'text-slate-400'} font-bold flex items-center space-x-1">
              <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart text-sm"></i>
              <span>${post.likes?.length || 0}</span>
            </button>
          </div>
        </div>
      `;
      container.appendChild(el);
    });
  });
}

window.toggleLike = async (pid, isLiked) => {
  const refDoc = doc(db, "posts", pid);
  await updateDoc(refDoc, {
    likes: isLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
  });
};

// Global Chat
document.getElementById('sendMsgBtn').addEventListener('click', async () => {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;

  await addDoc(collection(db, "messages"), {
    sender: currentUser.displayName || currentUser.email.split('@')[0],
    text: msg,
    createdAt: serverTimestamp()
  });
  input.value = "";
});

function listenToChat() {
  const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
  onSnapshot(q, (snapshot) => {
    const box = document.getElementById('chatMessages');
    box.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const m = docSnap.data();
      const div = document.createElement('div');
      div.className = "bg-slate-800/60 p-2.5 rounded-xl text-xs max-w-[80%]";
      div.innerHTML = `<span class="font-bold text-cyan-400">${m.sender}: </span>${m.text}`;
      box.appendChild(div);
    });
    box.scrollTop = box.scrollHeight;
  });
}

// Tab Switching Navigation
window.switchTab = (tabName) => {
  ['feed', 'messages', 'notifications'].forEach(t => {
    document.getElementById(`tab-${t}`).classList.add('hidden');
  });
  document.getElementById(`tab-${tabName}`).classList.remove('hidden');
};s