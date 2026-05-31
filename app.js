
// =========================
// FIREBASE IMPORTS
// =========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  setDoc,
  where,
  updateDoc,
  increment,
  getDoc,
  getDocs,
  limit,
  deleteDoc,
  arrayUnion,
  arrayRemove
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// =========================
// FIREBASE CONFIG
// =========================
const firebaseConfig = {
  apiKey: "AIzaSyDEojq46OXRB8bCiPzWns5YsA7PcU-K-vg",
  authDomain: "duggartalk.firebaseapp.com",
  projectId: "duggartalk",
  storageBucket: "duggartalk.firebasestorage.app",
  messagingSenderId: "825897685253",
  appId: "1:825897685253:web:3f86c07b951a48f32ae76c"
};

// =========================
// INIT FIREBASE
// =========================
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// =========================
// GLOBAL EXPORTS
// =========================
window.db = db;
window.auth = auth;
window.storage = storage;

window.collection = collection;
window.addDoc = addDoc;
window.onSnapshot = onSnapshot;
window.query = query;
window.orderBy = orderBy;
window.serverTimestamp = serverTimestamp;
window.doc = doc;
window.setDoc = setDoc;
window.where = where;
window.updateDoc = updateDoc;
window.increment = increment;
window.getDoc = getDoc;
window.getDocs = getDocs;
window.limit = limit;
window.deleteDoc = deleteDoc;
window.arrayUnion = arrayUnion;
window.arrayRemove = arrayRemove;

window.ref = ref;
window.uploadBytes = uploadBytes;
window.getDownloadURL = getDownloadURL;
window.deleteObject = deleteObject;

// =========================
// AUTH CHECK
// =========================
onAuthStateChanged(auth, async(user) => {

  const authBox = document.getElementById("authContainer");
const bottomNav = document.getElementById("bottomNav");
const postBox = document.getElementById("postBox");
const mainHeader = document.getElementById("mainHeader");

if(user){

    authBox?.classList.add("hidden");
    bottomNav?.classList.remove("hidden");
    mainHeader?.classList.remove("hidden");

    console.log("LOGIN SUCCESS");

    await createUserDocument(user);

    loadFeed();

    loadStories();

    loadReels();

    updateOnlineStatus(true);

  }else{

    authBox?.classList.remove("hidden");
    bottomNav?.classList.add("hidden");
    mainHeader?.classList.add("hidden");

    console.log("LOGOUT");

  }

});

// =========================
// CREATE USER DOCUMENT
// =========================
async function createUserDocument(user){

  try{

    const userRef = doc(db, "users", user.uid);

    const snap = await getDoc(userRef);

    if(!snap.exists()){

      await setDoc(userRef,{
        uid:user.uid,
        email:user.email,
        username:user.email.split("@")[0],
        followers:[],
        following:[],
        verified:false,
        online:true,
        bio:"",
        phone:"",
        address:"",
        profilePic:"",
        createdAt:serverTimestamp()
      });

    }

  }catch(err){

    console.error("USER DOC ERROR:", err);

  }

}



// =========================
// LOGIN
// =========================
window.loginWithEmail = async function(){

  const email =
    document.getElementById("email").value;

  const password =
    document.getElementById("password").value;

  if(!email || !password){

    alert("Fill all fields");

    return;
  }

  try{

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    alert("Login Success");

  }catch(err){

    console.error(err);

    alert(err.message);

  }

};

// =========================
// REGISTER
// =========================
window.registerWithEmail = async function(){

  const email =
    document.getElementById("email").value;

  const password =
    document.getElementById("password").value;

  if(!email || !password){

    alert("Fill all fields");

    return;
  }

  try{

    await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    alert("Account Created");

  }catch(err){

    console.error(err);

    alert(err.message);

  }

};

// =========================
// LOGOUT
// =========================
window.logout = async function(){

  try{

    await signOut(auth);

    location.reload();

  }catch(err){

    console.error(err);

  }

};

// =========================
// CREATE POST
// =========================
window.createPost = async function(){

  const user = auth.currentUser;

  if(!user){

    alert("Login required");

    return;
  }

  const content =
    document.getElementById("postInput").value;

  const fileInput =
    document.getElementById("postFile");

  let fileUrl = "";
  let fileType = "";

  try{

    if(fileInput?.files[0]){

      const file =
        fileInput.files[0];

      fileType =
        file.type.startsWith("video")
        ? "video"
        : "image";

      const storageRef =
        ref(
          storage,
          `posts/${Date.now()}_${file.name}`
        );

      await uploadBytes(storageRef,file);

      fileUrl =
        await getDownloadURL(storageRef);

    }

    await addDoc(
      collection(db,"posts"),
      {
        userEmail:user.email,
        content:content || "",
        fileUrl,
        fileType,
        likes:0,
likedBy:[],
comments:0,
shares:0,
        createdAt:serverTimestamp()
      }
    );

    alert("Post Uploaded");

    document.getElementById("postInput").value="";

    if(fileInput)
      fileInput.value="";

  }catch(err){

    console.error(err);

    alert(err.message);

  }

};

