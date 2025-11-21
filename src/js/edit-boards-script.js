import { apiFetch, logout } from "./auth.js";

const profileMenu = document.getElementById('profileMenu');
const profileIcon = document.getElementById('profileIcon');
const dropdownMenu = document.getElementById('dropdownMenu');
const logoutBtn = document.getElementById('logoutBtn');
const editBtn = document.getElementById('edit-btn');
const preview = document.getElementById("preview");
const form  = document.getElementById("postForm");

const urlParams = new URLSearchParams(window.location.search);
const stringBoardId = urlParams.get("id");
const boardId = parseInt(stringBoardId, 10);

const titleInput = document.getElementById("title");
const contentInput = document.getElementById("content");
const imageInput = document.getElementById("image");

let selectedFiles = [];
let existingImages = [];
let removedImageIds = [];   

//이미지 미리보기
function renderPreview() {
  preview.innerHTML = ""; // 초기화

  loadExistingImages(existingImages);

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
    uploadUrl: data.data.imagePresignedUrl
  };
}

async function loadBoard() {
  const res = await apiFetch(`http://localhost:8080/boards/${boardId}`, {
    method: "GET"
  });
  const json = await res.json();

  titleInput.value = json.data.title;
  contentInput.value = json.data.content;

  existingImages = [...json.data.boardImageIds];

  await loadExistingImages(existingImages);
}

async function loadExistingImages(ids) {
  preview.innerHTML = "";

  const requests = ids.map(id =>
    fetch(`http://localhost:8080/images/${id}`)
      .then(res => res.json())
      .then(json => ({ id, url: json.data.imagePresignedUrl }))
  );

  const images = await Promise.all(requests);

  images.forEach(({ id, url }) => {
    const box = document.createElement("div");
    box.classList.add("preview-box");

    const img = document.createElement("img");
    img.src = url;
    img.classList.add("preview-image");

    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-btn");
    deleteBtn.textContent = "×";

    deleteBtn.addEventListener("click", () => {
      removedImageIds.push(id);
      existingImages = existingImages.filter(imgId => imgId !== id);
      box.remove();
    });

    box.appendChild(img);
    box.appendChild(deleteBtn);
    preview.appendChild(box);
  });
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

//뒤로가기 버튼
backBtn.addEventListener("click", () => {
  history.back();
});

//프로필 이미지 
profileIcon.addEventListener('click', (e) => {
  e.stopPropagation(); // 클릭 버블링 방지
  profileMenu.classList.toggle('active');
});

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


//폼 제출
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  if (!title || !content) {
    alert("제목과 내용을 입력해주세요.");
    return;
  }

  // 1) 새 이미지 업로드
  const newImageIds = await uploadAllImages(selectedFiles);

  // 최종 보낼 이미지 IDs = 기존 이미지 - 삭제된 이미지 + 업로드된 이미지
  const finalImageIds = [
    ...existingImages.filter(id => !removedImageIds.includes(id)),
    ...newImageIds
  ];

  // 2) PUT 수정 요청
  const boardRes = await apiFetch(`http://localhost:8080/boards/${boardId}`, {
    method: "PUT",
    body: JSON.stringify({
      title,
      content,
      boardImageIds: finalImageIds
    }),
  });

  if (boardRes.ok) {
    window.location.href = `boards-detail.html?id=${boardId}`;
  } else {
    alert('erorr');
  }
});

loadUserProfile();
loadBoard();