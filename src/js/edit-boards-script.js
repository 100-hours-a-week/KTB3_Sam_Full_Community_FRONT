// ===== 요소 선택 =====
const titleInput = document.getElementById("title");
const contentInput = document.getElementById("content");
const imageInput = document.getElementById("image");
const editBtn = document.getElementById("edit-btn");

// ===== URL 파라미터에서 게시글 ID 가져오기 =====
const params = new URLSearchParams(window.location.search);
const postId = params.get("id") ?? 1;

// ===== 샘플 데이터 =====
const mockPosts = {
  1: {
    id: 1,
    title: "오늘의 아무말 대잔치 🗣️",
    content: "오늘은 정말 날씨가 좋아서 아무 말이나 해봅니다. ☀️",
    imageUrl: "https://placehold.co/600x400"
  },
  2: {
    id: 2,
    title: "두 번째 게시글입니다!",
    content: "내용 수정 테스트 중이에요.",
    imageUrl: ""
  }
};

// ===== 게시글 불러오기 =====
async function fetchPost(id) {
  console.log(`Fetching post ${id} ...`);
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockPosts[id]), 600); // mock fetch delay
  });
}

// ===== 게시글 데이터 로드 =====
async function loadPostData() {
  try {
    const data = await fetchPost(postId);
    if (!data) throw new Error("데이터 없음");

    titleInput.value = data.title;
    contentInput.value = data.content;

    if (data.imageUrl) {
      document.getElementById("image-helper").textContent =
        `현재 이미지: ${data.imageUrl.split('/').pop()}`;
    }

    console.log("📦 게시글 로드 완료:", data);
  } catch (err) {
    alert("게시글 정보를 불러오지 못했습니다.");
    console.error(err);
  }
}

// ===== 이미지 업로드 (모의 presigned URL 요청) =====
async function uploadImage(file) {
  console.log("📡 Presigned URL 요청 중...");
  const presignedUrl = "https://fake-s3-upload-url.com"; // 임시 URL
  await fetch(presignedUrl, {
    method: "PUT",
    body: file
  });
  return `${presignedUrl}/${file.name}`;
}

// ===== 수정 버튼 이벤트 =====
editBtn.addEventListener("click", async (e) => {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  const file = imageInput.files[0];

  let imageUrl = "";
  if (file) {
    imageUrl = await uploadImage(file);
  }

  const payload = { id: postId, title, content, imageUrl };
  console.log("📡 수정 요청 전송:", payload);

  // 실제 PATCH 요청 예시
  // await fetch(`/api/posts/${postId}`, {
  //   method: "PATCH",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(payload)
  // });

  alert("✅ 게시글 수정 요청이 전송되었습니다!");
});

// ===== 초기화 =====
loadPostData();


