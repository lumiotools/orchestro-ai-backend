export const postPageLoadScript = async (company, page) => {
  if (company === "gojitsu.com") {
    await gojitsuScript(page);
  }
};

export const feedbackCheckScript = async (company, page) => {
  if (company === "frayt.com") {
    await fraytScript(page);
  }
};

const gojitsuScript = async (page) => {
  await page.click("[data-id='#btn1']");
};

const fraytScript = async (page) => {
  await page.waitForFunction(() => {
    return window.location.href.includes("#demo-success"), { timeout: 10000 };
  });
};
