const sendTest2Factor = async () => {
  const apiKey = "f834d855-538e-11f1-9800-0200cd936042";
  const url = `https://2factor.in/API/V1/${apiKey}/ADDON_SERVICES/SEND/TSMS`;
  const phoneNumber = "9022632511";
  
  const params = new URLSearchParams();
  params.append("From", "CHASHM");
  params.append("To", phoneNumber);
  params.append("TemplateName", "YOUR_TEMPLATE_NAME"); // Placing placeholder template name
  params.append("VAR1", "Customer");
  params.append("VAR2", "12345");

  console.log("Sending test SMS via 2Factor TSMS...");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache"
      },
      body: params
    });

    const rawText = await response.text();
    console.log("2Factor API Response:", rawText);
  } catch (error) {
    console.error("Error sending 2Factor SMS:", error);
  }
};

sendTest2Factor();
