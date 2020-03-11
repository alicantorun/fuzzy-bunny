const puppeteer = require("puppeteer");

let browser;
let page;

// const { By, Key } = require("selenium-webdriver");
const entity = require("./entity");
const query = require("./db/query");

// selectors
const COUNTRY_SEARCH_INPUT_SELECTOR =
  "#publicRegisterManufacturerSearch > div:nth-child(2) > div:nth-child(2) > span.k-widget.k-dropdown.k-header > span > span.k-select";
const COUNTRY_SELECTOR = "#Country-list > span > input";
const COUNTRY_SELECTOR_DEUTSCHLAND = "#Country_listbox > li:nth-child(39)";
const QUERY_BTN_SELECTOR = "#btnSearchManufacturer";
const PAGE_SIZE_SELECTOR =
  "#manufacturerGrid > div > span.k-pager-sizes.k-label > span > span > span.k-select > span";
const ITEM_PAGE_SIZE_100_SELECTOR =
  "body > div:nth-child(5) > div > div.k-list-scroller > ul > li:nth-child(4)";
const BRANDS_REMAINING_TEXT_SELECTOR =
  "#manufacturerGrid > div > span.k-pager-info.k-label";
const TR_ICON_SELECTOR = " td.k-hierarchy-cell > a";
const PRODUCER_TAB_SELECTOR =
  "td:nth-child(2) > div > div > ul > li:nth-child(2)";
const BRAND_RIGHT_PAGINATE_SELECTOR =
  "#manufacturerGrid > div > a:nth-child(4) > span";

