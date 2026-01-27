import fs from "fs";

const token = process.env.BMC_API_TOKEN;
if (!token) {
  throw new Error("BMC_API_TOKEN is not set in environment variables.");
}

// Fetch from BMC (Works locally!)
fetch("https://developers.buymeacoffee.com/api/v1/supporters", {
  headers: { Authorization: `Bearer ${token}` },
})
  .then((res) => res.json())
  .then((data) => {
    // Save to a local file
    fs.writeFileSync("donations.json", JSON.stringify(data.data, null, 2));
    console.log("Data fetched successfully!");
  });
