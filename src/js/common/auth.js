function handleLogout() {
  localStorage.clear();
  window.location.href = "login.html";
}

export async function logout() {
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");

  await fetch("http://localhost:8080/logout", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken })
  });

  handleLogout();
}

export async function apiFetch(url, options = {}, retry = true) {
  let accessToken = localStorage.getItem("accessToken");

  const baseOptions = {
    ...options,
    headers: {
      ...(options.headers || {}),
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    }
  };

  let response = await fetch(url, baseOptions);

  // accessToken 만료
  if (response.status === 401 && retry) {
    const refreshed = await reissueToken();

    if (refreshed) {
      return apiFetch(url, options, false); // 다시 재시도
    } else {
      handleLogout(); // refreshToken도 만료
      return null;
    }
  }

  return response;
}

export async function reissueToken() {
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");

  const res = await fetch("http://localhost:8080/auth", {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken })
  });

  // refreshToken 만료 → 실패
  if (!res.ok) {
    return false;
  }

  const data = await res.json();

  // 새로운 accessToken + refreshToken 저장
  localStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);

  return true;
}