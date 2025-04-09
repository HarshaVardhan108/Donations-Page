document
  .getElementById("donationForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData(e.target);
      const formJson = {};

      // Convert FormData to JSON with proper type conversion
      formData.forEach((value, key) => {
        if (key === "amount") {
          formJson[key] = parseFloat(value);
        } else if (key === "has_indian_passport") {
          formJson[key] = value === "true";
        } else {
          formJson[key] = value;
        }
      });

      console.log("Sending donation data:", formJson);

      const response = await fetch("/api/donate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formJson),
        credentials: "same-origin",
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Donation submission failed");
      }

      const data = await response.json();
      console.log("Donation successful:", data);

      alert("Thank you for your donation!");

      await downloadReceipt(data.donationId);

      e.target.reset();
    } catch (error) {
      console.error("Donation error:", error);
      alert("Failed to submit donation. Please try again.");
    }
  });

const downloadReceipt = async (donationId) => {
  try {
    const response = await fetch(`/api/donation-receipt/${donationId}`, {
      method: "GET",
      headers: {
        Accept: "application/pdf",
      },
    });

    if (!response.ok) throw new Error("Failed to download receipt");

    // Create blob from response
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    // Create temporary link and trigger download
    const a = document.createElement("a");
    a.href = url;
    a.download = `donation-${donationId}.pdf`;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error("Receipt download error:", error);
    alert("Failed to download receipt. Please try again.");
  }
};
