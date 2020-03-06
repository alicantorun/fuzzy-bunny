const { By, Key } = require("selenium-webdriver");
const entity = require("./entity");
const query = require("./db/query");
// selectors
const COUNTRY_SEARCH_INPUT_SELECTOR = "span.k-icon.k-i-arrow-60-down";
const COUNTRY_INPUT = "#Country-list span.k-list-filter input.k-textbox";
const QUERY_BTN_SELECTOR = "#btnSearchManufacturer";
const TABLE_ROW_SELECTOR = "tr.k-master-row";
const PAGE_SIZE_SELECTOR =
  "span.k-pager-sizes.k-label span.k-widget.k-dropdown.k-header";
const ITEM_PAGE_SIZE_100_SELECTOR = 'li.k-item[data-offset-index="3"]';
const TR_ICON_SELECTOR = "td.k-hierarchy-cell a.k-icon";
const DETAIL_ROW_SELECTOR = "tr.k-detail-row";
const DETAIL_ROW_TABLE_SELECTOR = ".detailGrid.k-grid.k-widget table";
const BRANDS_REMAINING_TEXT_SELECTOR = "span.k-pager-info.k-label";
const DETAIL_ROW_PRODUCER_SELECTOR = ".detailContainer";
const DETAIL_ROW_PRODUCER_COL_SELECTOR =
  "div.row.pt-1.lineMinHeight.textWrapping";
const BRAND_RIGHT_PAGINATE_SELECTOR = ".k-icon.k-i-arrow-60-right";
const MAIN_PAGINATE_SELECTOR =
  ".k-pager-wrap.k-grid-pager.k-widget.k-floatwrap";

