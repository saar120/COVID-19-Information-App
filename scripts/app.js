// Data Creation

const apis = {
  proxy: "https://intense-mesa-62220.herokuapp.com/",
  countryAPI: "https://restcountries.herokuapp.com/api/v1/",
  covidAPI: "https://corona-api.com/countries/",
};

const covidData = {};
const countriesData = {};

const getCountriesData = async () => {
  try {
    const { data } = await axios.get(apis.proxy + apis.countryAPI);
    data.forEach((country) => {
      countriesData[country.region]
        ? countriesData[country.region].push({ code: country.cca2 })
        : (countriesData[country.region] = [{ code: country.cca2 }]);
    });
  } catch (error) {
    console.error(error);
  }
};

const getCovidDataByContinent = async (continent) => {
  try {
    let covidArr = [];
    countriesData[continent].forEach((country) => {
      covidArr.push(axios.get(apis.proxy + apis.covidAPI + country.code));
    });
    covidArr = await Promise.all(covidArr);
    covidArr.forEach((country) => {
      const { data } = country.data;
      covidData[data.code] = { name: data.name, latest_data: data.latest_data };
    });
  } catch (error) {
    console.error(error);
  }
};
