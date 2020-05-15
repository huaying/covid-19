/*
  Ref: https://github.com/NovelCOVID/API
*/

const axios = require("axios");
const cheerio = require("cheerio");
const db = require("quick.db");
const moment = require("moment");
const { logError, logException } = require("./sentry");
const { keyBy, mergeWith, orderBy } = require("lodash");

async function getLoadedHtml() {
  const response = await axios.get(
    "https://www.worldometers.info/coronavirus/"
  );
  if (response.status !== 200) {
    console.log("ERROR");
  }

  return cheerio.load(response.data);
}

function getLastUpdated(html) {
  try {
    const lastUpdatedText = html(".content-inner div:contains('Last updated')")
      .text()
      .replace("Last updated: ", "");
    const time = moment.utc(lastUpdatedText, "MMMM-DD, YYYY, HH:mm");

    if (time.isValid()) {
      return +time;
    }
    logError(`Failed to parse last updated: ${lastUpdatedText}`);
  } catch (err) {
    logException(err);
  }
  return Date.now(); // fallback logic
}

async function fetchSummary() {
  const html = await getLoadedHtml();
  const summary = {};

  html(".maincounter-number").filter((i, el) => {
    let count = el.children[0].next.children[0].data || "0";
    count = parseInt(count.replace(/,/g, "") || "0", 10);
    // first one is
    if (i === 0) {
      summary.cases = count;
    } else if (i === 1) {
      summary.deaths = count;
    } else {
      summary.recovered = count;
    }
  });

  summary.updated = getLastUpdated(html);
  db.set("summary", summary);
  console.log("Summary Updated", moment().format());
}

function parseCountryName(cell) {
  let country =
    cell.children[0].data ||
    cell.children[0].children[0].data ||
    // country name with link has another level
    cell.children[0].children[0].children[0].data ||
    cell.children[0].children[0].children[0].children[0].data ||
    "";
  country = country.trim();
  if (country.length === 0) {
    // parse with hyperlink
    country = cell.children[0].next.children[0].data || "";
  }
  return country.trim() || "";
}

function parseNumber(cell) {
  let num = cell.children.length != 0 ? cell.children[0].data : "";
  try {
    return parseInt(num.trim().replace(/,/g, ""), 10);
  } catch {
    return null;
  }
}

function parseCountryTable(table, colMap) {
  const countriesTableCells = table
    .children("tbody")
    .children("tr:not(.total_row):not(.total_row_world)")
    .children("td");

  const totalColumns = table.children("thead").children("tr").children("th")
    .length;
  const countries = [];
  // minus totalColumns to skip last row, which is total
  for (let i = 0; i < countriesTableCells.length; i += totalColumns) {
    const country = {};
    for (let [colIdx, field] of Object.entries(colMap)) {
      const cell = countriesTableCells[i + parseInt(colIdx)];
      country[field] =
        field === "country" ? parseCountryName(cell) : parseNumber(cell);
    }
    countries.push(country);
  }
  return countries;
}

async function fetchCountries() {
  const html = await getLoadedHtml();
  const todayTable = html("table#main_table_countries_today");

  const todayData = parseCountryTable(todayTable, {
    1: "country",
    2: "cases",
    3: "todayCases",
    4: "deaths",
    5: "todayDeaths",
    6: "recovered",
    8: "critica"
  });
  const yesterdayTable = html("table#main_table_countries_yesterday");
  const yesterdayData = parseCountryTable(yesterdayTable, {
    1: "country",
    3: "yesterdayCases",
    5: "yesterdayDeaths"
  });

  let countries = Object.values(
    mergeWith(
      keyBy(todayData, "country"),
      keyBy(yesterdayData, "country"),
      (a, b) => ({ ...a, ...b })
    )
  );

  countries = orderBy(countries, "cases", "desc");

  db.set("countries", countries);
  console.log("Countries Updated", moment().format());
}

function objFieldRename(data, to, from) {
  data[to] = data[from];
  delete data[from];
}

async function fetchHistory() {
  const response = await axios.get(
    "https://pomber.github.io/covid19/timeseries.json"
  );

  const { data } = response;
  objFieldRename(data, "Taiwan", "Taiwan*");
  objFieldRename(data, "S. Korea", "Korea, South");
  objFieldRename(data, "USA", "US");
  objFieldRename(data, "UK", "United Kingdom");
  db.set("history", data);
  console.log("History Updated", moment().format());
}

module.exports = {
  fetchSummary,
  fetchCountries,
  fetchHistory
};
