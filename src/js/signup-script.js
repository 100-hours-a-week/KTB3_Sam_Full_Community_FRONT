const backBtn = document.getElementById("backBtn");
const profileImage = document.getElementById("profileImage");
const profilePreview = document.getElementById("profilePreview");
const signupForm = document.getElementById("signupForm");

const signupBtn = document.getElementById('signupBtn');

const email = document.getElementById('email');
const password = document.getElementById('password');
const passwordConfirm = document.getElementById('passwordConfirm');
const nickname = document.getElementById('nickname');

const profileHelper = document.getElementById('profileHelper');
const emailHelper = document.getElementById('emailHelper');
const passwordHelper = document.getElementById('passwordHelper');
const passwordConfirmHelper = document.getElementById('passwordConfirmHelper');
const nicknameHelper = document.getElementById('nicknameHelper');

function validateProfile() {
  return profileImage.files && profileImage.files.length >0;
}

function validateEmail(value) {
  const pattern = /^[A-Za-z.]+@[A-Za-z.]+\.[A-Za-z.]+$/;
  return pattern.test(value);
}

function validatePassword(value) {
  const pattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,20}$/;
  return pattern.test(value);
}

function validatePasswordConfirm() {
  return password.value === passwordConfirm.value;
}

function validateNickname(value) {
  if(!value) return false;
  return value.trim().length <=10;
}

function updateButtonState() {
  if (validateProfile() && validateEmail(email.value) && validatePassword(password.value) &&
      validatePasswordConfirm() && validateNickname(nickname.value)) {
    signupBtn.disabled = false;
    signupBtn.classList.add('enabled');
  } else {
    signupBtn.disabled = true;
    signupBtn.classList.remove('enabled');
  }
}

function checkProfileInput() {
  if(!validateProfile()) {
    profileHelper.textContent = '*프로필 사진을 추가해주세요.';
  } else {
    profileHelper.textContent = '';
  }
}

function checkEmailInput() {
  if (!email.value.trim()) {
    emailHelper.textContent = '*이메일을 입력해주세요';
  } else if (!validateEmail(email.value.trim())) {
    emailHelper.textContent = '*올바른 이메일 주소 형식을 입력해주세요 (예: example@example.com)';
  } else {
    emailHelper.textContent = '';
  }
}

function checkPasswordInput() {
  if (!password.value) {
    passwordHelper.textContent = '*비밀번호를 입력해주세요';
  } else if (passwordConfirm.value && !validatePasswordConfirm()) {
    passwordHelper.textContent = '*비밀번호가 다릅니다.';
  } else if (!validatePassword(password.value)) {
    passwordHelper.textContent = '*비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.';
  } else {
    passwordHelper.textContent = '';
  }
}

function checkPasswordConfirm() {
  if (!passwordConfirm.value) {
    passwordConfirmHelper.textContent = '*비밀번호를 한번 더 입력해주세요';
  } else if (password.value && !validatePasswordConfirm()) {
    passwordConfirmHelper.textContent = '*비밀번호가 다릅니다.';
  } else if (!validatePassword(passwordConfirm.value)) {
    passwordConfirmHelper.textContent = '*비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.';
  } else {
    passwordConfirmHelper.textContent = '';
  }
}

function checkNicknameInput() {
  if(!nickname.value) {
    nicknameHelper.textContent = '*닉네임을 입력해주세요.'
  } else if (nickname.value.includes(' ')) {
    nicknameHelper.textContent = '*띄어쓰기를 없애주세요'
  } else if(nickname.value.length > 10) {
      nicknameHelper.textContent = '*닉네임은 최대 10자까지 작성 가능합니다.'
  } else {
    nicknameHelper.textContent = ' ';
  }
}

checkPasswordInput();
checkPasswordConfirm();
checkNicknameInput();
updateButtonState();

// 프로필
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
    profileHelper.textContent = "";
  } else {
    profileImage.value = "";
    profilePreview.innerHTML = "+";
    checkProfileInput();
  }
  updateButtonState();
});

email.addEventListener('input', () => {
  checkEmailInput();
  updateButtonState();
});

// 이메일 포커스 아웃
email.addEventListener('blur', async () => {
  checkEmailInput();

  try {
    const response = await fetch(`http://localhost:8080/users/email?email=${email.value.trim()}`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
      },
    });
    
    const deserializaedResponse = await response.json();

    if(deserializaedResponse.data.isDuplicated) {
      emailHelper.textContent = "*중복된 이메일 입니다."
    }
    updateButtonState();
  } catch (e) {
    console.error(e);
    emailHelper.textContent = "";
  }
});

// 닉네임 중복 검사
nickname.addEventListener('input', async () => {
  checkNicknameInput();

  try {
    const response = await fetch(`http://localhost:8080/users/nickname?nickname=${nickname.value.trim()}`, {
      method: 'GET',
      headers: {
        'Content-Type' : 'application/json',
      },
    });

    const deserializaedResponse = await response.json();

    if(deserializaedResponse.data.isDuplicated) {
      nicknameHelper.textContent = "*중복된 닉네임 입니다."
    }
    updateButtonState();
  } catch(e) {
    console.error(e);
    nicknameHelper.textContent = '';
  }
});

// 비밀번호 유효성 검사
password.addEventListener('input', () => {
    checkPasswordInput();
    updateButtonState();
});

// 비밀번호 확인 유효성 검사
passwordConfirm.addEventListener('input', () => {
  checkPasswordConfirm();
  updateButtonState();
});

// 회원가입 폼 제출 시 유효성 검사
signupForm.addEventListener("submit", async(eve) => {
  eve.preventDefault();
  let presignedResponse
  try {
    presignedResponse = await fetch('http://localhost:8080/images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
  });
  } catch(e) {
    console.error(e);
  }
  const deseralizedResponse = await presignedResponse.json();
  const imageUploadUrl = deseralizedResponse.data.imageUploadUrl;
  const file = profileImage.files[0];

  const uploadResponse = await fetch(imageUploadUrl, {
    method: 'PUT',
    headers: {
    "Content-Type": file.type,
    },
    body: file,
  });


  const requestBody = {
    email: email.value.trim(),
    password: password.value,
    nickname: nickname.value.trim(),
    profileImageId: 10
  };


  try {
    const response = await fetch('http://localhost:8080/users', {
      method: 'POST',
      headers: {
        'Content-Type' : 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const deserializaedResponse = await response.json();

    localStorage.setItem('userId', deserializaedResponse.data.userId);
    
  } catch(e) {
    console.error(e);
  }
});

backBtn.addEventListener("click", () => {
  history.back();
});
