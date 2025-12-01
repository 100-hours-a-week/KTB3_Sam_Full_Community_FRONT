import { apiFetch } from "./common/auth.js";

const commentSize = 10;
let commentPage = 1;
let commentLast = false;

let currentImageIndex = 0;
let sliderImages = [];

const authorImg = document.getElementById("authorImg");

const urlParams = new URLSearchParams(window.location.search);
const boardId = parseInt(urlParams.get("id"), 10);

const commentInput = document.getElementById("comment-input");
const commentSubmit = document.getElementById("comment-submit");
const commentList = document.getElementById("comment-list");

const editBtn = document.getElementById("edit-btn");
const deletePostBtn = document.getElementById("delete-btn");

let pendingDeleteCommentId = null;

/* ---------- 유틸 ---------- */
function formatCount(num) {
  if (num >= 100000) return Math.floor(num / 100000) + "00k";
  if (num >= 10000) return Math.floor(num / 10000) + "0k";
  if (num >= 1000) return Math.floor(num / 1000) + "k";
  return num;
}

function brToNewline(t) {
  return t.replace(/<br\s*\/?>/gi, "\n");
}
function newlineToBr(t) {
  return t.replace(/\n/g, "<br>");
}

/* ---------- 게시글 로딩 ---------- */
function renderBoard(board) {
  document.getElementById("post-title").textContent = board.title;
  document.getElementById("post-author").textContent = board.nickname;
  document.getElementById("post-date").textContent = board.updateAt;
  document.getElementById("post-body").textContent = board.content;
  document.getElementById("likesCount").textContent = board.likes;
  document.getElementById("visitorsCount").textContent = formatCount(
    board.visitors
  );
  document.getElementById("commentsNumberCount").textContent = formatCount(
    board.commentsCount
  );
}

async function fetchIsLiked(boardId) {
  const res = await apiFetch(`http://localhost:8080/boards/${boardId}/like`);
  const json = await res.json();
  return json.data.isLiked;
}

function updateLikeUI(isLiked) {
  const likeBox = document.getElementById("likes");
  likeBox.classList.toggle("liked", isLiked);
}

async function toggleLike(boardId, isLikedNow) {
  const method = isLikedNow ? "DELETE" : "POST";
  const res = await apiFetch(`http://localhost:8080/boards/${boardId}/like`, {
    method,
  });
  return res.ok;
}

function attachLikeEvent(boardId) {
  const likeBox = document.getElementById("likes");

  likeBox.addEventListener("click", async () => {
    const isLikedNow = likeBox.classList.contains("liked");

    const ok = await toggleLike(boardId, isLikedNow);
    if (!ok) return alert("좋아요 실패");

    const newLiked = !isLikedNow;
    updateLikeUI(newLiked);

    const countEl = document.getElementById("likesCount");
    const count = parseInt(countEl.textContent);
    countEl.textContent = newLiked ? count + 1 : count - 1;
  });
}

/* ---------- 슬라이더 ---------- */
async function loadBoardImages(ids) {
  if (!ids || ids.length === 0) return;

  sliderImages = await Promise.all(
    ids.map((id) =>
      fetch(`http://localhost:8080/images/${id}`)
        .then((r) => r.json())
        .then((j) => j.data.imagePresignedUrl)
    )
  );

  renderSlider(sliderImages);
}

function renderSlider(urls) {
  const imageArea = document.getElementById("imageSlider");
  const dotsArea = document.getElementById("sliderDots");

  imageArea.innerHTML = `<img id="sliderImage" class="detail-image" src="${urls[0]}" />`;

  dotsArea.innerHTML = urls
    .map(
      (_, i) =>
        `<span class="dot ${i === 0 ? "active" : ""}" data-index="${i}"></span>`
    )
    .join("");

  document.getElementById("sliderImage").addEventListener("click", () => {
    currentImageIndex = (currentImageIndex + 1) % urls.length;
    updateSlider(urls);
  });

  document.querySelectorAll(".dot").forEach((dot) => {
    dot.addEventListener("click", (e) => {
      currentImageIndex = parseInt(e.target.dataset.index);
      updateSlider(urls);
    });
  });
}

function updateSlider(urls) {
  const img = document.getElementById("sliderImage");
  img.src = urls[currentImageIndex];

  document.querySelectorAll(".dot").forEach((d, i) => {
    d.classList.toggle("active", i === currentImageIndex);
  });
}

/* ---------- 프로필 이미지 ---------- */
async function loadBoardProfileImage(profileImageId) {
  if (!profileImageId) return;
  const res = await fetch(`http://localhost:8080/images/${profileImageId}`);
  const json = await res.json();
  authorImg.src = json.data.imagePresignedUrl;
}

/* ---------- 게시글 상세 ---------- */
async function loadBoard() {
  const res = await apiFetch(`http://localhost:8080/boards/${boardId}`);
  const body = await res.json();
  const board = body.data;

  renderBoard(board);

  await loadBoardImages(board.boardImageIds);
  await loadBoardProfileImage(board.profileImageId);

  const isLiked = await fetchIsLiked(boardId);
  updateLikeUI(isLiked);
  attachLikeEvent(boardId);
}

/* ---------- 댓글 렌더링 ---------- */
function appendCommentItem(comment) {
  const li = document.createElement("li");
  li.classList.add("comment-item");

  li.innerHTML = `
    <div class="comment-top">
      <div class="comment-info">
        <img src="${comment.profileImageUrl || ""}" class="comment-profile" />
        <span class="comment-author"><strong>${comment.nickname}</strong></span>
        <span class="comment-date">${comment.updateAt}</span>
      </div>

      <div class="comment-actions top-actions">
        <button class="edit-btn">수정</button>
        <button class="delete-btn">삭제</button>
      </div>
    </div>

    <div class="comment-text">${newlineToBr(comment.content)}</div>
    <textarea class="edit-area" style="display:none;">${brToNewline(
      comment.content
    )}</textarea>

    <div class="edit-buttons" style="display:none;">
      <button class="save-edit">저장</button>
      <button class="cancel-edit">취소</button>
    </div>
  `;

  attachCommentItemEvents(li, comment.commentId);

  return li;
}

