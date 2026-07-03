const sendTestSMS = async () => {
  const url = "https://www.fast2sms.com/dev/bulkV2";
  const apiKey = "V1fDRXXLCway7u4WDGDTUJnjsKZB4dPMjJvabNYKKnLgVaFJGG3wGm2zrCzv";
  const phoneNumber = "9022632511";
  
  // Custom template incorporating all requested customer, order, and brand URL details
  const message = "Dear Krishna, your order #TEST1234 of Rs. 1500 has been successfully placed. Thank you for shopping with chashmaly.in!";

  const params = new URLSearchParams();
  params.append("route", "q");
  params.append("message", message);
  params.append("numbers", phoneNumber);
  params.append("language", "english");
  params.append("flash", "0");

  console.log("Sending personalized brand-inclusive test message...");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "authorization": apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache"
      },
      body: params
    });

    const data = await response.json();
    console.log("Fast2SMS API Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error sending SMS:", error);
  }
};

sendTestSMS();