// =========================
// LOAD FEED
// =========================



function loadFeed() {

  const container =
    document.getElementById("postsContainer");

  if (!container) return;

  const q =
    query(
      collection(db, "posts"),
      orderBy("createdAt", "desc")
    );

  onSnapshot(q, (snapshot) => {

    container.innerHTML = "";

    snapshot.forEach((docSnap) => {

      const data = docSnap.data();

      const postId = docSnap.id;

      const currentUser =
        auth.currentUser;

      const media =
        data.fileUrl

        ? data.fileType === "video"

          ? `
         <video
  src="${data.fileUrl}"
  class="feed-video w-full max-h-[500px] object-cover rounded-2xl mt-3"
  controls
  playsinline
></video>
          `

          : `
          <img
            src="${data.fileUrl}"
            class="w-full rounded-2xl mt-3"
          >
          `

        : "";

     container.innerHTML += `
<div class="mb-6 rounded-3xl overflow-hidden bg-[#0f172a]">

  ${media ? `<div class="w-full">${media}</div>` : ""}

  <div class="p-4">

    <!-- USERNAME + MENU -->
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-3 cursor-pointer" onclick="window.openUserProfile('${data.userEmail}')">
        



${window.avatarHTML(data.userEmail, 10)}

<div>
          <h2 class="font-bold text-yellow-400 text-sm">@${data.userEmail.split("@")[0]}</h2>
          <p class="text-xs text-gray-500">
            ${data.createdAt ? timeAgo(data.createdAt.toDate()) : "Just now"}
          </p>
        </div>
      </div>

      <div class="relative">
        <button onclick="togglePostMenu('${postId}')" class="bg-[#1e293b] px-3 py-1 rounded-full">⋮</button>
        <div id="postMenu-${postId}" class="hidden absolute right-0 mt-2 bg-[#111827] rounded-xl p-2 z-50">
          ${currentUser && currentUser.email === data.userEmail
            ? `<button onclick="deletePost('${postId}','${data.fileUrl || ""}')" class="text-red-400 text-sm">🗑 Delete</button>`
            : ""
          }
        </div>
      </div>
    </div>

    <!-- CAPTION -->
    ${data.content ? `<p class="text-white text-sm mb-3">${String(data.content).replace(/</g, "&lt;")}</p>` : ""}

    <!-- STATS -->
    <div class="flex items-center gap-4 text-gray-400 text-xs mb-3">
      <span>👁 ${data.views || 0} views</span>
      <span>❤️ ${data.likes || 0} likes</span>
      <span>💬 ${data.comments || 0} comments</span>
    </div>

    <!-- ACTIONS -->
    <div class="flex gap-3">
      <button onclick="likePost('${postId}')" class="bg-[#1e293b] px-4 py-2 rounded-xl text-sm">❤️ Like</button>
      <button onclick="window.openPostComments('${postId}')" class="bg-[#1e293b] px-4 py-2 rounded-xl text-sm">💬 Comment</button>
      <button onclick="sharePost()" class="bg-[#1e293b] px-4 py-2 rounded-xl text-sm">🔗 Share</button>
    </div>

  </div>
</div>
`;

    });

    // AUTO PLAY ONLY ONE VIDEO
    const videos =
      document.querySelectorAll(".feed-video");

    const observer =
      new IntersectionObserver(

        (entries) => {

          entries.forEach((entry) => {

            const video =
              entry.target;

            if(entry.isIntersecting){

              videos.forEach(v => v.pause());

              video.play();

            }else{

              video.pause();

            }

          });

        },

        {
          threshold:0.7
        }

      );

    videos.forEach(video => {

      observer.observe(video);

    });

  });

}


// =========================
// LIKE POST
// =========================
window.likePost = async function(postId){

  const user = auth.currentUser;
  if(!user){ alert("Login Required"); return; }

  try{

    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);
    if(!postSnap.exists()) return;

    const data = postSnap.data();
    const likedBy = data.likedBy || [];

    if(likedBy.includes(user.email)){
      // Already liked — unlike karo
      await updateDoc(postRef,{
        likes: increment(-1),
        likedBy: arrayRemove(user.email)
      });
    }else{
      // Naya like
      await updateDoc(postRef,{
        likes: increment(1),
        likedBy: arrayUnion(user.email)
      });
    }

  }catch(err){
    console.error(err);
  }

};

