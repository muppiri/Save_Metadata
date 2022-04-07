import puppeteer from "puppeteer";
import { createConnection } from "typeorm";
import { Papers } from "./entity/paper";
import axios from "axios";
import cheerio from "cheerio";
import { getRepository } from "typeorm";

const searchTerms = [
  "Hashing+techniques+cpu",
  "Hashing+techniques+on+single+core+cpu",
  "join+algorithms+sql",
  "hash+join+algorithm",
  "Hashing+techniques",
  "hashing+algorithms",
  "Relational+database+Join",
  "Hash+Join",
  "general+hashing+techniques+join+relational",
  "hash+techniques+dbms",
  "hash+dbms",
  "relational+join",
  "join+extensions",
  "relational+join+dbms",
  "join+algorithms",
  "relation+join+extension",
  "relational+join+algorithm",
  "nested+loop+join",
  "nested+loop+join+algorithm",
  "block+nested+loop+join+algorithm",
  "block+nested+loop+join",
  "sort+merge+join+algorithm",
  "sort+merge+join",
];

const keyWords = [
  "Relational Join ",
  "Hashing techniques cpu",
  "Hashing techniques on single core cpu",
  "Hashing techniques ",
  "hashing algorithms",
  "hash join",
  "joins",
  "join",
  "relational join",
  "Relational database",
  "hash-join",
  "general hashing techniques join relational",
  "hash techniques dbms",
  "hash dbms",
  "data base join",
  "relational join",
  "join extensions",
  "relational join dbms",
  "relational join techniques",
  "join algorithm",
  "join algorithms",
  "relational join algorithm",
  "relation join extension",
  "dbms",
  "nested",
  "nested loop",
  "nested-loop-join",
  "nested loop join",
  "index nested loop join",
  "nested loop join algorithm",
  "block-nested-loop",
  "block nested loop",
  "block nested loop join",
  "block nested loop join algorithm",
  "sort merge",
  "sort merge join",
  "sort-merge-join",
  "sort merge join algorithm",
  "merge join",
  "database",
  "databases",
  "join algorithm",
  "join algorithms",
  "rdbms",
  "rdbms join",
  "rdbms joins",
  "rdbms join algorithms",
  "algorithm",
  "cpu",
  "gpu",
];

const main = () => {
  createConnection({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "xyz13!#XYZ",
    database: "research",
    entities: [Papers],
    synchronize: true,
    logging: false,
  });
  savePapersData();
};

