export function loadModal() {
  return fetch("./components/modal.html")
    .then((res) => res.text())
    .then((html) => {
      document.body.insertAdjacentHTML("beforeend", html);

      const modal = document.getElementById("globalModal");
      const title = document.getElementById("modalTitle");
      const desc = document.getElementById("modalDescription");
      const cancelBtn = document.getElementById("modalCancelBtn");
      const confirmBtn = document.getElementById("modalConfirmBtn");

      let confirmCallback = null;

      cancelBtn.onclick = () => {
        modal.style.display = "none";
      };

      confirmBtn.onclick = () => {
        modal.style.display = "none";
        confirmCallback && confirmCallback();
      };

      // 페이지에서 호출할 함수 제공
      window.showModal = ({ titleText, descText, onConfirm }) => {
        title.textContent = titleText;
        desc.textContent = descText;
        confirmCallback = onConfirm;

        modal.style.display = "flex";
      };
    });
}
