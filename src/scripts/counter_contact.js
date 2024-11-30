import fs from 'fs';

const companyContactFormsData = JSON.parse(
    fs.readFileSync("../data/contact_form_all.json", "utf-8")
  );

  console.log(companyContactFormsData.length);