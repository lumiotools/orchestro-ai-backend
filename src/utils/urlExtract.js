export const extractFormattedUrl = (url) => {
  // Remove protocol (http:// or https://)
  let formattedUrl = url.replace(/^https?:\/\//, "");

  // Remove www.
  formattedUrl = formattedUrl.replace(/^www\./, "");

  formattedUrl =
    formattedUrl.slice(-1) === "/" ? formattedUrl.slice(0, -1) : formattedUrl;

  formattedUrl = formattedUrl.replaceAll("/", "_");

  return formattedUrl;
};

const extractDomain = (url) => {
  // Remove protocol (http:// or https://)
  let domain = url.replace(/^https?:\/\//, "");

  // Remove www.
  domain = domain.replace(/^www\./, "");

  // Remove everything after the first slash
  domain = domain.split("/")[0];

  // Remove any query parameters or hash
  domain = domain.split("?")[0].split("#")[0];

  return domain;
};

export default extractDomain;