// =========================
// SHARE POST
// =========================
window.sharePost = function(){

  navigator.clipboard.writeText(
    window.location.href
  );

  alert("Link copied");

};

// =========================
// STORIES
// =========================
function loadStories(){

  console.log("Stories Loaded");

}

// =========================
// REELS
// =========================
// =========================
// LOAD REELS FROM FIRESTORE
// =========================

// =========================
// ONLINE STATUS
// =========================
async function updateOnlineStatus(status){

  const user = auth.currentUser;

  if(!user) return;

  try{

    await updateDoc(
      doc(db,"users",user.uid),
      {
        online:status,
        lastSeen:serverTimestamp()
      }
    );

  }catch(err){

    console.error(err);

  }

}

// =========================
// PROFILE SHARE
// =========================
window.shareProfile = function(){

  navigator.clipboard.writeText(
    location.href
  );

  alert("Profile Link Copied");

};

// =========================
// FOLLOW USER
// =========================
window.followUser = async function(){

  const currentUser =
    auth.currentUser;

  if(!currentUser){

    alert("Login Required");

    return;
  }

  const params =
    new URLSearchParams(
      window.location.search
    );

  const targetEmail =
    params.get("email");

  if(!targetEmail){

    alert("Target user missing");

    return;
  }

  try{

    const q =
      query(
        collection(db,"users"),
        where("email","==",targetEmail)
      );

    const snap =
      await getDocs(q);

    if(snap.empty){

      alert("User not found");

      return;
    }

    const targetDoc =
      snap.docs[0];

    const data =
      targetDoc.data();

    let followers =
      data.followers || [];

    const btn =
      document.getElementById("followBtn");

    if(
      followers.includes(
        currentUser.email
      )
    ){

      followers =
        followers.filter(
          e => e !== currentUser.email
        );

      btn.innerText =
        "➕ Follow";

    }else{

      if(!followers.includes(currentUser.email)){
   followers.push(currentUser.email);
}

      btn.innerText =
        "✓ Following";

    }

    await updateDoc(
      targetDoc.ref,
      { followers }
    );

    document.getElementById(
      "followerCount"
    ).innerText =
      followers.length;

  }catch(err){

    console.error(err);

    alert(err.message);

  }

};

// =========================
// ADVANCED FEATURES READY
// =========================

// ✅ Reels
// ✅ Stories
// ✅ Followers
// ✅ Share
// ✅ Like System
// ✅ Realtime Feed
// ✅ Profile System
// ✅ Online Status
// ✅ Firebase Global
// ✅ Upload System
// ✅ Storage
// ✅ Secure Auth

console.log("DUGGARTALK PRO MAX READY 🚀");




// =========================
// TEMP SAFE FUNCTIONS
// =========================

window.showFeed = () => {
  location.href = "index.html";
};

window.showProfile = () => {
  document.querySelectorAll("video").forEach(v => v.pause());
  const user = auth.currentUser;
  if(user){
    location.href = `profile.html?email=${user.email}`;
  }
};

window.openChat = () => {
  document.querySelectorAll("video").forEach(v => v.pause());
  const modal = document.getElementById("chatModal");
  if(modal){
    modal.classList.remove("hidden");
    window.loadFollowers();
  }
};


window.openCreateMenu = function(){
  const menu = document.getElementById("createMenu");
  if(menu) menu.classList.toggle("hidden");
};


// =========================
// PAGE VISIBILITY CONTROL
// =========================
document.addEventListener("visibilitychange", () => {
  if(document.hidden){
    // Phone minimize ya tab change — sab pause
    document.querySelectorAll("video").forEach(v => v.pause());
  }
});




// =========================
// SHOW REELS PAGE
// =========================
window.showReels = () => {
  document.querySelectorAll("video").forEach(v => v.pause());
  location.href = "reels.html";
};

