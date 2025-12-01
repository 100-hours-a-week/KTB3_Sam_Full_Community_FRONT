import { apiFetch } from "./auth.js";

export async function loadHeader({
  back = false,
  profile = false,
  backUrl = null,
} = {}) {
  // 1. header.html 불러오기
  const res = await fetch("./components/header.html");
  const html = await res.text();
  document.body.insertAdjacentHTML("afterbegin", html);

  // 2. 요소 참조
  const backBtn = document.getElementById("backBtn");
  const profileMenu = document.getElementById("profileMenu");
  const profileIcon = document.getElementById("profileIcon");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const logoutBtn = document.getElementById("logoutBtn");

  // 뒤로가기 버튼 표시
  backBtn.style.display = back ? "block" : "none";

  // 프로필 메뉴 표시
  profileMenu.style.display = profile ? "block" : "none";

  // 프로필 이미지 로드
  if (profile) {
    await loadUserProfile(profileIcon);
  }

  // 드롭다운 toggle
  profileIcon?.addEventListener("click", () => {
    profileMenu.classList.toggle("active");
  });

  // 드롭다운 외부 클릭 시 닫기
  document.addEventListener("click", (e) => {
    if (!profileMenu.contains(e.target)) {
      profileMenu.classList.remove("active");
    }
  });

  // 로그아웃
  logoutBtn?.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "refactoring-login.html";
  });

  if (backUrl) {
    backBtn.addEventListener("click", () => {
      window.location.href = backUrl; // 👈 전달된 URL로 이동
    });
  } else {
    backBtn.addEventListener("click", () => {
      history.back();
    });
  }
}

async function loadUserProfile(iconElement) {
  try {
    const userInfoRes = await apiFetch("http://localhost:8080/users", {
      method: "GET",
    });
    const user = await userInfoRes.json();
    const profileImageId = user.data.profileImageId;

    const presignedRes = await fetch(
      `http://localhost:8080/images/${profileImageId}`
    );
    const urlJson = await presignedRes.json();

    iconElement.src = urlJson.data.imagePresignedUrl;
  } catch (err) {
    console.error("프로필 이미지 로드 실패:", err);
  }
}