const savePapersData = async () => {
  searchTerms.forEach(async (srhtrm) => {
    const response = axios.get(
      // "https://dblp.org/search/publ/api?q=nested+loop+join&h=1000&format=json"
      // "https://dblp.org/search/publ/api?q=Modeling+and+Analysis+of+a+Parallel+Nested+Loop+Join+on+Cluster+Architectures&h=1000&format=json"
      "https://dblp.org/search/publ/api?q=" + srhtrm + "&h=1000&format=json"
    );

    var newData = (await response).data.result.hits.hit;
    var sDirect = false;

    // const jsonData = JSON.parse(newData);
    console.log(newData.length);

    for (let index = 0; index < newData.length; index++) {
      const element = newData[index];
      const author: string[] = [];
      if (element.info.year >= 2002) {
        if (element.info.doi) {
          const browser = await puppeteer.launch();
          const page = await browser.newPage();
          await page.goto("https://doi.org/" + element.info.doi);

          // const resultLinks = await page.$$(".gs_rt a");
          // resultLinks[0].click();
          // await page.waitForNavigation();
          page.waitForTimeout(5000);
          try {
            const content = await page.content();
            const $ = cheerio.load(content);
            var matches = keyWords.filter((keyWord) =>
              $.text().toLowerCase().includes(keyWord)
            );
          } catch (error) {
            var matches: string[] = [];
            sDirect = true;
          }

          if (matches.length) {
            console.log(sDirect);
            const authors = element.info.authors.author;
            let authorsJoined = "";
            if (Array.isArray(authors)) {
              authors.forEach(function (value: any) {
                author.push(value.text);
              });
              authorsJoined = author.join(",");
            } else {
              authorsJoined = authors.text;
            }

            var obj = {
              title: element.info.title,
              authors: authorsJoined,
              venue: element.info.venue,
              doi: element.info.doi,
              publishedYear: element.info.year,
              abstract: "",
            };

            const paper = getRepository(Papers).create(obj);
            await getRepository(Papers).save(paper);
          } else if (sDirect) {
            const scienceDirectResponse = await axios.get(
              "https://api.elsevier.com/content/article/doi/" +
                element.info.doi +
                "?httpAccept=application/json&apiKey=4077a192e53f9b2705fa56882858f314"
            );
            const data =
              scienceDirectResponse.data["full-text-retrieval-response"];
            // console.log(data.originalText);
            const matches = keyWords.filter((keyWord) =>
              data.originalText.toLowerCase().includes(keyWord)
            );
          }
          console.log("https://doi.org/" + element.info.doi);
          console.log(matches);
          browser.close();
        } else if (
          element.info.ee &&
          !element.info.ee.toLowerCase().includes("pdf") &&
          !sDirect
        ) {
          const browser = await puppeteer.launch();
          const page = await browser.newPage();
          await page.goto(element.info.ee);
          page.waitForTimeout(6000);
          const content = await page.content();
          const $ = cheerio.load(content);
          const matches = keyWords.filter((keyWord) =>
            $.text().toLowerCase().includes(keyWord)
          );

          if (matches.length) {
            const authors = element.info.authors.author;
            let authorsJoined = "";
            if (Array.isArray(authors)) {
              authors.forEach(function (value: any) {
                author.push(value.text);
              });
              authorsJoined = author.join(",");
            } else {
              authorsJoined = authors.text;
            }

            var obj = {
              title: element.info.title,
              authors: authorsJoined,
              venue: element.info.venue,
              doi: element.info.doi,
              publishedYear: element.info.year,
              abstract: "",
            };
            const paper = getRepository(Papers).create(obj);
            await getRepository(Papers).save(paper);
          }
          console.log(element.info.ee);
          console.log(matches);
          browser.close();
        } else {
          const browser = await puppeteer.launch();
          const page = await browser.newPage();
          await page.goto("https://scholar.google.com/");
          await page.waitForSelector('input[aria-label="Search"]', {
            visible: true,
          });
          await page.type(
            'input[aria-label="Search"]',
            " Parallel sort-merge object-oriented collection join algorithms."
          );
          await Promise.all([
            page.waitForNavigation(),
            page.keyboard.press("Enter"),
          ]);

          await page.waitForSelector(".gs_rt", { visible: true });
          const content = await page.content();
          const $ = cheerio.load(content);
          let firstElem = $(".gs_rt a[href]").get()[0];
          console.log($(firstElem).attr("href"));
          const href = $(firstElem).attr("href");
          browser.close();

          if (!$(firstElem)?.attr("href")?.toLowerCase().includes("pdf")) {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            href && (await page.goto(href));
            page.waitForTimeout(5000);
            try {
              const content = await page.content();
              const $ = cheerio.load(content);
              var matches = keyWords.filter((keyWord) =>
                $.text().toLowerCase().includes(keyWord)
              );
            } catch (error) {
              var matches: string[] = [];
              sDirect = true;
            }

            browser.close();

            if (matches.length || sDirect) {
              let check = "";
              const authors = element.info.authors.author;
              let authorsJoined = "";
              if (Array.isArray(authors)) {
                authors.forEach(function (value: any) {
                  author.push(value.text);
                });
                authorsJoined = author.join(",");
              } else {
                authorsJoined = authors.text;
              }

              if (sDirect) {
                check = "Manual Check";
              }
              var obj = {
                title: element.info.title,
                authors: authorsJoined,
                venue: element.info.venue,
                doi: element.info.doi,
                publishedYear: element.info.year,
                abstract: check,
              };

              const paper = getRepository(Papers).create(obj);
              await getRepository(Papers).save(paper);
            }
          } else {
            // browser.close();
            const authors = element.info.authors.author;
            let authorsJoined = "";
            if (Array.isArray(authors)) {
              authors.forEach(function (value: any) {
                author.push(value.text);
              });
              authorsJoined = author.join(",");
            } else {
              authorsJoined = authors.text;
            }

            var obj = {
              title: element.info.title,
              authors: authorsJoined,
              venue: element.info.venue,
              doi: element.info.doi,
              publishedYear: element.info.year,
              abstract: "Manual Check",
            };
            const paper = getRepository(Papers).create(obj);
            await getRepository(Papers).save(paper);
          }
        }
        console.log(element.info.title);
      }
    }
  });
};

main();
