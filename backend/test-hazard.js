async function testHazard() {
  try {
    console.log("Sending request to backend...");

    const response = await fetch(
      "http://127.0.0.1:5000/api/hazards",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: "Test pothole",
          description: "Testing the hazard API",
          category: "pothole",
          severity: "high",
          location: {
            latitude: 12.9716,
            longitude: 77.5946
          },
          reportedBy: "test-user-id"
        })
      }
    );

    console.log("HTTP Status:", response.status);
    console.log("Response:", await response.text());
  } catch (error) {
    console.error("Error details:", error);
    console.error("Cause:", error.cause);
  }
}

testHazard();