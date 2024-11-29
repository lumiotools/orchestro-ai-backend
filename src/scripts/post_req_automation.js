import fs from 'fs';

const companyContactFormsData = JSON.parse(
    // fs.readFileSync("./failed_companies.json", "utf-8")
    fs.readFileSync("../data/contact_forms_scrape_manual_2.json", "utf-8")
  );

// const goodCompanies = JSON.parse(
//     fs.readFileSync("../data/contact_form_all.json", "utf-8")
// );
  const ary = [];
  console.log(companyContactFormsData.length);
  for (let i = 0; i < companyContactFormsData.length; i++) {

    // const a = goodCompanies.find(company => company.company === companyContactFormsData[i].company)
    // if (a)
    //     continue;

    const all = companyContactFormsData[i];
    console.log(all.company); 
    const name = "test";
    const company = "test.com";
    const email = "iamindian@gmail.com";
    const phone = "1234567890";
    const message = "This is a test message";
    const obj = {};
    

    if(!all.fields)
        continue;
    for (let j = 0; j < all.fields.length; j++) {
        if(all.fields[j].title.match(/\b[Nn]ame\b/)) {
            obj[all.fields[j].title] = name;
        }
        else if(all.fields[j].title.match(/e[-\s]?mail/i)) {
            obj[all.fields[j].title] = email;
        }
        else if(all.fields[j].title.match(/\b(?:[Pp]hone(?:\s+[Nn]umber)?|[Mm]obile(?:\s+[Nn]umber)?|[Tt]el(?:ephone)?|[Cc]ell(?:ular)?)\b|-(?:phone|mobile)/i)) {
            obj[all.fields[j].title] = phone;
        }
        else if(all.fields[j].type === "textarea") {
            obj[all.fields[j].title] = message;
        }
        else if(all.fields[j].type === "checkbox") {
            obj[all.fields[j].title] = "Yes";
        }
        else if(all.fields[j].title.match(/\b(?:[Cc]ompany|[Oo]rganization|[Oo]rganisation|[Bb]usiness|[Ee]mployer)\b/)) {
            obj[all.fields[j].title] = company;
        }
        else if(all.fields[j].type === "select") {
            //console.log("this is select ", all.fields[j]);
            obj[all.fields[j].title] = all.fields[j].options[0].value;
        }
        else if(all.fields[j].required === true) {
            obj[all.fields[j].title] = "sample";
        }
        
    }
    ary.push({company: all.company, inputs: obj});
}
// console.log(ary);

const successfulCompanies = [];
const failedCompanies = [];

for (const item of ary) {
  try {
    const response = await fetch('http://127.0.0.1:5000/api/v1/contact-company', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(item)
    });

    const data = await response.json();
    
    if (data.success) {
      console.log(`Successfully sent data for company ${item.company}`);
      const currentCompany = companyContactFormsData.find(company => company.company === item.company);
      successfulCompanies.push(currentCompany); 
    }
    else {
        const currentCompany = companyContactFormsData.find(company => company.company === item.company);
        failedCompanies.push(currentCompany); 
      console.log(`Failed  ${item.company}`);
    }
    console.log(item.inputs);
  } catch (error) {
    console.error(`Error for company ${item.company}:`, error);
  }
}

// Write successful companies to file
fs.writeFileSync('successful_companies.json', JSON.stringify(successfulCompanies));
fs.writeFileSync('failed_companies.json', JSON.stringify(failedCompanies));
console.log("failed ", failedCompanies.length);
console.log("successful ", successfulCompanies.length);
console.log('Successfully wrote companies to successful_companies.json and failed_companies.json');