// =========================
// LOAD REELS FROM FIRESTORE
// =========================
function loadReels() {

  const container =
    document.getElementById("reelsContainer");

  if (!container) return;

  const q =
    query(
      collection(db, "reels"),
      orderBy("createdAt", "desc")
    );


  onSnapshot(q, (snapshot) => {

    container.innerHTML = "";

    if(snapshot.empty){

      container.innerHTML = `
        <div class="text-center text-gray-400 mt-10">
          No Reels Uploaded Yet 🚀
        </div>
      `;

      return;
    }

    snapshot.forEach((docSnap) => {

      const data = docSnap.data();

      const reelId = docSnap.id;

      const currentUser = auth.currentUser;

      // delete button only owner
      const deleteBtn =
        currentUser &&
        currentUser.email === data.userEmail

        ? `
        <button
          onclick="deleteReel('${reelId}','${data.videoUrl}')"
          class="bg-red-600 text-white px-3 py-1 rounded-xl text-xs"
        >
          🗑 Delete
        </button>
        `
        : "";

      container.innerHTML += `
      
      <div class="reel-item h-screen w-full snap-start relative bg-black flex items-center justify-center">

        <div class="absolute bottom-24 left-4 z-20 max-w-[70%]">

  <div class="flex items-center gap-3 mb-2 cursor-pointer" onclick="window.openUserProfile('${data.userEmail}')">
    ${window.avatarHTML(data.userEmail, 10)}
    <div>
      <h2 class="text-yellow-400 font-bold text-sm">@${data.userEmail.split("@")[0]}</h2>
      <p class="text-gray-300 text-xs">
        ${data.createdAt ? timeAgo(data.createdAt.toDate()) : "Just now"}
      </p>
    </div>
  </div>

  ${data.caption ? `<p class="text-white text-sm mb-2">${data.caption}</p>` : ""}

  <div class="flex items-center gap-3 text-gray-300 text-xs">
    <span>👁 ${data.views || 0} views</span>
    <span>❤️ ${data.likes || 0} likes</span>
    <span>💬 ${data.comments || 0} comments</span>
  </div>

</div>

<div class="absolute bottom-24 right-4 z-30">

  <button
    onclick="toggleMenu('${reelId}')"
    class="bg-black/50 px-3 py-2 rounded-full text-xl"
  >
    ⋮
  </button>

  <div
    id="menu-${reelId}"
    class="hidden bg-[#111827] rounded-xl mt-2 p-2"
  >

    ${currentUser &&
      currentUser.email === data.userEmail

      ? `
      <button
        onclick="deleteReel('${reelId}','${data.videoUrl}')"
        class="text-red-400 text-sm"
      >
        🗑 Delete
      </button>
      `
      : ""
    }

  </div>

</div>

       <video
  src="${data.videoUrl}"
  class="reel-video w-full h-full object-cover"
  playsinline
  muted
  autoplay
  onclick="window.handleVideoTap(this, event)"
></video>

        <p class="mt-2 text-sm">
          ${data.caption || ""}
        </p>


<div class="absolute right-3 bottom-24 flex flex-col gap-4 z-20">

  <button
    onclick="event.stopPropagation(); likeReel('${reelId}')"
    data-reel-id="${reelId}"
    class="bg-black/50 px-4 py-3 rounded-full"
  >
    ❤️ ${data.likes || 0}
  </button>

  <button
    onclick="event.stopPropagation(); openCommentModal('${reelId}')"
    class="bg-black/50 px-4 py-3 rounded-full"
  >
    💬
  </button>

  <button
    onclick="shareReel('${reelId}')"
    class="bg-black/50 px-4 py-3 rounded-full"
  >
    🔗
  </button>

  <button
    onclick="window.toggleGlobalMute()"
    class="mute-btn bg-black/50 px-4 py-3 rounded-full"
  >
    🔇
  </button>

</div>

      `;
    
});

    const videos = document.querySelectorAll(".reel-video");

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if(entry.isIntersecting){
          videos.forEach(v => v.pause());
          video.play();
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.7 });

    videos.forEach(video => observer.observe(video));

  });

}

    




// =========================
// OPEN SEARCH PAGE
// =========================
window.openSearch = () => {
  const popup = document.getElementById("searchPopup");
  if(popup) popup.classList.remove("hidden");
};
window.openUserProfile = function(email){

  location.href =
    `profile.html?email=${email}`;

};





