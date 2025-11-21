import { apiFetch, logout } from "./auth.js";

const commentSize = 10;
let commentPage = 1;
let commentLast = false;

let currentImageIndex = 0;
let sliderImages = []; // presigned URL 저장


const profileMenu = document.getElementById('profileMenu');
const profileIcon = document.getElementById('profileIcon');
const dropdownMenu = document.getElementById('dropdownMenu');
const logoutBtn = document.getElementById('logoutBtn');
const authorImg = document.getElementById("authorImg");

const urlParams = new URLSearchParams(window.location.search);
const stringBoardId = urlParams.get("id");
const boardId = parseInt(stringBoardId, 10);

const commentInput = document.getElementById("comment-input");
const commentSubmit = document.getElementById("comment-submit");
const commentList = document.getElementById("comment-list");

const commentDeleteModal = document.getElementById("commentDeleteModal");
const commentDeleteCancel = commentDeleteModal.querySelector(".cancel");
const commentDeleteConfirm = commentDeleteModal.querySelector(".confirm");

const editBtn = document.getElementById("edit-btn");

const postDeleteModal = document.getElementById("postDeleteModal");
const postCancelBtn = postDeleteModal.querySelector(".cancel");
const postConfirmBtn = postDeleteModal.querySelector(".confirm");
const deletePostBtn = document.getElementById("delete-btn");


let pendingDeleteCommentId = null;


// ---- 숫자 단위 포맷 (1k, 10k 등) ----
function formatCount(num) {
  if (num >= 100000) return Math.floor(num / 100000) + "00k";
  if (num >= 10000) return Math.floor(num / 10000) + "0k";
  if (num >= 1000) return Math.floor(num / 1000) + "k";
  return num;
}

function brToNewline(text) {
  return text.replace(/<br\s*\/?>/gi, "\n");
}

function newlineToBr(text) {
  return text.replace(/\n/g, "<br>");
}


function renderBoard(deserializedBoard) {
  document.getElementById("post-title").textContent = deserializedBoard.title;
  document.getElementById("post-author").textContent = deserializedBoard.nickname;
  document.getElementById("post-date").textContent = deserializedBoard.updateAt;
  document.getElementById("post-body").textContent = deserializedBoard.content;
  document.getElementById("likesCount").textContent = deserializedBoard.likes;
  document.getElementById("visitorsCount").textContent = formatCount(deserializedBoard.visitors);
  document.getElementById("commentsNumberCount").textContent = formatCount(deserializedBoard.commentsCount);
}

function updateLikeUI(isLiked) {
  const likeBox = document.getElementById("likes");

  if (isLiked) {
    likeBox.classList.add("liked");
  } else {
    likeBox.classList.remove("liked");
  }
}

async function refreshCommentSection() {
  commentList.innerHTML = "";
  commentPage = 1;
  commentLast = false;
  await loadComments();
}

function updateCommentCount(newCount) {
  document.getElementById("commentsNumberCount").textContent = newCount;
}

function blockScrollEvent(e) {
  e.preventDefault();
}


async function fetchIsLiked(boardId) {
  const res = await apiFetch(`http://localhost:8080/boards/${boardId}/like`, {
    method: "GET"
  });

  if (!res.ok) {
    console.error("좋아요 여부 조회 실패");
    return false;
  }

  const json = await res.json();
  return json.data.isLiked;
}

async function toggleLike(boardId, isLikedNow) {
  const method = isLikedNow ? "DELETE" : "POST";

  const res = await apiFetch(`http://localhost:8080/boards/${boardId}/like`, {
    method
  });

  return res.ok;
}

function attachLikeEvent(boardId) {
  const likeBox = document.getElementById("likes");

  likeBox.addEventListener("click", async () => {
    const isLikedNow = likeBox.classList.contains("liked");

    const success = await toggleLike(boardId, isLikedNow);
    if (!success) {
      alert("좋아요 요청 실패");
      return;
    }

    const newLiked = !isLikedNow;
    updateLikeUI(newLiked);

    // 좋아요 수 다시 반영
    const countEl = document.getElementById("likesCount");
    let count = parseInt(countEl.textContent);

    countEl.textContent = newLiked ? count + 1 : count - 1;
  });
}


async function loadBoardImages(boardImageIds) {
  if (!boardImageIds || boardImageIds.length === 0) return;

  // presigned URL 병렬 요청
  const requests = boardImageIds.map(id =>
    fetch(`http://localhost:8080/images/${id}`)
      .then(res => res.json())
      .then(json => json.data.imagePresignedUrl)
  );

  sliderImages = await Promise.all(requests);

  renderSlider(sliderImages);
}


