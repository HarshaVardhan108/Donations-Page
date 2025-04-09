function checkAuth() {
  const token = localStorage.getItem("adminToken");
  if (!token) {
    window.location.href = "/login.html";
    return false;
  }
  return token;
}

async function loadDonations() {
  const token = checkAuth();
  if (!token) return;

  try {
    const response = await fetch("/api/donations", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("adminToken");
      window.location.href = "/login.html";
      return;
    }

    const donations = await response.json();

    const tableBody = document.getElementById("donationsTable");
    tableBody.innerHTML = donations
      .map(
        (donation) => `
            <tr>
                <td>${donation.id}</td>
                <td>${donation.name}</td>
                <td>${donation.email}</td>
                <td>Rs${donation.amount}</td>
                <td>${donation.message || "-"}</td>
                <td>${new Date(donation.created_at).toLocaleString()}</td>
                <td>
                    <a href="/api/donation-receipt/${
                      donation.id
                    }" target="_blank" 
                       class="btn btn-sm btn-primary">Download Receipt</a>
                </td>
            </tr>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error:", error);
    alert("Failed to load donations");
  }
}

document.addEventListener("DOMContentLoaded", loadDonations);
