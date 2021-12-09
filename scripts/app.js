//--------------------- Data Creation---------------------

const apis = {
  proxy: "https://intense-mesa-62220.herokuapp.com/",
  countryAPI: "https://restcountries.herokuapp.com/api/v1/",
  covidAPI: "https://corona-api.com/countries/",
};

const covidData = { statuses: ["confirmed", "deaths", "recovered", "critical"] };
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
      covidArr.push(axios.get(apis.covidAPI + country.code));
    });
    //only uses valid results that returns from the promise.
    const results = await Promise.all(covidArr.map((p) => p.catch((e) => e)));
    const validResults = results.filter((result) => !(result instanceof Error));

    validResults.forEach((country) => {
      const { data } = country.data;
      covidData[data.code] = {
        name: data.name,
        latest_data: data.latest_data,
      };
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
  const data = {
    labels: [],
    datasets: [],
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
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          grid: {
            offset: true,
          },
          stacked: false,
          beginAtZero: true,
          ticks: {
            autoSkip: false,
          },
        },
      },
    },
  };

  data.datasets.push(createChartDataSet(continent, checkFor));

  config.options.plugins.title.text = continent.toUpperCase();
  countriesData[continent].forEach((country) => {
    if (covidData[country.code]) {
      data.labels.push(covidData[country.code].name);
    }
  });
  myChart = new Chart(ctx, config);
}

function createChartDataSet(continent, checkFor) {
  const bgColor = ["rgb(57, 121, 219)", "rgb(107, 102, 102)", "rgb(41, 198, 78)", "rgb(229, 73, 73)"];
  const dataSet = {
    data: [],
    label: checkFor,
    fill: true,
    borderColor: "#000",
    backgroundColor: bgColor[0],
  };
  countriesData[continent].forEach((country) => {
    if (covidData[country.code]) {
      dataSet.data.push(covidData[country.code].latest_data[checkFor]);
    }
  });
  return dataSet;
}

// check if continent already clicked to prevent rewriting of data.
const checkIfClicked = (e) => {
  const targetContinent = e.target.dataset.region;
  console.log(targetContinent);
  if (continentsClicked.includes(targetContinent)) {
    console.log("%cNow from storage", "color: green; background: yellow; font-size: 20px");
    generateChart(targetContinent, "confirmed");
    return;
  }
  getCovidDataByContinent(targetContinent).then(() => generateChart(targetContinent, "confirmed"));
};

const regionButtons = document.querySelectorAll(".region-btn");
const statusButtons = document.querySelectorAll(".status-btn");
//event listeners
window.onload = getCountriesData;
regionButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    checkIfClicked(event);
    statusButtons.forEach((button) => (button.disabled = false));
  });
});