function attachCommentItemEvents(li, commentId) {
  const editBtn = li.querySelector(".edit-btn");
  const deleteBtn = li.querySelector(".delete-btn");
  const textDiv = li.querySelector(".comment-text");
  const textarea = li.querySelector(".edit-area");
  const editButtons = li.querySelector(".edit-buttons");

  /* --- 수정 시작 --- */
  editBtn.addEventListener("click", () => {
    textDiv.style.display = "none";
    textarea.style.display = "block";
    editButtons.style.display = "flex";

    li.querySelector(".comment-top").classList.add("hide-actions");

    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  });

  textarea.addEventListener("input", () => {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  });

  /* --- 수정 취소 --- */
  li.querySelector(".cancel-edit").addEventListener("click", () => {
    textarea.value = brToNewline(textDiv.innerHTML);
    textDiv.style.display = "block";
    textarea.style.display = "none";
    editButtons.style.display = "none";

    li.querySelector(".comment-top").classList.remove("hide-actions");
  });

  /* --- 수정 저장 API --- */
  li.querySelector(".save-edit").addEventListener("click", async () => {
    const newText = textarea.value.trim();
    if (!newText) return alert("내용을 입력하세요");

    const res = await apiFetch(`http://localhost:8080/comments/${commentId}`, {
      method: "PUT",
      body: JSON.stringify({ content: newText }),
    });

    if (!res.ok) return alert("댓글 수정 실패");

    textDiv.innerHTML = newlineToBr(newText);
    textDiv.style.display = "block";
    textarea.style.display = "none";
    editButtons.style.display = "none";

    li.querySelector(".comment-top").classList.remove("hide-actions");
  });

  /* --- 삭제: 모달 호출 --- */
  deleteBtn.addEventListener("click", () => {
    pendingDeleteCommentId = commentId;

    showModal({
      titleText: "댓글 삭제",
      descText: "정말 댓글을 삭제하시겠습니까?",
      onConfirm: async () => {
        const res = await apiFetch(
          `http://localhost:8080/comments/${commentId}`,
          {
            method: "DELETE",
          }
        );
        if (!res.ok) return alert("댓글 삭제 실패");

        li.remove();

        const countEl = document.getElementById("commentsNumberCount");
        countEl.textContent = parseInt(countEl.textContent) - 1;
      },
    });
  });
}

/* ---------- 댓글 불러오기 ---------- */
async function fetchComments(page) {
  const res = await apiFetch(
    `http://localhost:8080/boards/${boardId}/comments?page=${page}&size=${commentSize}`
  );

  const json = await res.json();
  return {
    comments: json.data,
    last: json.pageInfo.last,
  };
}

async function loadComments() {
  const { comments, last } = await fetchComments(commentPage);

  const list = document.getElementById("comment-list");

  const withUrl = await Promise.all(
    comments.map(async (c) => {
      if (!c.profileImageId) return { ...c, profileImageUrl: null };

      try {
        const res = await fetch(
          `http://localhost:8080/images/${c.profileImageId}`
        );
        const json = await res.json();
        return { ...c, profileImageUrl: json.data.imagePresignedUrl };
      } catch {
        return { ...c, profileImageUrl: null };
      }
    })
  );

  withUrl.forEach((c) => list.appendChild(appendCommentItem(c)));

  commentLast = last;
}

/* ---------- 댓글 등록 ---------- */
commentInput.addEventListener("input", () => {
  const text = commentInput.value.trim();
  commentSubmit.classList.toggle("active", text.length > 0);
  if (text.length > 0) commentSubmit.removeAttribute("disabled");
  else commentSubmit.setAttribute("disabled", "true");
});

commentSubmit.addEventListener("click", async () => {
  const content = commentInput.value.trim();
  if (!content) return;

  const res = await apiFetch(
    `http://localhost:8080/boards/${boardId}/comments`,
    {
      method: "POST",
      body: JSON.stringify({ content }),
    }
  );

  if (!res.ok) return alert("댓글 등록 실패");

  commentList.innerHTML = "";
  commentPage = 1;
  await loadComments();

  const countEl = document.getElementById("commentsNumberCount");
  countEl.textContent = parseInt(countEl.textContent) + 1;

  commentInput.value = "";
  commentSubmit.classList.remove("active");
  commentSubmit.setAttribute("disabled", "true");
});

/* ---------- 무한 스크롤 ---------- */
window.addEventListener("scroll", async () => {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

  if (scrollTop + clientHeight >= scrollHeight - 5) {
    if (commentLast) return;
    commentPage++;
    await loadComments();
  }
});

/* ---------- 게시글 수정 ---------- */
editBtn.addEventListener("click", () => {
  window.location.href = `edit-boards.html?id=${boardId}`;
});

/* ---------- 게시글 삭제 (모달 방식) ---------- */
deletePostBtn.addEventListener("click", () => {
  showModal({
    titleText: "게시글 삭제",
    descText: "정말 게시글을 삭제하시겠습니까?",
    onConfirm: async () => {
      const res = await apiFetch(`http://localhost:8080/boards/${boardId}`, {
        method: "DELETE",
      });

      if (!res.ok) return alert("게시글 삭제 실패");

      window.location.href = "boards.html";
    },
  });
});

/* ---------- 초기 로드 ---------- */
loadBoard();
loadComments();
