let page = 0;
const limit = 5;

// ---- 더미 데이터 (fetch 대체용) ----
async function fetchPosts(page) {
  return Array.from({ length: limit }, (_, i) => ({
    id: page * limit + i + 1,
    title: "제목 " + (page * limit + i + 1) + " 입니다. 긴 제목이면 자동으로 줄어듭니다.",
    likes: Math.floor(Math.random() * 20000),
    comments: Math.floor(Math.random() * 300),
    views: Math.floor(Math.random() * 100000),
    author: "더미 작성자" + (i + 1),
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
  }));
}

// ---- 숫자 단위 포맷 (1k, 10k 등) ----
function formatCount(num) {
  if (num >= 100000) return Math.floor(num / 100000) + "00k";
  if (num >= 10000) return Math.floor(num / 10000) + "0k";
  if (num >= 1000) return Math.floor(num / 1000) + "k";
  return num;
}

// ---- 게시글 렌더링 ----
async function renderPosts() {
  const posts = await fetchPosts(page);
  const list = document.getElementById("postList");

  posts.forEach(post => {
    const card = document.createElement("div");
    card.className = "post-card";
    card.innerHTML = `
      <div class="post-title">${post.title.length > 26 ? post.title.slice(0, 26) + "..." : post.title}</div>
      <div class="post-meta">
        <span>좋아요 ${formatCount(post.likes)} · 댓글 ${formatCount(post.comments)} · 조회수 ${formatCount(post.views)}</span>
        <span>${post.createdAt}</span>
      </div>
      <div class="profile">
        <img alt="profile" />
        <span>${post.author}</span>
      </div>
    `;
    card.addEventListener("click", () => {
      alert(`게시글 상세보기: ${post.title}`);
    });
    list.appendChild(card);
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

document.getElementById("writeBtn").addEventListener("click", () => {
  alert("게시글 작성 페이지로 이동합니다!");
});

// ---- 초기 로드 ----
renderPosts();
