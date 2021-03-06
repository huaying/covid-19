import Head from "next/head";
import fetch from "isomorphic-unfetch";
import moment from "moment";

import World from "../components/world";
import CountryBanner from "../components/country-banner";
import Rank from "../components/rank";
import News from "../components/news";
import { HistoryProvider } from "../providers/history";

const GA_TRACKING_ID = process.env.GA_TRACKING_ID;
export default function Index({ data }) {
  const taiwan = data.countries.find(c => c.country === "Taiwan");
  const china = data.countries.find(c => c.country === "China");
  return (
    <>
      <Head>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <title>Covid-19 新冠肺炎快訊</title>
        <link rel="shortcut icon" href="https://app.thoth.tw/favicon.ico" />

        <meta name="title" content="Covid-19 新冠肺炎快訊" />
        <meta
          name="description"
          content="Coronavirus - 新冠肺炎相關訊息，包含了台灣、世界確診數據以及相關新聞"
        />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://covid19.thoth.tw/" />
        <meta property="og:title" content="Covid-19 新冠肺炎快訊" />
        <meta
          property="og:description"
          content="Coronavirus - 新冠肺炎相關訊息，包含了台灣、世界確診數據以及相關新聞"
        />
        <meta
          property="og:image"
          content="https://covid19.thoth.tw/covid19.jpg"
        />
        {GA_TRACKING_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
            ></script>
            <script
              dangerouslySetInnerHTML={{
                __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_TRACKING_ID}');
            `
              }}
            />
          </>
        )}
        <link
          href="https://use.fontawesome.com/releases/v5.12.1/css/svg-with-js.css"
          rel="stylesheet"
        ></link>
      </Head>
      <HistoryProvider>
        <div className="app">
          <div className="container">
            <div className="header">
              <h1>Covid-19</h1>
              <div className="date">日期: {moment().format("YYYY-MM-DD")}</div>
            </div>
            <div className="stats">
              <div className="left">
                <div>
                  <World world={data.summary} />
                </div>
                <div>
                  <CountryBanner country={taiwan} icon={true} />
                </div>
                <div>
                  <CountryBanner country={china} icon={true} />
                </div>
              </div>
              <div className="right">
                <Rank countries={data.countries} />
              </div>
            </div>
            <div className="news">
              <News news={data.news} />
            </div>
            <div className="footer">
              © 2020 Powered by &nbsp;
              <img src="https://app.thoth.tw/favicon.ico" />
              &nbsp;
              <a href="https://thoth.tw">thoth.tw</a>
            </div>
          </div>
        </div>
      </HistoryProvider>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css?family=Poppins:200,300,400,500,600,700&display=swap");
        body {
          background: #fcfcfc;
          width: 100%;
          margin: 0;
          font-family: "Poppins", system-ui, "Helvetica Neue", Helvetica, Arial,
            sans-serif;

          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        a {
          color: orange;
        }
        a:hover {
          color: red;
          transition: all 0.3s;
        }
      `}</style>
      <style jsx>{`
        .app {
          max-width: 1000px;
          margin: auto;
        }
        .container {
          margin: 0 20px;
        }
        .header {
          display: flex;
          flex: 1;
          align-items: center;
        }
        .header h1 {
          font-size: 32px;
          font-weight: 300;
        }
        .header .date {
          margin-left: auto;
          color: #5f5f5f;
        }
        .stats {
          display: flex;
        }
        .left {
          flex: 0 0 350px;
        }
        .left > * {
          margin-right: 20px;
          margin-bottom: 20px;
        }
        .right {
          flex: 1;
        }
        .news {
          margin-top: 20px;
        }
        .footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 20px 10px;
        }
        .footer img {
          height: 16px;
          margin-right: 5px;
        }
        @media (max-width: 820px) {
          .stats {
            flex-direction: column;
          }

          .left > * {
            margin-right: 0;
          }
        }
      `}</style>
    </>
  );
}

Index.getInitialProps = async function() {
  const res = await fetch(process.env.INTERNAL_API_URL);
  const data = await res.json();

  return { data };
};
