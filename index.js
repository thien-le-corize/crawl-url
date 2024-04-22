const { app, BrowserWindow } = require("electron");
const express = require("express");
const puppeteer = require("puppeteer");
const bodyParser = require("body-parser");
const expressApp = express();
const PORT = 3000;

expressApp.use(express.urlencoded({ extended: true }));
expressApp.use(express.static("public"));
expressApp.use(bodyParser.json());
expressApp.get("/api/test", (req, res) => {
  res.send("Hoàn thành!");
});

expressApp.post("/api/search", async (req, res) => {
  const payload = req.body;
  console.log("payload", payload);
  const item = payload;
  try {
    const proxyServer = payload.proxy;
    if (proxyServer) {
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          "--proxy-server=" + proxyServer,
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

      console.log("batdautiemkiem", item.url1, item.url2);
      await stepSearchKeyWord(
        page,
        item.tukhoa,
        item.url1,
        item.url2,
        item.timeoutCT,
        item.speedCT
      );
      await browser.close();
      res.send("Hoàn thành!");
    } else {
      const browser = await puppeteer.launch({
        headless: true, // Set to true if you don't want to see the browser UI
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

      console.log("batdautiemkiem", item.url1, item.url2);
      await stepSearchKeyWord(
        page,
        item.tukhoa,
        item.url1,
        item.url2,
        item.timeoutCT,
        item.speedCT
      );
      await browser.close();
      res.send("Hoàn thành!");
    }
  } catch (error) {
    console.error("Lỗi:", error);
    res.status(500).send("Đã xảy ra lỗi!");
  }
});
const stepSearchKeyWord = async (
  pagePur,
  keyword,
  domain,
  subdomain,
  timeoutCT,
  speedCT
) => {
  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(
    keyword
  )}`;
  await pagePur.goto(googleUrl);
  const timeTriHoan = 1000 * timeoutCT;
  const tocDoScroll = 1000 * speedCT;
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

  async function scrollPageMain(tocDoScroll, timeTriHoan) {
    await pagePur.evaluate(
      async (tocDoScroll, timeTriHoan) => {
        await new Promise((resolve, reject) => {
          var windowHeight = window.innerHeight;
          var totalHeight = 0;
          var distance = 100;
          var targetPosition = Math.max(
            0,
            (document.body.scrollHeight - windowHeight) / 2
          ); // Tính vị trí giữa trang
          var timer = setInterval(() => {
            var scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= targetPosition) {
              clearInterval(timer);
              setTimeout(resolve, timeTriHoan); // Thêm độ trễ ở đây, ví dụ 1000ms (1 giây)
            } else if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              resolve();
            }
          }, tocDoScroll);
        });
      },
      tocDoScroll,
      timeTriHoan
    );
  }

  async function findUrl(searchResults, domain, subdomain) {
    let found = false;
    if (domain.endsWith("/")) {
      domain = url.slice(0, -1);
    }
    if (subdomain.endsWith("/")) {
      subdomain = subdomain.slice(0, -1);
    }

    console.log("searchResults", searchResults);
    for (const result of searchResults) {
      const link = await result.evaluate((node) => node.innerText);
      console.log("ketqua", link);
      if (link.includes(domain)) {
        await result.click();
        await pagePur
          .waitForSelector("div.rc", { timeout: 2000 })
          .catch(() => {});
        await scrollPageMain(tocDoScroll, timeTriHoan);
        let searchNext = await pagePur.$$("a");
        for (const result of searchNext) {
          const links = await result.evaluate((node) => node.href);
          console.log("ketquaCheck", links, "sub", subdomain);
          if (links.includes(subdomain)) {
            console.log("datimthay", links);
            await result.click();
            await pagePur
              .waitForSelector("div.rc", { timeout: 2000 })
              .catch(() => {});
            await scrollPageMain(tocDoScroll, timeTriHoan);
            return;
          }
        }
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
    found = await findUrl(searchResults, domain, subdomain);
    if (!found) {
      // If no results found, scroll the page and load more results
      await scrollPage();
    }
    return;
  }
};

expressApp.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});
// expressApp.listen(PORT, "0.0.0.0", () => {
//   console.log(`Server listening on port ${PORT}`);
// });
