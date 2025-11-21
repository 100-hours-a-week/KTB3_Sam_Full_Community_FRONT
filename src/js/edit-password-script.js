import { apiFetch, logout } from "./auth.js";

const profileMenu = document.getElementById('profileMenu');
const profileIcon = document.getElementById('profileIcon');
const dropdownMenu = document.getElementById('dropdownMenu');
const logoutBtn = document.getElementById('logoutBtn');

const passwordInput = document.getElementById("password");
const passwordCheckInput = document.getElementById("passwordCheck");

const passwordHelper = document.getElementById("passwordHelper");
const passwordCheckHelper = document.getElementById("passwordCheckHelper");

const submitBtn = document.getElementById("submitBtn");
const toast = document.getElementById("toast");
const passwordForm = document.getElementById("passwordForm");


// 비밀번호 유효성 검사
function validatePassword() {
  const value = passwordInput.value.trim();

  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=]).{8,20}$/;

  if (value === "") {
    passwordHelper.textContent = "*비밀번호를 입력해주세요.";
    return false;
  }
  if (!regex.test(value)) {
    passwordHelper.textContent =
      "*비밀번호는 8자 이상, 20자 이하이며, 대문자/소문자/숫자/특수문자를 포함해야 합니다.";
    return false;
  }

  passwordHelper.textContent = "";
  return true;
}


// 비밀번호 확인 검사
function validatePasswordCheck() {
  if (passwordCheckInput.value.trim() === "") {
    passwordCheckHelper.textContent = "*비밀번호를 한번 더 입력해주세요.";
    return false;
  }
  if (passwordCheckInput.value !== passwordInput.value) {
    passwordCheckHelper.textContent = "*비밀번호와 다릅니다.";
    return false;
  }

  passwordCheckHelper.textContent = "";
  return true;
}


// 전체 입력 확인해서 버튼 활성화
function updateButtonState() {
  if (validatePassword() && validatePasswordCheck()) {
    submitBtn.disabled = false;
    submitBtn.classList.add("enabled");
  } else {
    submitBtn.disabled = true;
    submitBtn.classList.remove("enabled");
  }
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

    emailField.value = user.data.email;
    originalNickname = user.data.nickname;

  } catch (err) {
    console.error("프로필 이미지 로드 실패:", err);
  }
}



loadUserProfile();


// 이벤트 등록
passwordInput.addEventListener("input", updateButtonState);
passwordCheckInput.addEventListener("input", updateButtonState);


// 폼 제출
passwordForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!validatePassword() || !validatePasswordCheck()) return;

  const body = {
    password: passwordInput.value,
    checkPassword: passwordCheckInput.value
  };

  const res = await apiFetch("http://localhost:8080/users/password", {
    method: "PATCH",
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    console.log("비밀번호 변경 실패");
    return;
  }

  // 성공 토스트 표시
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove('show')
    window.location.href = "login.html";
  }, 1000);
});

profileIcon.addEventListener('click', (e) => {
  e.stopPropagation(); // 클릭 버블링 방지
  profileMenu.classList.toggle('active');
});

// 화면 다른 곳 클릭 시 닫기
document.addEventListener('click', (e) => {
  if (!profileMenu.contains(e.target)) {
    profileMenu.classList.remove('active');
  }
});

logoutBtn.addEventListener('click', (e) => {
  e.preventDefault();
  logout();
});
