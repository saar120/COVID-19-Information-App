//--------------------- Data Creation---------------------

const apis = {
  proxy: "https://intense-mesa-62220.herokuapp.com/",
  countryAPI: "https://restcountries.herokuapp.com/api/v1/",
  covidAPI: "https://corona-api.com/countries/",
  covidGlobal: "https://corona-api.com/timeline",
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
  } catch (error) {
    console.error(error);
  }
};

// Get data for worldwide to show on site load
const getGlobalData = async () => {
  try {
    const { data } = await axios.get(apis.covidGlobal);
    covidData.global = [];
    for (let i = 0; i < 30; i++) {
      covidData.global.push({ date: data.data[i].date, confirmed: data.data[i].confirmed });
    }
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
ctx.fillStyle = "#c7e2b2";
let myChart;

function generateChart(continent, checkFor) {
  if (myChart) myChart.destroy();
  const data = {
    labels: [],
    datasets: [],
  };

  const config = {
    type: "bar",
    data: data,
    options: {
      maintainAspectRatio: false,
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
          reverse: true,
          ticks: {
            autoSkip: true,
          },
        },
        y: {
          ticks: {
            callback: function (label, index, labels) {
              return label / 1000 + "k";
            },
            scaleLabel: {
              display: true,
              labelString: "1k = 1000",
            },
          },
          beginAtZero: false,
        },
      },
    },
  };

  //check if it is first chart on load and set
  if (continent == undefined && checkFor == undefined) {
    config.options.plugins.title.text = "30 Days Total Confirmed Worldwide";
    config.type = "line";
    config.options.scales.y.beginAtZero = true;
    covidData.global.forEach((date) => {
      data.labels.push(date.date);
    });
    data.datasets.push(createLoadCharDataSet());
  } else {
    // update chart according to data
    data.datasets.push(createChartDataSet(continent, checkFor));
    config.options.plugins.title.text = continent.toUpperCase();
    countriesData[continent].forEach((country) => {
      if (covidData[country.code]) {
        data.labels.push(shortenString(covidData[country.code].name));
      }
    });
  }
  myChart = new Chart(ctx, config);
}

function createChartDataSet(continent, checkFor) {
  const dataSet = {
    data: [],
    label: checkFor,
    fill: true,
    borderColor: "#000",
    backgroundColor: "#092532",
  };
  countriesData[continent].forEach((country) => {
    if (covidData[country.code]) {
      dataSet.data.push(covidData[country.code].latest_data[checkFor]);
    }
  });
  return dataSet;
}

function createLoadCharDataSet() {
  const dataSet = {
    data: [],
    label: "Confirmed",
    fill: true,
    borderColor: "#000",
  };
  covidData.global.forEach((date) => {
    dataSet.data.push(date.confirmed);
  });
  return dataSet;
}

function shortenString(str) {
  return str.length > 15 ? str.substr(0, 15 - 1) + "..." : str;
}

//------------------------------------------

// check if continent already clicked to prevent rewriting of data.
const checkIfClicked = (targetContinent, checkFor) => {
  if (!currentContinent) return;
  if (continentsClicked.includes(targetContinent)) {
    console.log("%cNow from storage", "color: green; background: yellow; font-size: 20px");
    drawChartAndBtn(targetContinent, checkFor);
    return;
  }
  getCovidDataByContinent(targetContinent).then(() => drawChartAndBtn(targetContinent, checkFor));
};

const createButton = (code) => {
  const btn = document.createElement("button");
  btn.classList.add("sml", "btn");
  btn.setAttribute("data-code", code.code);
  btn.textContent = covidData[code.code].name;
  return btn;
};

const countriesButtons = (targetContinent) => {
  const countriesBtnContainer = document.querySelector(".dropdown-menu");
  countriesBtnContainer.innerHTML = "";
  countriesBtnContainer.appendChild(createSearchInput());
  inputListener();
  countriesData[targetContinent].forEach((country) => {
    if (covidData[country.code]) {
      countriesBtnContainer.appendChild(createButton(country));
    }
  });
};

function drawChartAndBtn(targetContinent, checkFor) {
  generateChart(targetContinent, checkFor);
  countriesButtons(targetContinent);
}
const regionStatusBtn = document.querySelectorAll(".select-btn");
let currentContinent;
let currentStatus;

//event listeners

window.onload = () => {
  getCountriesData();
  getGlobalData().then(() => generateChart());
};

regionStatusBtn.forEach((button) => {
  button.addEventListener("click", (e) => {
    buttonHandler(e);
    checkIfClicked(currentContinent, currentStatus);
  });
});

// set value to currentContinent or currentStatus depending on the selected button
function buttonHandler(e) {
  if (e.target.dataset.status) {
    currentStatus = e.target.dataset.status;
  } else {
    currentContinent = e.target.dataset.region;
    showCountriesContainer();
  }
  clearAllPicked(e);
  e.target.classList.add("picked");
}

function showCountriesContainer() {
  document.querySelector(".countries-section").classList.add("shown");
}

function clearAllPicked(e) {
  Array.from(e.target.parentElement.children).forEach((child) => {
    child.classList.remove("picked");
  });
}

// -------------------------------------Individual Country Data-----------------------------------

document.addEventListener("click", (e) => {
  const isCountryBtn = e.target.matches("[data-code]");
  if (!isCountryBtn) return;
  updateDataHolders(e);
  e.target.closest("[data-dropdown]").classList.toggle("active");
});

function updateDataHolders(e) {
  const dataHolders = document.querySelectorAll(".num-data");
  const currentCountry = e.target.dataset.code;
  dataHolders.forEach((holder) => {
    holder.textContent = covidData[currentCountry].latest_data[holder.dataset.type];
  });
  document.querySelector(".link").textContent = covidData[currentCountry].name;
}
// -------------------------------------dropdown------------------------------------------------

document.addEventListener("click", (e) => {
  const isDropdown = e.target.matches("[data-dropdown-button]");
  if (!isDropdown && e.target.closest("[data-dropdown]") != null) return;
  let currentDropdown;
  if (isDropdown) {
    currentDropdown = e.target.closest("[data-dropdown]");
    currentDropdown.classList.toggle("active");
  }

  document.querySelectorAll("[data-dropdown]").forEach((dropdown) => {
    if (dropdown === currentDropdown) return;
    dropdown.classList.remove("active");
  });
});

// -------------------------------------Search Box For Dropdown---------------------------------
function createSearchInput() {
  const input = document.createElement("input");
  input.type = "text";
  input.classList.add("search-input", "sml");
  input.placeholder = "Search...";
  return input;
}

function searchCountry(e) {
  const countries = document.querySelectorAll("[data-code]");
  const input = e.target.value.toLowerCase();
  for (let i = 0; i < countries.length; i++) {
    if (countries[i].textContent.toLowerCase().indexOf(input) > -1) {
      countries[i].style.display = "";
    } else {
      countries[i].style.display = "none";
    }
  }
}

function inputListener() {
  document.querySelector(".search-input").addEventListener("input", (e) => {
    searchCountry(e);
  });
}
