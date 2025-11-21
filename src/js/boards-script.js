import { apiFetch, logout } from "./auth.js";

const size = 10;
let page = 1;

const wrtieBtn = document.getElementById("writeBtn");
const profileMenu = document.getElementById('profileMenu');
const profileIcon = document.getElementById('profileIcon');
const dropdownMenu = document.getElementById('dropdownMenu');
const logoutBtn = document.getElementById('logoutBtn');

// ---- 숫자 단위 포맷 (1k, 10k 등) ----
function formatCount(num) {
  if (num >= 100000) return Math.floor(num / 100000) + "00k";
  if (num >= 10000) return Math.floor(num / 10000) + "0k";
  if (num >= 1000) return Math.floor(num / 1000) + "k";
  return num;
}

//프로필 이미지 
async function loadUserProfile() {
  try {
    // 1. 유저 정보 조회
    const userInfoRes = await apiFetch("http://localhost:8080/users", {
      method: "GET"
    });

    if (!userInfoRes) return;

    const user = await userInfoRes.json();
    const profileImageId = user.data.profileImageId;

    // 2. presigned GET URL 요청
    const presignedRes = await fetch(`http://localhost:8080/images/${profileImageId}`, {
      method: "GET",
    });

    const imageUrlResponse = await presignedRes.json();
    const imagePresignedUrl = imageUrlResponse.data.imagePresignedUrl;

    // 3. img src에 세팅
    profileIcon.src = imagePresignedUrl;

  } catch (err) {
    console.error("프로필 이미지 로드 실패:", err);
  }
}

//게시글 불러오기
async function fetchPosts(page) {
  const res = await apiFetch(`http://localhost:8080/boards?page=${page}&size=${size}`, {
    method: "GET"
  });

  if (!res.ok) {
    console.error("게시글 조회 실패");
    return { posts: [], isLast: true };
  }

  const json = await res.json();
  
  return {
    posts: json.data,
    isLast: json.pageInfo.last
  };
}

async function renderPosts() {
  const { posts, isLast } = await fetchPosts(page);
  const list = document.getElementById("postList");

  posts.forEach(post => {
    const card = document.createElement("div");
    card.className = "post-card";

    card.innerHTML = `
      <div class="post-title">
        ${post.title.length > 26 ? post.title.slice(0, 26) + "..." : post.title}
      </div>

      <div class="post-meta">
        <span>
          좋아요 ${formatCount(post.likes)} · 
          댓글 ${formatCount(post.commentsCount)} · 
          조회수 ${formatCount(post.visitors)}
        </span>
        <span>${post.updateAt}</span>
      </div>

      <div class="profile">
        <img id="profile-${post.boardId}" src="" alt="profile">
        <span>${post.nickname}</span>
      </div>
    `;

    console.log("post.profileImageId:", post.profileImageId);

    card.addEventListener("click", () => {
      window.location.href = `boards-detail.html?id=${post.boardId}`;
    });

    list.appendChild(card);
  });
  

  loadProfileImagesInParallel(posts);

  // 마지막 페이지면 더 이상 스크롤 이벤트 실행되지 않도록 처리
  if (isLast) {
    window.removeEventListener("scroll", handleScroll);
  }
}

// 사진 병렬 요청
async function loadProfileImagesInParallel(posts) {

  // 요청 목록 생성 (imageId만 사용)
  const requests = posts.map(post => {
    if (!post.profileImageId) return null;

    return fetch(`http://localhost:8080/images/${post.profileImageId}`)
      .then(res => res.json())
      .then(json => ({
        imageId: post.profileImageId,
        postId: post.boardId,   // ← 이건 프론트에서 매핑
        url: json.data.imagePresignedUrl
      }))
      .catch(() => null);
  });

  // 병렬 처리
  const results = await Promise.all(requests);

  // DOM 적용
  results.forEach(item => {
    if (!item) return;

    const img = document.getElementById(`profile-${item.postId}`);
    if (img) {
      img.src = item.url;
    }
  });
}


// ---- 인피니티 스크롤 ----
async function handleScroll() {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  if (scrollTop + clientHeight >= scrollHeight - 5) {
    page++;
    await renderPosts();
  }
}

window.addEventListener("scroll", handleScroll);



loadUserProfile();
renderPosts();




//프로필 이미지 
profileIcon.addEventListener('click', (e) => {
  e.stopPropagation(); // 클릭 버블링 방지
  profileMenu.classList.toggle('active');
});



// 드롭다운 화면 다른 곳 클릭 시 닫기
document.addEventListener('click', (e) => {
  if (!profileMenu.contains(e.target)) {
    profileMenu.classList.remove('active');
  }
});

// 로그아웃 버튼
logoutBtn.addEventListener('click', (e) => {
  e.preventDefault();
  logout();
});


// 게시글 작성 이동 버튼
wrtieBtn.addEventListener('click', () => {
  window.location.href = "add-boards.html";
})