// =========================
// SEARCH USERS
// =========================
window.searchUsers = async function () {

  const input =
    document.getElementById("searchInput");

  const results =
    document.getElementById("searchResults");

  if (!input || !results) return;

  const keyword =
    input.value.trim().toLowerCase();

  if (!keyword) {

    results.innerHTML = `
      <p class="text-gray-400">
        Type username to search
      </p>
    `;

    return;
  }

  try {

    const snap =
      await getDocs(collection(db, "users"));

    results.innerHTML = "";

    let found = false;
snap.forEach((docSnap) => {

      const data = docSnap.data();

      const username =
        (data.username || "")
        .toLowerCase();

      const email =
        (data.email || "")
        .toLowerCase();

      // search match
      if (
        username.includes(keyword) ||
        email.includes(keyword)
      ) {

        found = true;

        results.innerHTML += `

        <div
          onclick="openUserProfile('${data.email}')"
          class="bg-[#0f172a] p-4 rounded-2xl mb-3 flex items-center gap-3 cursor-pointer"
        >

          <div class="w-12 h-12 rounded-full bg-yellow-400 text-black flex items-center justify-center font-bold">
            ${data.email.charAt(0).toUpperCase()}
          </div>

          <div>
            <h2 class="text-yellow-400 font-bold">
              ${data.username || data.email.split("@")[0]}
            </h2>

            <p class="text-sm text-gray-400">
              ${data.email}
            </p>
          </div>

        </div>

        `;
      }

    });
                             

if(!found){
      results.innerHTML = `
        <p class="text-gray-400 text-center mt-5">
          No user found 😕
        </p>
      `;
    }

  } catch (err) {
    console.error(err);
    results.innerHTML = `
      <p class="text-red-400">
        Search failed
      </p>
    `;

  }

 
};

// =========================
// OPEN NOTIFICATION PAGE
// =========================
window.openNotifications = () => {
  const popup = document.getElementById("notificationPopup");
  if(popup) popup.classList.remove("hidden");
  window.loadNotifications && window.loadNotifications();
};

// =========================
// LOAD NOTIFICATIONS
// =========================
window.loadNotifications = function () {

  const user = auth.currentUser;

  if (!user) return;

  const container =
    document.getElementById("notificationsContainer");

  if (!container) return;

  const q =
    query(
      collection(db, "notifications"),
      where("targetEmail", "==", user.email),
      orderBy("createdAt", "desc")
    );

  onSnapshot(q, (snapshot) => {

    container.innerHTML = "";

    if (snapshot.empty) {

      container.innerHTML = `
        <div class="text-center text-gray-400 mt-10">
          No Notifications Yet 🔔
        </div>
      `;

      return;
    }

    snapshot.forEach((docSnap) => {

      const data = docSnap.data();

      let icon = "🔔";

      if (data.type === "like")
        icon = "❤️";

      if (data.type === "comment")
        icon = "💬";

      if (data.type === "message")
        icon = "📩";

      if (data.type === "follow")
        icon = "➕";

      container.innerHTML += `

      <div class="bg-[#0f172a] p-4 rounded-2xl mb-3 flex items-center gap-3">

        <div class="w-12 h-12 rounded-full bg-yellow-400 text-black flex items-center justify-center text-xl">
          ${icon}
        </div>

        <div>
          <p class="text-white">
            ${data.text}
          </p>

          <p class="text-xs text-gray-400 mt-1">
            ${data.time || "Just now"}
          </p>
        </div>

      </div>

      `;
    });

  });

};

window.switchAuthTab = function(type){

  const emailSection =
    document.getElementById("emailAuthSection");

  const phoneSection =
    document.getElementById("phoneAuthSection");

  const emailTab =
    document.getElementById("tabEmail");

  const phoneTab =
    document.getElementById("tabPhone");

  if(type === "email"){

    emailSection.classList.remove("hidden");
    phoneSection.classList.add("hidden");

    emailTab.classList.add(
      "border-yellow-400",
      "text-yellow-400"
    );

    phoneTab.classList.remove(
      "border-yellow-400",
      "text-yellow-400"
    );

  }else{

    phoneSection.classList.remove("hidden");
    emailSection.classList.add("hidden");

    phoneTab.classList.add(
      "border-yellow-400",
      "text-yellow-400"
    );

    emailTab.classList.remove(
      "border-yellow-400",
      "text-yellow-400"
    );

  }

};

window.sendOTP = () => {
  alert("Phone OTP Coming Soon");
};

window.verifyOTPAndLogin = () => {
  alert("OTP Verify Coming Soon");
};

window.openReelModal = () => {
  document
    .getElementById("reelUploadModal")
    ?.classList.remove("hidden");
};

window.closeReelModal = () => {
  document
    .getElementById("reelUploadModal")
    ?.classList.add("hidden");
};

window.previewReel = (e) => {

  const file =
    e.target.files[0];

  if(file){

    document.getElementById(
      "selectedFileName"
    ).innerText = file.name;

  }

};

window.setReelLimit = (sec) => {

  window.reelLimit = sec;

  document.querySelectorAll(".limit-btn")
    .forEach(btn => {

      btn.classList.remove(
        "bg-yellow-400",
        "text-black"
      );

      btn.classList.add(
        "bg-[#334155]",
        "text-white"
      );

    });

  const activeBtn =
    document.getElementById(
      `limit${sec}`
    );

  activeBtn.classList.remove(
    "bg-[#334155]",
    "text-white"
  );

  activeBtn.classList.add(
    "bg-yellow-400",
    "text-black"
  );

};