module.exports = async function(site, db, startingPoint) {
  try {
    console.log("Current Total", startingPoint);
    console.log("Launching browser");
    browser = await puppeteer.launch();
    console.log("Opening tab");
    page = await browser.newPage();
    console.log("Openning page");
    await page.goto(site);

    await page.waitForSelector(COUNTRY_SEARCH_INPUT_SELECTOR);
    await page.evaluate(
      ({ COUNTRY_SEARCH_INPUT_SELECTOR }) => {
        document.querySelector(COUNTRY_SEARCH_INPUT_SELECTOR).click();
      },
      { COUNTRY_SEARCH_INPUT_SELECTOR }
    );
    await page.$eval(COUNTRY_SELECTOR, el => (el.value = "deutschland"));
    await page.waitFor(5000);
    await page.evaluate(
      ({ COUNTRY_SELECTOR_DEUTSCHLAND }) => {
        document.querySelector(COUNTRY_SELECTOR_DEUTSCHLAND).click();
      },
      { COUNTRY_SELECTOR_DEUTSCHLAND }
    );
    await page.keyboard.press("Enter");
    await page.waitFor(5000);
    await page.evaluate(
      ({ QUERY_BTN_SELECTOR }) => {
        document.querySelector(QUERY_BTN_SELECTOR).click();
      },
      { QUERY_BTN_SELECTOR }
    );
    await page.waitFor(5000);
    await page.waitForSelector(PAGE_SIZE_SELECTOR);
    await page.waitFor(5000);
    await page.evaluate(
      ({ PAGE_SIZE_SELECTOR }) => {
        document.querySelector(PAGE_SIZE_SELECTOR).click();
      },
      { PAGE_SIZE_SELECTOR }
    );
    await page.evaluate(
      ({ ITEM_PAGE_SIZE_100_SELECTOR }) => {
        document.querySelector(ITEM_PAGE_SIZE_100_SELECTOR).click();
      },
      { ITEM_PAGE_SIZE_100_SELECTOR }
    );
    await page.waitFor(5000);
    const mainPaginateTextElement = await page.$(
      BRANDS_REMAINING_TEXT_SELECTOR
    );
    const mainPaginateText = await (
      await mainPaginateTextElement.getProperty("textContent")
    ).jsonValue();
    const mainPaginateRange = 100;
    const mainTotal = mainPaginateText.substring(
      mainPaginateText.lastIndexOf(" ") + 1
    );
    let mainNumberOfPages = Math.floor(mainTotal / mainPaginateRange);
    const startingPage =
      startingPoint >= 100 ? Math.floor(startingPoint / 100) : 0;
    mainNumberOfPages = mainNumberOfPages - startingPage + 1;
    let iteration = startingPage;
    let restarted = true;

    console.log("Count of how many iteration next is required: ", iteration);
    for (; iteration < mainNumberOfPages; iteration++) {
      if (iteration !== 0 && restarted) {
        for (let i = 0; i < iteration; i++) {
          await page.evaluate(
            ({ BRAND_RIGHT_PAGINATE_SELECTOR }) => {
              document.querySelector(BRAND_RIGHT_PAGINATE_SELECTOR).click();
            },
            { BRAND_RIGHT_PAGINATE_SELECTOR }
          );

          await page.waitFor(5000);
          console.log("Current Iteration: ", i);
        }
        console.log("Current Page :", startingPage);
      }
      restarted = false;

      // ROW ITERATOR
      try {
        for (let i = 0; i < 200; i++) {
          await page.waitFor(5000);
          console.log(" INDEX :", i);

          let currentRow = `#manufacturerGrid > table > tbody > tr:nth-child(${i +
            1})`;
          let currentHiddenRow = `#manufacturerGrid > table > tbody > tr:nth-child(${i +
            2})`;
          console.log(" PREPARING FOR CLICK :");

          await page.screenshot({ path: "loginPage.png", fullPage: true });

          await page.evaluate(
            ({ currentRow, TR_ICON_SELECTOR }) => {
              document
                .querySelector(`${currentRow} > ${TR_ICON_SELECTOR}`)
                .click();
            },
            { currentRow, TR_ICON_SELECTOR }
          );

          await page.screenshot({ path: "loginPage2.png", fullPage: true });

          await page.evaluate(
            ({ currentHiddenRow, PRODUCER_TAB_SELECTOR }) => {
              document
                .querySelector(`${currentHiddenRow} > ${PRODUCER_TAB_SELECTOR}`)
                .click();
            },
            { currentHiddenRow, PRODUCER_TAB_SELECTOR }
          );
          await page.screenshot({ path: "loginPage3.png", fullPage: true });

          await page.waitFor(3000);

          let producer = {};
          let companyName = "";
          let postalCode = "";
          let phone = "";
          let registerNumber = "";
          let street = "";
          let city = "";
          let fax = "";
          let dateOfRegistration = "";
          let addressAddition = "";
          let country = "";
          let email = "";

          try {
            const companyNameElement = await page.$(
              `${currentHiddenRow} > td:nth-child(2) > div > div > div:last-of-type > div > div > div:nth-child(1) > div:nth-child(2)`
            );

            const text = await (
              await companyNameElement.getProperty("textContent")
            ).jsonValue();
            console.log(text);

            const companyTempName = await page.evaluate(
              companyNameElement =>
                companyNameElement.textContent
                  .replace(/\s+/g, " ")
                  .trim()
                  .replace(/,/g, ""),
              companyNameElement
            );
            if (companyTempName) {
              companyName = companyTempName;
            }
            console.log("Company Name: ", companyName);
          } catch (error) {
            console.log("Company Name Error :", error);
          }

          try {
            const postalCodeElement = await page.$(
              `${currentHiddenRow} > td:nth-child(2) > div > div > div:last-of-type > div > div > div:nth-child(1) > div:nth-child(4)`
            );

            const text = await (
              await postalCodeElement.getProperty("textContent")
            ).jsonValue();
            console.log(text);

            const postalTempCode = await page.evaluate(
              postalCodeElement =>
                postalCodeElement.textContent
                  .replace(/\s+/g, " ")
                  .trim()
                  .replace(/,/g, ""),
              postalCodeElement
            );
            if (postalTempCode) {
              postalCode = postalTempCode;
            }
            console.log("Postal code: ", postalCode);
          } catch (error) {
            console.log("postal code Error :", error);
          }

          try {
            const phoneElement = await page.$(
              `${currentHiddenRow} > td:nth-child(2) > div > div > div:last-of-type > div > div > div:nth-child(1) > div:nth-child(6)`
            );

            const text = await (
              await phoneElement.getProperty("textContent")
            ).jsonValue();
            console.log(text);

            const phoneTemp = await page.evaluate(
              phoneElement =>
                phoneElement.textContent
                  .replace(/\s+/g, " ")
                  .trim()
                  .replace(/,/g, ""),
              phoneElement
            );
            if (phoneTemp) {
              phone = phoneTemp;
            }
            console.log("Phone: ", phone);
          } catch (error) {
            console.log("Phone Error :", error);
          }

          try {
            const registerNumberElement = await page.$(
              `${currentHiddenRow} > td:nth-child(2) > div > div > div:last-of-type > div > div > div:nth-child(1) > div:nth-child(8)`
            );

            const text = await (
              await registerNumberElement.getProperty("textContent")
            ).jsonValue();
            console.log(text);

            const registerNumberTemp = await page.evaluate(
              registerNumberElement =>
                registerNumberElement.textContent
                  .replace(/\s+/g, " ")
                  .trim()
                  .replace(/,/g, ""),
              registerNumberElement
            );
            if (registerNumberTemp) {
              registerNumber = registerNumberTemp;
            }
            console.log("registerNumber: ", registerNumber);
          } catch (error) {
            console.log("registerNumber Error :", error);
          }

          try {
            const streetElement = await page.$(
              `${currentHiddenRow} > td:nth-child(2) > div > div > div:last-of-type > div > div > div:nth-child(2) > div:nth-child(2)`
            );

            const text = await (
              await streetElement.getProperty("textContent")
            ).jsonValue();
            console.log(text);

            const streetTemp = await page.evaluate(
              streetElement =>
                streetElement.textContent
                  .replace(/\s+/g, " ")
                  .trim()
                  .replace(/,/g, ""),
              streetElement
            );
            if (streetTemp) {
              street = streetTemp;
            }
            console.log("street: ", street);
          } catch (error) {
            console.log("street Error :", error);
          }

          try {
            const cityElement = await page.$(
              `${currentHiddenRow} > td:nth-child(2) > div > div > div:last-of-type > div > div > div:nth-child(2) > div:nth-child(4)`
            );

            const text = await (
              await cityElement.getProperty("textContent")
            ).jsonValue();
            console.log(text);

            const cityTemp = await page.evaluate(
              cityElement =>
                cityElement.textContent
                  .replace(/\s+/g, " ")
                  .trim()
                  .replace(/,/g, ""),
              cityElement
            );
            if (cityTemp) {
              city = cityTemp;
            }
            console.log("city: ", city);
          } catch (error) {
            console.log("city Error :", error);
          }

          try {
            const faxElement = await page.$(
              `${currentHiddenRow} > td:nth-child(2) > div > div > div:last-of-type > div > div > div:nth-child(2) > div:nth-child(6)`
            );

            const text = await (
              await faxElement.getProperty("textContent")
            ).jsonValue();
            console.log(text);

            const faxTemp = await page.evaluate(
              faxElement =>
                faxElement.textContent
                  .replace(/\s+/g, " ")
                  .trim()
                  .replace(/,/g, ""),
              faxElement
            );
            if (faxTemp) {
              fax = faxTemp;
            }
            console.log("fax: ", fax);
          } catch (error) {
            console.log("fax Error :", error);
          }

          try {
            const dateOfRegistrationElement = await page.$(
              `${currentHiddenRow} > td:nth-child(2) > div > div > div:last-of-type > div > div > div:nth-child(2) > div:nth-child(8)`
            );

            const text = await (
              await dateOfRegistrationElement.getProperty("textContent")
            ).jsonValue();
            console.log(text);

            const dateOfRegistrationTemp = await page.evaluate(
              dateOfRegistrationElement =>
                dateOfRegistrationElement.textContent
                  .replace(/\s+/g, " ")
                  .trim()
                  .replace(/,/g, ""),
              dateOfRegistrationElement
            );
            if (dateOfRegistrationTemp) {
              dateOfRegistration = dateOfRegistrationTemp;
            }
            console.log("dateOfRegistration: ", dateOfRegistration);
          } catch (error) {
            console.log("dateOfRegistration Error :", error);
          }

          try {
            const addressAdditionElement = await page.$(
              `${currentHiddenRow} > td:nth-child(2) > div > div > div:last-of-type > div > div > div:nth-child(3) > div:nth-child(2)`
            );

            const text = await (
              await addressAdditionElement.getProperty("textContent")
            ).jsonValue();
            console.log(text);

            const addressAdditionTemp = await page.evaluate(
              addressAdditionElement =>
                addressAdditionElement.textContent
                  .replace(/\s+/g, " ")
                  .trim()
                  .replace(/,/g, ""),
              addressAdditionElement
            );
            if (addressAdditionTemp) {
              addressAddition = addressAdditionTemp;
            }
            console.log("addressAddition: ", addressAddition);
          } catch (error) {
            console.log("addressAddition Error :", error);
          }

          try {
            const countryElement = await page.$(
              `${currentHiddenRow} > td:nth-child(2) > div > div > div:last-of-type > div > div > div:nth-child(3) > div:nth-child(4)`
            );

            const text = await (
              await countryElement.getProperty("textContent")
            ).jsonValue();
            console.log(text);

            const countryTemp = await page.evaluate(
              countryElement =>
                countryElement.textContent
                  .replace(/\s+/g, " ")
                  .trim()
                  .replace(/,/g, ""),
              countryElement
            );
            if (countryTemp) {
              country = countryTemp;
            }
            console.log("country: ", country);
          } catch (error) {
            console.log("country Error :", error);
          }

          try {
            const emailElement = await page.$(
              `${currentHiddenRow} > td:nth-child(2) > div > div > div:last-of-type > div > div > div:nth-child(3) > div:nth-child(6)`
            );

            const text = await (
              await emailElement.getProperty("textContent")
            ).jsonValue();
            console.log(text);

            const emailTemp = await page.evaluate(
              emailElement =>
                emailElement.textContent
                  .replace(/\s+/g, " ")
                  .trim()
                  .replace(/,/g, ""),
              emailElement
            );
            if (emailTemp) {
              email = emailTemp;
            }
            console.log("email: ", email);
          } catch (error) {
            console.log("email Error :", error);
          }

          producer.company_name = companyName;
          producer.postal_code = postalCode;
          producer.phone = phone;
          producer.register_number = registerNumber;
          producer.street = street;
          producer.city = city;
          producer.fax = fax;
          producer.date_of_registration = dateOfRegistration;
          producer.address_addition = addressAddition;
          producer.country = country;
          producer.email = email;

          console.log("PRODUCER OBJECT: ", producer);

          db.run(
            `
            INSERT INTO ${query.table.producers}
            (${entity.PRODUCER.companyName}, ${entity.PRODUCER.postalCode}, ${
              entity.PRODUCER.phone
            }, ${entity.PRODUCER.registerNumber},
              ${entity.PRODUCER.street}, ${entity.PRODUCER.city}, ${
              entity.PRODUCER.fax
            }, ${entity.PRODUCER.dateOfRegistration},
              ${entity.PRODUCER.addressAddition}, ${entity.PRODUCER.country}, ${
              entity.PRODUCER.email
            },
              ${entity.PRODUCER.createdAt})
            VALUES('${producer[entity.PRODUCER.companyName]}', '${
              producer[entity.PRODUCER.postalCode]
            }', '${producer[entity.PRODUCER.phone]}', '${
              producer[entity.PRODUCER.registerNumber]
            }',
            '${producer[entity.PRODUCER.street]}', '${
              producer[entity.PRODUCER.city]
            }', '${producer[entity.PRODUCER.fax]}', '${
              producer[entity.PRODUCER.dateOfRegistration]
            }',
            '${producer[entity.PRODUCER.addressAddition]}' ,'${
              producer[entity.PRODUCER.country]
            }' ,'${producer[entity.PRODUCER.email]}',
            '${producer[entity.PRODUCER.createdAt]}')
          `,
            [],
            function(insertErr) {
              if (insertErr) {
                return console.error(insertErr.message);
              } else {
                console.log("successfully saved");
              }
            }
          );

          i++;
        }
      } catch (error) {
        console.log(error);
      }
    }
  } catch (err) {
    console.error(err.message);
  } finally {
    // free up driver
    await browser.close();
    // free up DB
    db.close(err => {
      if (err) return console.error(err.message);
      console.log("Database connection closed.");
    });
  }
};
