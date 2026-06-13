import puppeteer from "puppeteer";

for (const url of ["http://localhost:5173/", "http://localhost:8081/"]) {
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await page.goto(url, { waitUntil: "networkidle0", timeout: 15000 });
    await new Promise((r) => setTimeout(r, 2000));
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log(`\n=== ${url} ===`);
    console.log("BODY:", bodyText.slice(0, 150) || "(empty)");
    console.log("ERRORS:", errors.slice(0, 3).join(" | ") || "none");
  } catch (e) {
    console.log(`\n=== ${url} === FAILED:`, e.message);
  }
  await browser.close();
}
