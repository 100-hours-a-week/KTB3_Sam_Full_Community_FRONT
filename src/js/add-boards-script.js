import { apiFetch, logout } from "./common/auth.js";

let selectedFiles = [];
const profileMenu = document.getElementById("profileMenu");
const profileIcon = document.getElementById("profileIcon");
const dropdownMenu = document.getElementById("dropdownMenu");
const logoutBtn = document.getElementById("logoutBtn");
const addBtn = document.getElementById("add-btn");
const imageInput = document.getElementById("image");
const preview = document.getElementById("preview");
const form = document.getElementById("postForm");
const contentHelper = document.getElementById("content-helper");

//이미지 미리보기
function renderPreview() {
  preview.innerHTML = ""; // 초기화

  selectedFiles.forEach((file, index) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      // 박스 생성
      const box = document.createElement("div");
      box.classList.add("preview-box");

      // 이미지 생성
      const img = document.createElement("img");
      img.src = e.target.result;
      img.classList.add("preview-image");

      // 삭제 버튼 생성
      const deleteBtn = document.createElement("button");
      deleteBtn.classList.add("delete-btn");
      deleteBtn.textContent = "×";

      // 삭제 로직
      deleteBtn.addEventListener("click", () => {
        selectedFiles.splice(index, 1); // 배열에서 제거
        renderPreview(); // UI 재렌더링
      });

      box.appendChild(img);
      box.appendChild(deleteBtn);
      preview.appendChild(box);
    };

    reader.readAsDataURL(file);
  });
}

// 이미지 업로드 url 발급받기
async function getPresignedUrl() {
  const res = await fetch("http://localhost:8080/images", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  const data = await res.json();
  return {
    imageId: data.data.imageId,
    uploadUrl: data.data.imagePresignedUrl,
  };
}

async function uploadSingleImage(file) {
  // 1. presigned URL 요청
  const { imageId, uploadUrl } = await getPresignedUrl();

  // 2. S3 업로드
  await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  return imageId;
}

async function uploadAllImages(files) {
  const imageIds = [];

  for (const file of files) {
    const id = await uploadSingleImage(file);
    imageIds.push(id);
  }

  return imageIds;
}

// 이미지 파일 추가
imageInput.addEventListener("change", () => {
  const files = Array.from(imageInput.files);

  selectedFiles = [...selectedFiles, ...files];

  renderPreview();
});

//폼 제출
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();

  if (!title || !content) {
    contentHelper.textContent = "*제목, 내용을 모두 작성해주세요.";
    return;
  } else {
    contentHelper.textContent = "";
  }

  // 1) 이미지 업로드
  const imageIds = await uploadAllImages(selectedFiles);

  // 2) 게시글 작성 요청
  const boardRes = await apiFetch("http://localhost:8080/boards", {
    method: "POST",
    body: JSON.stringify({
      title,
      content,
      boardImageIds: imageIds,
    }),
  });

  const result = await boardRes.json();

  if (boardRes.ok) {
    alert("게시글이 등록되었습니다!");
    window.location.href = "boards.html";
  } else {
    alert(result.message);
  }
});
