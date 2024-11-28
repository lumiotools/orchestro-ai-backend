export const postPageLoadScript = async (company, page) => {
  if (company === "gojitsu.com") {
    await gojitsuScript(page);
  }
};

export const gojitsuScript = async (page) => {
  page.click("[data-id='#btn1']");
};
