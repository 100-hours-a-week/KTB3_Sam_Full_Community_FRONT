// --------------------
// Mock Fetch API
// --------------------
async function fetchPostData() {
  // 실제에선 fetch(`/api/posts/${id}`) 이런 식으로 대체
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: 1,
        title: "제목 1",
        author: "더미 작성자1",
        date: "2025-01-01 00:00:00",
        content: "아무 말 대잔치의 예시 게시글입니다.",
        imageUrl: "https://placehold.co/600x400",
        likes: 123,
        views: 456,
        comments: [
          { id: 1, author: "더미 작성자1", date: "2025-01-01 00:00:00", text: "첫 댓글이에요!" },
          { id: 2, author: "더미 작성자2", date: "2025-01-02 00:00:00", text: "두 번째 댓글입니다." },
        ],
      });
    }, 500);
  });
}

// --------------------
// 전역 상태
// --------------------
let postData = null;
let editingCommentId = null;

// --------------------
// 초기 로드
// --------------------
document.addEventListener("DOMContentLoaded", async () => {
  postData = await fetchPostData();
  renderPost(postData);
  renderComments(postData.comments);
});

// --------------------
// 게시글 렌더링
// --------------------
function renderPost(data) {
  document.getElementById("post-title").textContent = data.title;
  document.getElementById("post-author").textContent = data.author;
  document.getElementById("post-date").textContent = data.date;
  document.getElementById("post-body").textContent = data.content;
  document.getElementById("post-image").src = data.imageUrl;
}

// --------------------
// 댓글 렌더링
// --------------------
function renderComments(comments) {
  const list = document.getElementById("comment-list");
  list.innerHTML = "";

  comments.forEach((c) => {
    const li = document.createElement("li");
    li.classList.add("comment-item");
    li.setAttribute("data-id", c.id);

    if (editingCommentId === c.id) {
      // 수정 모드
      li.innerHTML = `
        <div class="comment-top">
          <div class="comment-info">
            <img src="https://placehold.co/35x35" alt="프로필" class="comment-profile" />
            <span class="comment-author"><strong>${c.author}</strong></span>
            <span class="comment-date">${c.date}</span>
          </div>
          <div class="comment-actions">
            <button class="save-edit">저장</button>
            <button class="cancel-edit">취소</button>
          </div>
        </div>
        <textarea class="edit-textarea">${c.text}</textarea>
      `;
    } else {
      // 일반 모드
      li.innerHTML = `
        <div class="comment-top">
          <div class="comment-info">
            <img src="https://placehold.co/35x35" alt="프로필" class="comment-profile" />
            <span class="comment-author"><strong>${c.author}</strong></span>
            <span class="comment-date">${c.date}</span>
          </div>
          <div class="comment-actions">
            <button class="edit">수정</button>
            <button class="delete">삭제</button>
          </div>
        </div>
        <div class="comment-text">${c.text}</div>
      `;
    }

    list.appendChild(li);
  });

  attachCommentEvents();
}

// --------------------
// 댓글 이벤트 연결
// --------------------
function attachCommentEvents() {
  // 수정 버튼
  document.querySelectorAll(".comment-actions .edit").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = parseInt(e.target.closest(".comment-item").dataset.id);
      editingCommentId = id;
      renderComments(postData.comments);
    });
  });

  // 삭제 버튼
  document.querySelectorAll(".comment-actions .delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = parseInt(e.target.closest(".comment-item").dataset.id);
      openModal("commentDeleteModal", id);
    });
  });

  // 수정 저장
  document.querySelectorAll(".save-edit").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const li = e.target.closest(".comment-item");
      const id = parseInt(li.dataset.id);
      const newText = li.querySelector(".edit-textarea").value.trim();
      if (newText) {
        const comment = postData.comments.find((c) => c.id === id);
        comment.text = newText;
        editingCommentId = null;
        renderComments(postData.comments);
      }
    });
  });

  // 수정 취소
  document.querySelectorAll(".cancel-edit").forEach((btn) => {
    btn.addEventListener("click", () => {
      editingCommentId = null;
      renderComments(postData.comments);
    });
  });
}

// --------------------
// 댓글 등록
// --------------------
// --------------------
// 댓글 등록
// --------------------
const input = document.getElementById("comment-input");
const submit = document.getElementById("comment-submit");

input.addEventListener("input", () => {
  const hasText = input.value.trim().length > 0;
  if (hasText) {
    submit.classList.add("active");
    submit.removeAttribute("disabled");
  } else {
    submit.classList.remove("active");
    submit.setAttribute("disabled", "true");
  }
});

submit.addEventListener("click", (e) => {
  e.preventDefault();
  if (submit.hasAttribute("disabled")) return;

  const newComment = {
    id: Date.now(),
    author: "더미 작성자3",
    date: new Date().toISOString().slice(0, 19).replace("T", " "),
    text: input.value.trim(),
  };

  postData.comments.push(newComment);
  renderComments(postData.comments);

  // 입력 초기화
  input.value = "";
  submit.classList.remove("active");
  submit.setAttribute("disabled", "true");
});



// --------------------
// 모달 제어
// --------------------
let currentDeleteId = null;

function openModal(id, commentId = null) {
  document.getElementById(id).style.display = "flex";
  currentDeleteId = commentId;
}

function closeModal(id) {
  document.getElementById(id).style.display = "none";
  currentDeleteId = null;
}

// 모달 버튼
document.querySelectorAll(".cancel").forEach((btn) =>
  btn.addEventListener("click", () => {
    closeModal("commentDeleteModal");
  })
);

document.querySelectorAll(".confirm").forEach((btn) =>
  btn.addEventListener("click", () => {
    if (currentDeleteId) {
      postData.comments = postData.comments.filter((c) => c.id !== currentDeleteId);
      renderComments(postData.comments);
    }
    closeModal("commentDeleteModal");
  })
);


document.getElementById("delete-btn").addEventListener("click", () => openModal("postDeleteModal"));
document.querySelectorAll(".cancel").forEach(btn => btn.addEventListener("click", () => {
  closeModal("postDeleteModal");
  closeModal("commentDeleteModal");
}));

document.querySelectorAll(".confirm").forEach(btn => btn.addEventListener("click", () => {
  alert("삭제 완료 (모의)");
  closeModal("postDeleteModal");
  closeModal("commentDeleteModal");
}));
