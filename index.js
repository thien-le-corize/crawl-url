const express = require("express");
const puppeteer = require("puppeteer");
const bodyParser = require("body-parser");
const app = express();
const PORT = 3001;

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(bodyParser.json());
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.post("/search", async (req, res) => {
  const payload = req.body;
  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: [
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-setuid-sandbox",
        "--no-first-run",
        "--no-sandbox",
        "--no-zygote",
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
    });
    const page = await browser.newPage();
    if (Array.isArray(payload)) {
      for (const item of payload) {
        console.log("batdautiemkiem", item.url);
        await stepSearchKeyWord(page, item.tukhoa, item.url);
      }
    }
    await browser.close();
    res.send("Hoàn thành!");
  } catch (error) {
    console.error("Lỗi:", error);
    res.status(500).send("Đã xảy ra lỗi!");
  }
});
const stepSearchKeyWord = async (pagePur, keyword, domain) => {
  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(
    keyword
  )}`;
  await pagePur.goto(googleUrl);

  // Function to scroll the page to load more results
  async function scrollPage() {
    await pagePur.evaluate(async () => {
      await new Promise((resolve, reject) => {
        var totalHeight = 0;
        var distance = 100;
        var timer = setInterval(() => {
          var scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }

  async function findUrl(searchResults, domain) {
    let found = false;
    console.log("searchResults", searchResults);
    for (const result of searchResults) {
      const link = await result.evaluate((node) => node.innerText);
      console.log("ketqua", link);
      if (link.includes(domain)) {
        await result.click();
        await pagePur
          .waitForSelector("div.rc", { timeout: 2000 })
          .catch(() => {});
        await scrollPage();
        // Additional actions on the target page if needed
        return; // Exit the function after clicking the first result containing the specified domain
      }
      found = true;
    }
    return found;
  }

  while (true) {
    await pagePur.waitForSelector("div.rc", { timeout: 1000 }).catch(() => {});
    await scrollPage();
    let searchResults = await pagePur.$$("cite");

    let found = false;
    found = await findUrl(searchResults, domain);
    if (!found) {
      // If no results found, scroll the page and load more results
      await scrollPage();
    }
    return;
  }
};

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});
