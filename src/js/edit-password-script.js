const password = document.getElementById('password');
const checkPassword = document.getElementById('check-password');
const form = document.querySelector('.eidt-password-form');
const editBtn = document.querySelector('.edit-button');

// 🔹 헬퍼 텍스트를 동적으로 추가할 영역
function showHelperText(input, message) {
  let helper = input.nextElementSibling;
  if (!helper || !helper.classList.contains('helper-text')) {
    helper = document.createElement('p');
    helper.classList.add('helper-text');
    helper.style.color = 'red';
    helper.style.fontSize = '12px';
    helper.style.margin = '-10px 0 12px 0';
    input.insertAdjacentElement('afterend', helper);
  }
  helper.textContent = message;
}

function clearHelperText(input) {
  const helper = input.nextElementSibling;
  if (helper && helper.classList.contains('helper-text')) {
    helper.remove();
  }
}

// 🔹 비밀번호 유효성 검사 정규식
function validatePassword(pw) {
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[{\]};:'",<.>/?]).{8,20}$/;
  return regex.test(pw);
}

// 🔹 실시간 유효성 검사
function checkValidity() {
  let valid = true;

  // 비밀번호 입력 안 했을 경우
  if (!password.value.trim()) {
    showHelperText(password, '*비밀번호를 입력해주세요.');
    valid = false;
  } else if (!validatePassword(password.value)) {
    showHelperText(
      password,
      '*비밀번호는 8자 이상, 20자 이하이며 대문자, 소문자, 숫자, 특수문자를 모두 포함해야 합니다.'
    );
    valid = false;
  } else {
    clearHelperText(password);
  }

  // 비밀번호 확인 검사
  if (!checkPassword.value.trim()) {
    showHelperText(checkPassword, '*비밀번호를 한번 더 입력해주세요.');
    valid = false;
  } else if (checkPassword.value !== password.value) {
    showHelperText(checkPassword, '*비밀번호와 다릅니다.');
    valid = false;
  } else {
    clearHelperText(checkPassword);
  }

  // 🔹 버튼 활성화/비활성화
  editBtn.disabled = !valid;
  editBtn.style.backgroundColor = valid ? '#7f6aee' : '#aca0eb';

  return valid;
}

password.addEventListener('input', checkValidity);
checkPassword.addEventListener('input', checkValidity);

// 🔹 Toast 메시지
function showToast(message) {
  let toast = document.createElement('div');
  toast.textContent = message;
  toast.style.position = 'absolute';
  toast.style.bottom = '-60px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.background = '#7f6aee';
  toast.style.color = '#fff';
  toast.style.padding = '10px 24px';
  toast.style.borderRadius = '20px';
  toast.style.fontSize = '14px';
  toast.style.fontWeight = '500';
  toast.style.opacity = '0';
  toast.style.transition = 'opacity 0.5s';
  form.appendChild(toast);

  requestAnimationFrame(() => (toast.style.opacity = '1'));

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

// 🔹 폼 제출 시
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (checkValidity()) {
    showToast('수정 완료');
    password.value = '';
    checkPassword.value = '';
    editBtn.disabled = true;
    editBtn.style.backgroundColor = '#aca0eb';
  }
});
