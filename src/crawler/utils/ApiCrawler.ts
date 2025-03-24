
class ApiCrawler {
  public async crawlApi() {
    const apiUrl = "https://tapi.knowyourself.cc/platform/getWebsiteArticleList";
    const params = { offset: 10, limit: 10, type: "xinlijiankang" };
    const headers = {
      "Accept": `application/json, text/plain, */*`,
      "Content-Type": `application/json;charset=utf-8`,
      "Origin": `https://www.knowyourself.cc`,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
    };
    try {
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: headers,
        body: JSON.stringify(params),
      });
      console.log(response);
      return response;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}

export default ApiCrawler;