module.exports = async function(
  pageLoadTimeout,
  site,
  country,
  db,
  startingPoint,
  driver
) {
  try {
    await driver.manage().setTimeouts({ pageLoad: pageLoadTimeout });
    await driver.get(site);
    await driver.findElement(By.css(COUNTRY_SEARCH_INPUT_SELECTOR)).click();
    await driver.sleep(1000);
    await driver.findElement(By.css(COUNTRY_INPUT)).click();
    await driver.sleep(1000);
    await driver.findElement(By.css(COUNTRY_INPUT)).sendKeys(country);
    await driver.sleep(1000);
    await driver.findElement(By.css(COUNTRY_INPUT)).sendKeys(Key.ENTER);
    await driver.sleep(1000);
    await driver.findElement(By.css(QUERY_BTN_SELECTOR)).click();
    await driver.sleep(5000);
    await driver.findElement(By.css(PAGE_SIZE_SELECTOR)).click();
    await driver.sleep(1000);
    await driver.findElement(By.css(ITEM_PAGE_SIZE_100_SELECTOR)).click();
    await driver.sleep(10000);
    const mainPaginateElement = await driver.findElement(
      By.css(MAIN_PAGINATE_SELECTOR)
    );
    const mainPaginateTextElement = await mainPaginateElement.findElement(
      By.css(BRANDS_REMAINING_TEXT_SELECTOR)
    );
    // const mainPaginateText = (await mainPaginateTextElement.getText()).trim();
    // const mainPaginateParts = mainPaginateText.split(" ");
    const mainPaginateRange = 100;
    const mainTotal = 159027;
    let mainNumberOfPages = Math.floor(mainTotal / mainPaginateRange);
    let restarted = false;
    // use startingPoint to navigate to the related page
    let i;
    if (startingPoint === 0) {
      i = 0;
    } else {
      restarted = true;
      // navigate to the page
      const startingPage = Math.floor(startingPoint / 100) + 1;
      for (let a = 1; a < startingPage; a++) {
        await mainPaginateElement
          .findElement(By.css(BRAND_RIGHT_PAGINATE_SELECTOR))
          .click();
        await driver.sleep(10000);
      }
      // set i
      i = startingPoint % 100;
      mainNumberOfPages = mainNumberOfPages - startingPage + 1;
    }
    for (let iteration = 0; iteration < mainNumberOfPages; iteration++) {
      if (iteration !== 0) {
        await mainPaginateElement
          .findElement(By.css(BRAND_RIGHT_PAGINATE_SELECTOR))
          .click();
        await driver.sleep(10000);
        restarted = false;
        i = 0;
      }
      const rows = await driver.findElements(By.css(TABLE_ROW_SELECTOR));
      let initialStep;
      if (restarted) initialStep = 0;
      for (; i < rows.length; i++) {
        const currentStep = restarted ? initialStep++ : i;
        const tr = rows[i];
        const icon = tr.findElement(By.css(TR_ICON_SELECTOR));
        // expand row
        await icon.click();
        // wait for ajax
        await driver.sleep(5000);
        // extract brand
        const detailRowTable = (
          await driver.findElements(By.css(DETAIL_ROW_TABLE_SELECTOR))
        )[currentStep];
        const detailRows = await driver.findElements(
          By.css(DETAIL_ROW_SELECTOR)
        );
        const currentDetailRow = detailRows[currentStep];
        // decide if we need to paginate brands
        const brandsRemainingElement = await currentDetailRow.findElement(
          By.css(BRANDS_REMAINING_TEXT_SELECTOR)
        );
        const brandsRemainingText = (
          await brandsRemainingElement.getText()
        ).trim();
        const parts = brandsRemainingText.split(" ");
        const paginateRange = parts[2];
        const total = parts[4];
        const numberOfPages =
          paginateRange === total ? 1 : Math.floor(total / paginateRange) + 1;
        let producer = {};
        let brands = [];
        for (let n = 0; n < numberOfPages; n++) {
          if (n !== 0) {
            await currentDetailRow
              .findElement(By.css(BRAND_RIGHT_PAGINATE_SELECTOR))
              .click();
            await driver.sleep(5000);
          }
          const detailRowTableRows = await detailRowTable.findElements(
            By.css("tr")
          );
          if (detailRowTableRows.length > 1) {
            for (let j = 1; j < detailRowTableRows.length; j++) {
              let columns = await detailRowTableRows[j].findElements(
                By.css("td")
              );
              let brand = {};
              brand[entity.BRAND.brandName] = (
                await columns[entity.BRAND.brandNameIndex].getText()
              ).trim();
              brand[entity.BRAND.dateOfRegistration] = (
                await columns[entity.BRAND.dateOfRegistrationIndex].getText()
              ).trim();
              brand[entity.BRAND.endDate] = (
                await columns[entity.BRAND.endDateIndex].getText()
              ).trim();
              brands.push(brand);
            }
          }
        }
        // extract producer
        const lis = (await currentDetailRow.findElements(By.css("li")))[1];
        const producerIcon = (await lis.findElements(By.css("span")))[1];
        await producerIcon.click();
        await driver.sleep(2000);
        let producerContainer;
        if (i === 0) {
          producerContainer = await driver.findElement(
            By.css(DETAIL_ROW_PRODUCER_SELECTOR)
          );
        } else {
          producerContainer = (
            await driver.findElements(By.css(DETAIL_ROW_PRODUCER_SELECTOR))
          )[currentStep];
        }
        const viewCols = await producerContainer.findElements(
          By.css("div.col-xl-4")
        );
        for (let k = 0; k < viewCols.length; k++) {
          let cols = await viewCols[k].findElements(
            By.css(DETAIL_ROW_PRODUCER_COL_SELECTOR)
          );
          if (k === 0) {
            producer[entity.PRODUCER.companyName] = (
              await cols[entity.PRODUCER.companyNameIndex].getText()
            ).trim();
            producer[entity.PRODUCER.postalCode] = (
              await cols[entity.PRODUCER.postalCodeIndex].getText()
            ).trim();
            producer[entity.PRODUCER.phone] = (
              await cols[entity.PRODUCER.phoneIndex].getText()
            ).trim();
            producer[entity.PRODUCER.registerNumber] = (
              await cols[entity.PRODUCER.registerNumberIndex].getText()
            ).trim();
          } else if (k === 1) {
            producer[entity.PRODUCER.street] = (
              await cols[entity.PRODUCER.streetIndex].getText()
            ).trim();
            producer[entity.PRODUCER.city] = (
              await cols[entity.PRODUCER.cityIndex].getText()
            ).trim();
            producer[entity.PRODUCER.fax] = (
              await cols[entity.PRODUCER.faxIndex].getText()
            ).trim();
            producer[entity.PRODUCER.dateOfRegistration] = (
              await cols[entity.PRODUCER.dateOfRegistrationIndex].getText()
            ).trim();
          } else if (k === 2) {
            producer[entity.PRODUCER.addressAddition] = (
              await cols[entity.PRODUCER.addressAdditionIndex].getText()
            ).trim();
            producer[entity.PRODUCER.country] = (
              await cols[entity.PRODUCER.countryIndex].getText()
            ).trim();
            producer[entity.PRODUCER.email] = (
              await cols[entity.PRODUCER.emailIndex].getText()
            ).trim();
          }
          producer[entity.PRODUCER.createdAt] = new Date();
        }
        // save producer to db
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
              // get the last insert id
              const savedProducerId = this.lastID;
              // save brands to db
              for (let m = 0; m < brands.length; m++) {
                db.run(
                  `
                  INSERT INTO ${query.table.brands}
                  (${entity.BRAND.brandName}, ${
                    entity.BRAND.dateOfRegistration
                  }, ${entity.BRAND.endDate},
                    ${entity.BRAND.producerId}, ${entity.BRAND.createdAt})
                  VALUES('${brands[m][entity.BRAND.brandName]}', '${
                    brands[m][entity.BRAND.dateOfRegistration]
                  }',
                  '${
                    brands[m][entity.BRAND.endDate]
                  }', ${savedProducerId}, '${new Date()}')
                `,
                  [],
                  function(brandInsertError) {
                    if (brandInsertError) {
                      return console.error(brandInsertError.message);
                    }
                  }
                );
              }
            }
          }
        );
        await driver.sleep(5000);
        // collapse row
        await icon.click();
      }
    }
  } catch (err) {
    console.error(err.message);
  } finally {
    // free up driver
    await driver.quit();
    // free up DB
    db.close(err => {
      if (err) return console.error(err.message);
      console.log("Database connection closed.");
    });
  }
};
