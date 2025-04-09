document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const credentials = {
    username: document.getElementById("username").value,
    password: document.getElementById("password").value,
  };

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (response.ok) {
      const { token } = await response.json();
      localStorage.setItem("adminToken", token);
      window.location.href = "/admin.html";
    } else {
      alert("Invalid credentials");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Login failed");
  }
});
