import { auth, db, storage } from './firebase-config.js';
import { 
  collection, addDoc, query, orderBy, onSnapshot, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

let selectedPostFile = null;

// IMAGE PREVIEW FOR POST
const postImgInput = document.getElementById('postImageInput');
postImgInput?.addEventListener('change', (e) => {
  selectedPostFile = e.target.files[0];
  if (selectedPostFile) {
    document.getElementById('postPreviewImg').src = URL.createObjectURL(selectedPostFile);
    document.getElementById('postPreviewHolder').classList.remove('hidden');
  }
});

document.getElementById('removePostImg')?.addEventListener('click', () => {
  selectedPostFile = null;
  document.getElementById('postPreviewHolder').classList.add('hidden');
});

// CREATE POST
document.getElementById('createPostBtn')?.addEventListener('click', async () => {
  const text = document.getElementById('postText').value.trim();
  if (!text && !selectedPostFile) return alert("Enter text or attach an image.");

  const btn = document.getElementById('createPostBtn');
  btn.innerText = "Posting...";
  btn.disabled = true;

  try {
    let imgUrl = "";
    if (selectedPostFile) {
      const imgRef = ref(storage, `posts/${Date.now()}_${selectedPostFile.name}`);
      await uploadBytes(imgRef, selectedPostFile);
      imgUrl = await getDownloadURL(imgRef);
    }

    await addDoc(collection(db, "posts"), {
      text: text,
      imgUrl: imgUrl,
      author: auth.currentUser ? auth.currentUser.email.split('@')[0] : "Anonymous",
      likes: [],
      createdAt: serverTimestamp()
    });

    document.getElementById('postText').value = "";
    document.getElementById('removePostImg').click();
  } catch (err) {
    alert(err.message);
  } finally {
    btn.innerText = "Post";
    btn.disabled = false;
  }
});

// ADD STORY
document.getElementById('storyInput')?.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const storyRef = ref(storage, `stories/${Date.now()}_${file.name}`);
  await uploadBytes(storyRef, file);
  const storyUrl = await getDownloadURL(storyRef);

  await addDoc(collection(db, "stories"), {
    storyUrl: storyUrl,
    createdAt: serverTimestamp()
  });

  alert("Story added successfully!");
});

// LISTEN TO POSTS & DASHBOARD DATA
const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"));
onSnapshot(postsQuery, (snapshot) => {
  const container = document.getElementById('feedPosts');
  let totalLikes = 0;

  if (container) container.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const post = docSnap.data();
    totalLikes += post.likes?.length || 0;

    if (container) {
      const el = document.createElement('div');
      el.className = "bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-4 space-y-3";
      el.innerHTML = `
        <div class="font-bold text-xs text-cyan-400">${post.author}</div>
        ${post.imgUrl ? `<img src="${post.imgUrl}" class="rounded-xl max-h-80 w-full object-cover">` : ''}
        <p class="text-xs text-slate-200">${post.text}</p>
      `;
      container.appendChild(el);
    }
  });

  // Dynamic Dashboard Updates
  const postsCountEl = document.getElementById('totalPostsCount');
  const likesCountEl = document.getElementById('totalLikesCount');
  if (postsCountEl) postsCountEl.innerText = snapshot.size;
  if (likesCountEl) likesCountEl.innerText = totalLikes;
});

// LISTEN TO STORIES
onSnapshot(collection(db, "stories"), (snapshot) => {
  const container = document.getElementById('storiesContainer');
  if (!container) return;
  container.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const s = docSnap.data();
    const div = document.createElement('div');
    div.className = "flex-shrink-0 cursor-pointer";
    div.innerHTML = `
      <div class="w-16 h-16 rounded-full border-2 border-cyan-500 p-0.5">
        <img src="${s.storyUrl}" class="w-full h-full rounded-full object-cover">
      </div>
    `;
    container.appendChild(div);
  });
});
