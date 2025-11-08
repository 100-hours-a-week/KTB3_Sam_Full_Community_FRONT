// 뒤로가기
function goBack() {
  window.history.back();
}

// 로그인 페이지로 이동
function goLogin() {
  alert("로그인 페이지로 이동합니다."); // 실제로는 location.href로 이동
}

// 프로필 미리보기
const profileImage = document.getElementById("profileImage");
const profilePreview = document.getElementById("profilePreview");

profilePreview.addEventListener("click", () => {
  profileImage.click();
});

profileImage.addEventListener("change", function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      profilePreview.innerHTML = `<img src="${e.target.result}" alt="프로필 이미지" />`;
    };
    reader.readAsDataURL(file);
  }
});

// 회원가입 폼 제출 시 유효성 검사
document.getElementById("signupForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const nickname = document.getElementById("nickname").value;

  const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  const passwordPattern = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[\W_]).{8,20}$/;

  if (!emailPattern.test(email)) {
    alert("올바른 이메일 형식이 아닙니다.");
    return;
  }

  if (!passwordPattern.test(password)) {
    alert("비밀번호는 8~20자이며, 문자/숫자/특수문자를 포함해야 합니다.");
    return;
  }

  if (password !== confirmPassword) {
    alert("비밀번호가 일치하지 않습니다.");
    return;
  }

  if (nickname.length === 0 || nickname.length > 10) {
    alert("닉네임은 1~10자 이내로 입력해주세요.");
    return;
  }

  alert("회원가입 성공! 로그인 페이지로 이동합니다.");
  // location.href = "/login.html";
});