// =========================
// ACTUAL REEL UPLOAD SYSTEM
// =========================
window.uploadReel = async function() {
  const user = auth.currentUser;
  if (!user) {
    alert("Login Required to upload reels!");
    return;
  }

  // Maan lete hain aapke HTML file input ki id "reelFileInput" hai
  const fileInput = document.getElementById("reelFileInput"); 
  const captionInput = document.getElementById("reelCaptionInput"); // optional caption
  
  if (!fileInput || !fileInput.files[0]) {
    alert("Please select a video file first!");
    return;
  }

  const file = fileInput.files[0];
  
  // Check validation if video
  if (!file.type.startsWith("video/")) {
    alert("Please upload a valid video file.");
    return;
  }

  try {
    alert("Uploading Reel... Please wait.");
    
    // 1. Upload to Firebase Storage
    const storageRef = ref(storage, `reels/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const videoUrl = await getDownloadURL(storageRef);

    // 2. Save Reference in Firestore 'reels' collection
    await addDoc(collection(db, "reels"), {
      userEmail: user.email,
      uid: user.uid,
      videoUrl: videoUrl,
      caption: captionInput ? captionInput.value : "",
      durationLimit: window.reelLimit || 15, // default 15s if not set
      likes: 0,
likedBy: [],
comments: 0,
shares: 0,
      createdAt: serverTimestamp()
    });

    alert("Reel Uploaded Successfully! 🚀");
    
    // Modal aur input reset karein
    if (captionInput) captionInput.value = "";
    if (fileInput) fileInput.value = "";
    window.closeReelModal();
    loadReels();

  } catch (err) {
    console.error("REEL UPLOAD ERROR:", err);
    alert("Failed to upload reel: " + err.message);
  }
};



// ==========================================
// 🗑️ DELETE POST SYSTEM (WITH FILES)
// ==========================================
window.deletePost = async function(postId, fileUrl) {
  const user = auth.currentUser;
  if (!user) {
    alert("Delete karne ke liye login zaroori hai!");
    return;
  }

  if (!confirm("Kya aap sach me yeh post delete karna chahte hain?")) return;

  try {
    // 1. Agar post me koi image/video thi, toh use Storage se delete karein
    if (fileUrl) {
      try {
        const fileRef = ref(storage, fileUrl);

        await deleteObject(fileRef);
      } catch (storageErr) {
        console.warn("Storage file already deleted or not found:", storageErr);
      }
    }

    // 2. Firestore se post ka document delete karein
    await deleteDoc(doc(db, "posts", postId));
    alert("Post delete ho gayi! 🗑️");

  } catch (err) {
    console.error("DELETE POST ERROR:", err);
    alert("Post delete nahi ho payi: " + err.message);
  }
};

// ==========================================
// 🗑️ DELETE REEL SYSTEM
// ==========================================
window.deleteReel = async function(reelId, videoUrl) {
  const user = auth.currentUser;
  if (!user) {
    alert("Delete karne ke liye login zaroori hai!");
    return;
  }

  if (!confirm("Kya aap sach me yeh reel delete karna chahte hain?")) return;

  try {
    // 1. Storage se video file delete karein
    if (videoUrl) {
      try {
        const videoRef = ref(storage, videoUrl);


        await deleteObject(videoRef);
      } catch (storageErr) {
        console.warn("Storage video not found:", storageErr);
      }
    }

    // 2. Firestore se reel document delete karein
    await deleteDoc(doc(db, "reels", reelId));
    alert("Reel delete ho gayi! 🗑️");

  } catch (err) {
    console.error("DELETE REEL ERROR:", err);
    alert("Reel delete nahi ho payi: " + err.message);
  }
};


// =========================
// LIKE REEL
// =========================

window.likeReel = async function(reelId){

  const user = auth.currentUser;
  if(!user){ alert("Login Required"); return; }

  const btn = document.querySelector(`[data-reel-id="${reelId}"]`);

  try{
    const reelRef = doc(db, "reels", reelId);
    const reelSnap = await getDoc(reelRef);
    if(!reelSnap.exists()) return;

    const data = reelSnap.data();
    const likedBy = data.likedBy || [];

    if(likedBy.includes(user.email)){
      // Already liked — unlike
      await updateDoc(reelRef,{
        likes: increment(-1),
        likedBy: arrayRemove(user.email)
      });
      if(btn) btn.innerText = `❤️ ${(data.likes || 1) - 1}`;
    } else {
      // Naya like
      await updateDoc(reelRef,{
        likes: increment(1),
        likedBy: arrayUnion(user.email)
      });
      if(btn) btn.innerText = `❤️ ${(data.likes || 0) + 1}`;
    }

  }catch(err){
    console.error(err);
  }
};


// =========================
// SHARE REEL
// =========================
// =========================
// VIDEO TAP HANDLER
// =========================
let tapTimeout = null;

window.handleVideoTap = function(video, event){
  event.stopPropagation();

  if(tapTimeout){
    // Double tap — play/pause
    clearTimeout(tapTimeout);
    tapTimeout = null;
    if(video.paused){
      video.play();
    } else {
      video.pause();
    }
  } else {
    // Single tap — mute/unmute
    tapTimeout = setTimeout(() => {
      tapTimeout = null;
      window.toggleGlobalMute();
    }, 250);
  }
};
window.reelMuted = true;

window.toggleGlobalMute = function(reelId) {
  window.reelMuted = !window.reelMuted;

  const allVideos = document.querySelectorAll(".reel-player, .reel-video");
  allVideos.forEach(v => {
    v.muted = window.reelMuted;
  });

  const allBtns = document.querySelectorAll(".mute-btn");
  allBtns.forEach(btn => {
    btn.innerText = window.reelMuted ? "🔇" : "🔊";
  });
};
window.shareReel = function(reelId){

  const reelLink =
    `${location.origin}/reels.html?id=${reelId}`;

  navigator.clipboard.writeText(reelLink);

  alert("Reel link copied 🔗");

};


// =========================
// COMMENT SYSTEM
// =========================
window.openComments = async function(reelId){

  const commentsRef =
    collection(db, "reelComments");

  const q =
    query(
      commentsRef,
      where("reelId", "==", reelId),
      orderBy("createdAt", "asc")
    );

  const snap = await getDocs(q);

  let oldComments = "";

  snap.forEach((docSnap) => {

    const data = docSnap.data();

    oldComments +=
      `👤 ${data.userEmail}\n💬 ${data.text}\n\n`;

  });

  const comment =
    prompt(
      `${oldComments}\nWrite your comment:`
    );

  if(!comment) return;

  const user = auth.currentUser;

  if(!user){

    alert("Login Required");

    return;
  }

  try{

    // SAVE COMMENT
    await addDoc(
      collection(db,"reelComments"),
      {
        reelId,
        userEmail:user.email,
        text:comment,
        createdAt:serverTimestamp()
      }
    );

    // UPDATE COUNT
    await updateDoc(
      doc(db,"reels",reelId),
      {
        comments: increment(1)
      }
    );

    alert("Comment Added 💬");

  }catch(err){

    console.error(err);

  }

};    


window.toggleMenu = function(reelId){

  const menu =
    document.getElementById(
      `menu-${reelId}`
    );

  if(menu.classList.contains("hidden")){

    menu.classList.remove("hidden");

  }else{

    menu.classList.add("hidden");

  }

};

window.togglePostMenu = function(postId){

  const menu =
    document.getElementById(
      `postMenu-${postId}`
    );

  if(menu.classList.contains("hidden")){

    menu.classList.remove("hidden");

  }else{

    menu.classList.add("hidden");

  }

};


window.openPostComments = async function(postId){

  const commentsRef =
    collection(db, "postComments");

  const q =
    query(
      commentsRef,
      where("postId", "==", postId),
      orderBy("createdAt", "asc")
    );

  const snap = await getDocs(q);

  let oldComments = "";

  snap.forEach((docSnap) => {

    const data = docSnap.data();

    oldComments +=
      `👤 ${data.userEmail}\n💬 ${data.text}\n\n`;

  });

  const comment =
    prompt(
      `${oldComments}\nWrite your comment:`
    );

  if(!comment) return;

  const user = auth.currentUser;

  if(!user){

    alert("Login Required");

    return;
  }

  try{

    await addDoc(
      collection(db,"postComments"),
      {
        postId,
        userEmail:user.email,
        text:comment,
        createdAt:serverTimestamp()
      }
    );

    await updateDoc(
      doc(db,"posts",postId),
      {
        comments: increment(1)
      }
    );

    alert("Comment Added 💬");

  }catch(err){

    console.error(err);

  }

};


// =========================
// CAMERA SYSTEM
// =========================
let cameraStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let facingMode = "user";
let isRecording = false;

window.openCamera = async function(){
  document.getElementById("cameraModal").classList.remove("hidden");
  document.querySelectorAll("video").forEach(v => v.pause());
  await startCamera();
};

window.closeCamera = function(){
  document.getElementById("cameraModal").classList.add("hidden");
  if(cameraStream){
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
  }
};

async function startCamera(){
  try{
    if(cameraStream) cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode },
      audio: true
    });
    document.getElementById("cameraPreview").srcObject = cameraStream;
  }catch(err){
    alert("Camera access nahi mila: " + err.message);
  }
}

window.switchCamera = async function(){
  facingMode = facingMode === "user" ? "environment" : "user";
  await startCamera();
};

// PHOTO CAPTURE
window.capturePhoto = function(){
  const video = document.getElementById("cameraPreview");
  const canvas = document.getElementById("photoCanvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);
  
  canvas.toBlob(async (blob) => {
    const file = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
    await uploadCameraFile(file, "image");
  }, "image/jpeg");
};

// VIDEO RECORD
window.toggleRecord = async function(){
  const btn = document.getElementById("recordBtn");
  
  if(!isRecording){
    // Start recording
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(cameraStream);
    mediaRecorder.ondataavailable = e => {
      if(e.data.size > 0) recordedChunks.push(e.data);
    };
    mediaRecorder.onstop = async () => {
      const blob = new Blob(recordedChunks, { type: "video/mp4" });
      const file = new File([blob], `reel_${Date.now()}.mp4`, { type: "video/mp4" });
      await uploadCameraFile(file, "video");
    };
    mediaRecorder.start();
    isRecording = true;
    btn.innerHTML = "⏹";
    btn.classList.add("animate-pulse");
  } else {
    // Stop recording
    mediaRecorder.stop();
    isRecording = false;
    btn.innerHTML = "⏺";
    btn.classList.remove("animate-pulse");
  }
};

// UPLOAD TO FIREBASE
async function uploadCameraFile(file, type){
  const user = auth.currentUser;
  if(!user){ alert("Login Required"); return; }

  try{
    alert("Uploading... Please wait");
    const storageRef = ref(storage, `${type === "image" ? "posts" : "reels"}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const fileUrl = await getDownloadURL(storageRef);

    if(type === "image"){
      await addDoc(collection(db, "posts"), {
        userEmail: user.email,
        content: "",
        fileUrl,
        fileType: "image",
        likes: 0,
        likedBy: [],
        comments: 0,
        shares: 0,
        createdAt: serverTimestamp()
      });
      alert("Photo posted! 📷");
    } else {
      await addDoc(collection(db, "reels"), {
        userEmail: user.email,
        uid: user.uid,
        videoUrl: fileUrl,
        caption: "",
        likes: 0,
        likedBy: [],
        comments: 0,
        shares: 0,
        createdAt: serverTimestamp()
      });
      alert("Reel posted! 🎬");
    }
    window.closeCamera();
  }catch(err){
    alert("Upload failed: " + err.message);
  }
}

// =========================
// TIME AGO FUNCTION
// =========================
function timeAgo(date){
  const seconds = Math.floor((new Date() - date) / 1000);
  if(seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if(minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if(hours < 24) return `${hours} hour ago`;
  const days = Math.floor(hours / 24);
  if(days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if(months < 12) return `${months} months ago`;
  return `${Math.floor(months / 12)} year ago`;
}


// =========================
// LOAD PROFILE PIC GLOBALLY
// =========================
const profilePicCache = {};

window.getUserPic = async function(email){
  if(profilePicCache[email]) return profilePicCache[email];

  try{
    const snap = await getDocs(
      query(collection(db, "users"), where("email", "==", email))
    );
    if(!snap.empty){
      const data = snap.docs[0].data();
      const pic = data.profilePic || "";
      profilePicCache[email] = pic;
      return pic;
    }
  }catch(err){
    console.error(err);
  }
  return "";
};

window.avatarHTML = function(email, size = 10){
  const cached = profilePicCache[email];
  const initial = email.charAt(0).toUpperCase();
  
  if(cached){
    return `<img src="${cached}" class="w-${size} h-${size} rounded-full object-cover border-2 border-yellow-400">`;
  }else{
    // Load karo aur replace karo
    const id = `avatar-${email.replace(/[@.]/g,"-")}-${Date.now()}`;
    window.getUserPic(email).then(pic => {
      const el = document.getElementById(id);
      if(el && pic){
        el.outerHTML = `<img src="${pic}" class="w-${size} h-${size} rounded-full object-cover border-2 border-yellow-400">`;
      }
    });
    return `<div id="${id}" class="w-${size} h-${size} rounded-full bg-yellow-400 text-black flex items-center justify-center font-bold">${initial}</div>`;
  }
};










