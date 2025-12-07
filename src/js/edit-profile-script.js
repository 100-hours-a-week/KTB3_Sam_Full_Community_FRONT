import { apiFetch, logout } from "./common/auth.js";

let selectedFile = null;
let originalNickname = "";
let profileImageId = "";

const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const previewImg = document.getElementById("previewImg");
const changeBtn = document.querySelector(".change-btn");

const emailField = document.getElementById("emailField");
const nicknameInput = document.getElementById("nickname");
const nicknameHelper = document.getElementById("nicknameHelper");

const submitBtn = document.getElementById("submitBtn");
const formSection = document.getElementById("formSection");
const toast = document.getElementById("toast");

const withdrawBtn = document.getElementById("withdrawBtn");
const modalOverlay = document.getElementById("modalOverlay");
const cancelBtn = document.getElementById("cancelBtn");
const confirmBtn = document.getElementById("confirmBtn");

function validateNickname(value) {
  if (!value) return false;
  return value.trim().length <= 10;
}

function updateButtonState() {
  if (validateNickname(nickname.value)) {
    submitBtn.disabled = false;
    submitBtn.classList.add("enabled");
  } else {
    submitBtn.disabled = true;
    submitBtn.classList.remove("enabled");
  }
}

function checkNicknameInput() {
  if (!nickname.value) {
    nicknameHelper.textContent = "*닉네임을 입력해주세요.";
  } else if (nickname.value.includes(" ")) {
    nicknameHelper.textContent = "*띄어쓰기를 없애주세요";
  } else if (nickname.value.length > 10) {
    nicknameHelper.textContent = "*닉네임은 최대 10자까지 작성 가능합니다.";
  } else {
    nicknameHelper.textContent = " ";
  }
}

//프로필 이미지
async function loadUserProfile() {
  try {
    // 1. 유저 정보 조회
    const userInfoRes = await apiFetch("http://localhost:8080/users", {
      method: "GET",
    });

    if (!userInfoRes) return;

    const user = await userInfoRes.json();
    profileImageId = user.data.profileImageId;

    // 2. presigned GET URL 요청
    const presignedRes = await fetch(
      `http://localhost:8080/images/${profileImageId}`,
      {
        method: "GET",
      }
    );

    const imageUrlResponse = await presignedRes.json();
    const imagePresignedUrl = imageUrlResponse.data.imagePresignedUrl;

    // 3. img src에 세팅
    previewImg.src = imagePresignedUrl;

    emailField.value = user.data.email;
    originalNickname = user.data.nickname;
  } catch (err) {
    console.error("프로필 이미지 로드 실패:", err);
  }
}

loadUserProfile();
checkNicknameInput();
updateButtonState();

// 닉네임 중복 검사
nickname.addEventListener("input", async () => {
  checkNicknameInput();

  try {
    const response = await fetch(
      `http://localhost:8080/users/nickname?nickname=${nickname.value.trim()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const deserializaedResponse = await response.json();

    if (deserializaedResponse.data.isDuplicated) {
      nicknameHelper.textContent = "*중복된 닉네임 입니다.";
    }
    updateButtonState();
  } catch (e) {
    console.error(e);
    nicknameHelper.textContent = "";
  }
});

withdrawBtn.addEventListener("click", () => {
  window.showModal({
    titleText: "회원탈퇴 하시겠습니까?",
    descText: "작성된 게시글과 댓글은 삭제됩니다.",
    onConfirm: async () => {
      const response = await apiFetch("http://localhost:8080/users", {
        method: "DELETE",
      });

      if (response.ok) {
        localStorage.clear();
        window.location.href = "login.html";
      }
    },
  });
});

// === 프로필 업로드 ===
// 버튼 클릭 시 이미지 변경
changeBtn.addEventListener("click", (e) => {
  e.preventDefault();
  fileInput.click();
});

// 파일 선택 시 미리보기
fileInput.addEventListener("change", (e) => {
  if (!fileInput.files[0]) return;

  selectedFile = fileInput.files[0];

  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    previewImg.classList.remove("gray");
  };
  reader.readAsDataURL(selectedFile);
});

// 드래그 앤 드롭
uploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  previewImg.style.backgroundColor = "#e0e0e0";
});

uploadArea.addEventListener("dragleave", () => {
  previewImg.style.backgroundColor = "#e9e9e9";
});

uploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  previewImg.style.backgroundColor = "#e9e9e9";
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
    };
    reader.readAsDataURL(file);
  } else {
    alert("이미지 파일만 업로드 가능합니다.");
  }
});

// === 수정 제출 ===
formSection.addEventListener("submit", async (e) => {
  e.preventDefault();

  // 프로필 이미지를 실제로 선택했을 때만 업로드
  if (selectedFile) {
    const res = await apiFetch("http://localhost:8080/images", {
      method: "POST",
    });

    const json = await res.json();
    const uploadUrl = json.data.imagePresignedUrl;

    profileImageId = json.data.imageId;

    if (selectedFile) {
      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });
    }
  }

  const updateBody = {
    nickname: nicknameInput.value,
    profileImageId: profileImageId,
  };

  // PUT 요청
  const res = await apiFetch("http://localhost:8080/users", {
    method: "PUT",
    body: JSON.stringify(updateBody),
  });

  if (!res.ok) {
    console.log("error");
  }

  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
    window.location.href = "login.html";
  }, 1000);
});
