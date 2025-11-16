const email = document.getElementById('email');
const password = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const emailHelper = document.getElementById('emailHelper');
const passwordHelper = document.getElementById('passwordHelper');
const form = document.getElementById('loginForm');

function validateEmail(value) {
  const pattern = /^[A-Za-z.]+@[A-Za-z.]+\.[A-Za-z.]+$/;
  return pattern.test(value);
}

function validatePassword(value) {
  const pattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,20}$/;
  return pattern.test(value);
}

function updateButtonState() {
  if (validateEmail(email.value) && validatePassword(password.value)) {
    loginBtn.disabled = false;
    loginBtn.classList.add('enabled');
  } else {
    loginBtn.disabled = true;
    loginBtn.classList.remove('enabled');
  }
}

function checkEmailInput() {
  if (!email.value) {
    emailHelper.textContent = '*이메일을 입력해주세요';
  } else if (!validateEmail(email.value)) {
    emailHelper.textContent = '*올바른 이메일 주소 형식을 입력해주세요 (예: example@example.com)';
  } else {
    emailHelper.textContent = '';
  }
}

function checkPasswordInput() {
  if (!password.value) {
    passwordHelper.textContent = '*비밀번호를 입력해주세요';
  } else if (!validatePassword(password.value)) {
    passwordHelper.textContent = '*비밀번호는 8~20자, 대문자/소문자/숫자/특수문자를 모두 포함해야 합니다';
  } else {
    passwordHelper.textContent = '';
  }
}

checkEmailInput();
checkPasswordInput();
updateButtonState();

window.addEventListener('pageshow', () => {
  checkEmailInput();
  checkPasswordInput();
  updateButtonState();
})


email.addEventListener('input', () => {
  checkEmailInput();
  updateButtonState();
});

password.addEventListener('input', () => {
  checkPasswordInput();
  updateButtonState();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (validateEmail(email.value) && validatePassword(password.value)) {
    try {
      const response = await fetch('http://localhost:8080/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.value,
          password: password.value,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '로그인 실패');
      }

      const deserializaedResponse = await response.json();
      localStorage.setItem('accessToken', deserializaedResponse.data.accessToken);
      localStorage.setItem('refreshToken', deserializaedResponse.data.refreshToken);

      alert('로그인 성공! 게시글 목록 페이지로 이동합니다.');

      window.location.href = 'boards.html';

    } catch (error) {
      console.error('로그인 에러:', error);

      alert('아이디 또는 비밀번호를 확인해주세요.');

    }
  } else {

    alert('아이디 또는 비밀번호를 확인해주세요.');

  }
});

document.addEventListener('DOMContentLoaded', () => {
  checkEmailInput();
  checkPasswordInput();


});