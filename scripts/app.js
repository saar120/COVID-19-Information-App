//--------------------- Data Creation---------------------

const apis = {
  proxy: "https://intense-mesa-62220.herokuapp.com/",
  countryAPI: "https://restcountries.herokuapp.com/api/v1/",
  covidAPI: "https://corona-api.com/countries/",
};

const covidData = {};
const countriesData = {};
const continentsClicked = [];

// Create and object that contains all countries by continent.
const getCountriesData = async () => {
  try {
    const { data } = await axios.get(apis.proxy + apis.countryAPI);
    data.forEach((country) => {
      region = country.region.toLowerCase();
      countriesData[region]
        ? countriesData[region].push({ code: country.cca2 })
        : (countriesData[region] = [{ code: country.cca2 }]);
    });
    // countriesData.europe.splice(40, 1); // bug - removes XK
  } catch (error) {
    console.error(error);
  }
};

// Get countries covid data by continent and loads it to the database.
const getCovidDataByContinent = async (continent) => {
  try {
    continentsClicked.push(continent);
    let covidArr = [];
    countriesData[continent].forEach((country) => {
      covidArr.push(axios.get(apis.proxy + apis.covidAPI + country.code));
    });
    //only uses valid results that returns from the promise.
    const results = await Promise.all(covidArr.map((p) => p.catch((e) => e)));
    const validResults = results.filter((result) => !(result instanceof Error));

    validResults.forEach((country) => {
      const { data } = country.data;
      covidData[data.code] = { name: data.name, latest_data: data.latest_data };
    });
  } catch (error) {
    console.error(error);
  }
};

//--------------------- Chart Creation---------------------
const ctx = document.getElementById("myChart").getContext("2d");
let myChart;

function generateChart(continent, checkFor) {
  if (myChart) myChart.destroy();
  let labels = [];
  const data = {
    labels,
    datasets: [
      {
        data: [],
        label: "",
        fill: true,
        borderColor: "#000",
      },
    ],
  };

  const config = {
    type: "line",
    data: data,
    options: {
      plugins: {
        title: {
          display: true,
          text: "",
          font: { size: 25 },
        },
      },
      scales: {
        x: {
          stacked: false,
          beginAtZero: true,
          ticks: {
            autoSkip: false,
          },
        },
      },
    },
  };
  data.datasets[0].label = checkFor;
  config.options.plugins.title.text = continent.toUpperCase();
  countriesData[continent].forEach((country) => {
    console.log(country);
    labels.push(covidData[country.code].name);
    data.datasets[0].data.push(covidData[country.code].latest_data[checkFor]);
  });
  myChart = new Chart(ctx, config);
}

// check if continent already clicked to prevent rewriting of data.
const checkIfClicked = (e) => {
  const targetContinent = e.target.className;
  console.log(targetContinent);
  if (continentsClicked.includes(targetContinent)) {
    console.log("%cNow from storage", "color: green; background: yellow; font-size: 30px");
    generateChart(targetContinent, "confirmed");
    return;
  }
  getCovidDataByContinent(targetContinent).then(() => generateChart(targetContinent, "confirmed"));
};

const setDataToChart = (continent) => {
  countriesData[continent].forEach((country) => {
    console.log(covidData[country.code]);
  });
};

const button = document.querySelectorAll("button");
//event listeners
window.onload = getCountriesData;
button.forEach((button) => {
  button.addEventListener("click", (e) => {
    checkIfClicked(e);
  });
});
