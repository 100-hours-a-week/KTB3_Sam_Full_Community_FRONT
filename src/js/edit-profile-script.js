// === 드롭다운 메뉴 ===
const profileMenu = document.getElementById('profileMenu');
const profileIcon = document.getElementById('profileIcon');
const dropdownMenu = document.getElementById('dropdownMenu');

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

// === 수정하기 ===
document.getElementById('submitBtn').addEventListener('click', () => {
  alert('수정 완료');
});

// === 회원 탈퇴 모달 ===
const modalOverlay = document.getElementById('modalOverlay');
document.getElementById('withdrawBtn').addEventListener('click', () => {
  modalOverlay.style.display = 'flex';
});

document.getElementById('cancelBtn').addEventListener('click', () => {
  modalOverlay.style.display = 'none';
});

document.getElementById('confirmBtn').addEventListener('click', () => {
  alert('회원 탈퇴가 완료되었습니다.');
  modalOverlay.style.display = 'none';
});

// === 프로필 업로드 ===
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewImg = document.getElementById('previewImg');
const changeBtn = document.querySelector('.change-btn');

// 버튼 클릭 시 이미지 변경
changeBtn.addEventListener('click', (e) => {
  e.preventDefault();
  fileInput.click();
});

// 파일 선택 시 미리보기
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// 드래그 앤 드롭
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  previewImg.style.backgroundColor = '#e0e0e0';
});

uploadArea.addEventListener('dragleave', () => {
  previewImg.style.backgroundColor = '#e9e9e9';
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  previewImg.style.backgroundColor = '#e9e9e9';
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
    };
    reader.readAsDataURL(file);
  } else {
    alert('이미지 파일만 업로드 가능합니다.');
  }
});


// === toast ===
const submitBtn = document.getElementById('submitBtn');
const toast = document.getElementById('toast');

submitBtn.addEventListener('click', (e) => {
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 5000);
});