// 실제 슬라이더 그리기
function renderSlider(urls) {
  const imageArea = document.getElementById("imageSlider");
  const dotsArea = document.getElementById("sliderDots");

  // 방어
  if (!imageArea || !dotsArea) {
    console.error("슬라이더 DOM을 찾을 수 없습니다");
    return;
  }

  imageArea.innerHTML = `
    <img id="sliderImage" class="detail-image" src="${urls[0]}" />
  `;

  dotsArea.innerHTML = urls
    .map((_, i) => `<span class="dot ${i === 0 ? "active" : ""}" data-index="${i}"></span>`)
    .join("");

  // 클릭하면 다음 이미지로 이동
  document.getElementById("sliderImage").addEventListener("click", () => {
    currentImageIndex = (currentImageIndex + 1) % urls.length;
    updateSlider(urls);
  });

  // dot 클릭 이벤트
  document.querySelectorAll(".dot").forEach(dot => {
    dot.addEventListener("click", (e) => {
      currentImageIndex = parseInt(e.target.dataset.index);
      updateSlider(urls);
    });
  });
}

function updateSlider(urls) {
  const sliderImage = document.getElementById("sliderImage");
  sliderImage.src = urls[currentImageIndex];

  document.querySelectorAll(".dot").forEach((d, i) => {
    d.classList.toggle("active", i === currentImageIndex);
  });
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


async function loadBoardProfileImage(profileImageId) {
  try {
      const presignedRes = await fetch(`http://localhost:8080/images/${profileImageId}`, {
        method: "GET",
      });

      const imageUrlResponse = await presignedRes.json();
      const imagePresignedUrl = imageUrlResponse.data.imagePresignedUrl;

      // 3. img src에 세팅
      authorImg.src = imagePresignedUrl;
  } catch (e) {
      console.error(e);
  }
}

async function loadBoard() {
  try {
    const boardDetailRes = await apiFetch(`http://localhost:8080/boards/${boardId}`, {
      method: "GET"
    });
    
    const body = await boardDetailRes.json();

    const deserializedBoard = body.data;

    renderBoard(deserializedBoard);
    await loadBoardImages(deserializedBoard.boardImageIds);
    await loadBoardProfileImage(deserializedBoard.profileImageId);

    const isLiked = await fetchIsLiked(boardId);
    updateLikeUI(isLiked);

    attachLikeEvent(boardId);

  } catch (e) {
    console.error(e);
  }
}

function attachCommentItemEvents(li, commentId) {
  const editBtn = li.querySelector(".edit-btn");
  const deleteBtn = li.querySelector(".delete-btn");
  const textDiv = li.querySelector(".comment-text");
  const textarea = li.querySelector(".edit-area");
  const editButtons = li.querySelector(".edit-buttons");

  // 수정
  editBtn.addEventListener("click", () => {
    textDiv.style.display = "none";
    textarea.style.display = "block";
    editButtons.style.display = "flex"

    li.querySelector(".top-actions").style.display = "none";
  });

  // 취소
  li.querySelector(".cancel-edit").addEventListener("click", () => {
    textarea.value = textDiv.textContent;
    textDiv.style.display = "block";
    textarea.style.display = "none";
    editButtons.style.display = "none";

    li.querySelector(".top-actions").style.display = "flex";
  });

  // 저장 (=수정 API 호출)
  li.querySelector(".save-edit").addEventListener("click", async () => {
    const newText = textarea.value.trim();
    if (!newText) return alert("내용을 입력하세요");

    const res = await apiFetch(
      `http://localhost:8080/comments/${commentId}`,
      {
        method: "PUT",
        body: JSON.stringify({ content: newText }),
      }
    );

    if (!res.ok) return alert("수정 실패");

    textDiv.innerHTML = newText.replace(/\n/g, "<br>");

    textDiv.style.display = "block";
    textarea.style.display = "none";
    editButtons.style.display = "none";
    li.querySelector(".top-actions").style.display = "flex";

    await refreshCommentSection();
  });


  deleteBtn.addEventListener("click", () => {
    pendingDeleteCommentId = commentId;
    commentDeleteModal.style.display = "flex";
    document.addEventListener("wheel", blockScrollEvent, { passive: false });
  });

  editBtn.addEventListener("click", () => {
    textDiv.style.display = "none";
    textarea.style.display = "block";
    editButtons.style.display = "flex";

    // textarea 자동 높이
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  });

  textarea.addEventListener("input", () => {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  });
  
}


function appendCommentItem(comment) {
  const li = document.createElement("li");
  li.classList.add("comment-item");
  li.setAttribute("data-id", comment.commentId);

  li.innerHTML = `
    <div class="comment-top">
      <div class="comment-info">
        <img src="${comment.profileImageUrl}" class="comment-profile"/>
        <span class="comment-author"><strong>${comment.nickname}</strong></span>
        <span class="comment-date">${comment.updateAt}</span>
      </div>

      <div class="comment-actions top-actions">
        <button class="edit-btn">수정</button>
        <button class="delete-btn">삭제</button>
      </div>
    </div>

    <div class="comment-text">${newlineToBr(comment.content)}</div>

    <textarea class="edit-area" style="display:none;">${brToNewline(comment.content)}</textarea>

    <div class="edit-buttons" style="display:none;">
      <button class="save-edit">저장</button>
      <button class="cancel-edit">취소</button>
    </div>
  `;

  attachCommentItemEvents(li, comment.commentId);
  return li;
}

async function handleCommentScroll() {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

  if (scrollTop + clientHeight >= scrollHeight - 5) {
    if (commentLast) return;

    commentPage++;
    await loadComments();
  }
}

async function fetchComments(boardId, page) {
  const res = await apiFetch(`http://localhost:8080/boards/${boardId}/comments?page=${page}&size=${commentSize}`, {
    method: "GET"
  });

  if (!res.ok) {
    console.error("댓글 조회 실패");
    return { comments: [], last: true };
  }

  const json = await res.json();

  return {
    comments: json.data,
    last: json.pageInfo.last
  };
}




async function loadComments() {
  const { comments, last } = await fetchComments(boardId, commentPage);
  const list = document.getElementById("comment-list");

  if (!comments || comments.length === 0) {
    if (!commentLast) {
      list.innerHTML += `
        <li class="no-comment">등록된 댓글이 없습니다.</li>
      `;
    }
    commentLast = last;
    return;
  }

  // Presigned URL 병렬 요청
  const requests = comments.map(c => {
    if (!c.profileImageId) {
      return Promise.resolve({
        ...c,
        profileImageUrl: null
      });
    }

    return fetch(`http://localhost:8080/images/${c.profileImageId}`)
      .then(res => res.json())
      .then(json => ({
        ...c,
        profileImageUrl: json.data.imagePresignedUrl
      }))
      .catch(() => ({
        ...c,
        profileImageUrl: null
      }));
  });

  const results = await Promise.all(requests);

  results.forEach(c => {
    list.appendChild(appendCommentItem(c));
  });

  // 페이징 처리
  commentLast = last;
  if (commentLast) {
    window.removeEventListener("scroll", handleCommentScroll);
  }
}


loadUserProfile();
loadBoard();
loadComments();




commentDeleteCancel.addEventListener("click", () => {
  pendingDeleteCommentId = null;
  commentDeleteModal.style.display = "none";
  document.removeEventListener("wheel", blockScrollEvent);
});

commentDeleteConfirm.addEventListener("click", async () => {
  if (!pendingDeleteCommentId) return;

  const res = await apiFetch(
    `http://localhost:8080/comments/${pendingDeleteCommentId}`,
    { method: "DELETE" }
  );

  if (!res.ok) {
    alert("댓글 삭제 실패");
    return;
  }

  // 모달 닫기
  commentDeleteModal.style.display = "none";
  document.removeEventListener("wheel", blockScrollEvent);

  await refreshCommentSection();

  const current = parseInt(document.getElementById("commentsNumberCount").textContent);
  updateCommentCount(current - 1);

  await loadComments();
});


commentInput.addEventListener("input", () => {
  const text = commentInput.value.trim();
  if (text.length > 0) {
    commentSubmit.classList.add("active");
    commentSubmit.removeAttribute("disabled");
  } else {
    commentSubmit.classList.remove("active");
    commentSubmit.setAttribute("disabled", "true");
  }
});

commentSubmit.addEventListener("click", async () => {
  const content = commentInput.value.trim();
  if (!content) return;

  const res = await apiFetch(`http://localhost:8080/boards/${boardId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content })
  });

  if (!res.ok) {
    alert("댓글 등록 실패");
    return;
  }

  await refreshCommentSection();

  const current = parseInt(document.getElementById("commentsNumberCount").textContent);
  updateCommentCount(current + 1);

  commentInput.value = "";
  commentSubmit.classList.remove("active");
  commentSubmit.setAttribute("disabled", "true");

});

window.addEventListener("scroll", handleCommentScroll);

//뒤로가기 버튼
backBtn.addEventListener("click", () => {
  history.back();
});

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

editBtn.addEventListener('click', (e) => {
  e.preventDefault();
  window.location.href = `edit-boards.html?id=${boardId}`;
})

deletePostBtn.addEventListener('click', () => {
  postDeleteModal.style.display = "flex";
  document.addEventListener("wheel", blockScrollEvent, { passive: false });
})

postCancelBtn.addEventListener('click', () => {
  postDeleteModal.style.display = "none";
  document.removeEventListener("wheel", blockScrollEvent);
})

postConfirmBtn.addEventListener('click', async () => {
  const res = await apiFetch(
    `http://localhost:8080/boards/${boardId}`,
    { method: "DELETE" }
  );

  if (!res.ok) {
    alert("게시글 삭제 실패");
    return;
  }

  postDeleteModal.style.display = "none";

  window.location.href = "boards.html";
});