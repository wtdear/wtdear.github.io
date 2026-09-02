"use strict";


/* =========================================================
   OPENWEATHERMAP
   =========================================================

   Replace the value below with your API key.

   IMPORTANT:
   This frontend implementation exposes the API key
   in the browser. For a public production application,
   it is better to proxy requests through a backend.
   ========================================================= */

const OPENWEATHER_API_KEY = "1bdd7a2409032456052df20aaa6205b7";


/* =========================================================
   CONFIG
   ========================================================= */

const API_BASE = "https://api.openweathermap.org";

const STORAGE_CITY = "weather_last_city";
const STORAGE_UNIT = "weather_unit";

const DEFAULT_UNIT = "C";


/* =========================================================
   DOM
   ========================================================= */

const weatherForm = document.getElementById("weatherForm");

const cityInput = document.getElementById("cityInput");

const searchButton = document.getElementById("searchButton");

const clearButton = document.getElementById("clearButton");

const locationButton = document.getElementById("locationButton");

const locationMainButton =
    document.getElementById("locationMainButton");

const statusElement =
    document.getElementById("status");

const emptyState =
    document.getElementById("emptyState");

const weatherResult =
    document.getElementById("weatherResult");

const unitButtons =
    document.querySelectorAll(".unit-button");


/* Current weather */

const weatherCity =
    document.getElementById("weatherCity");

const weatherDate =
    document.getElementById("weatherDate");

const weatherCondition =
    document.getElementById("weatherCondition");

const weatherIcon =
    document.getElementById("weatherIcon");

const weatherTemperature =
    document.getElementById("weatherTemperature");

const weatherFeels =
    document.getElementById("weatherFeels");

const weatherHumidity =
    document.getElementById("weatherHumidity");

const weatherWind =
    document.getElementById("weatherWind");

const weatherWindDirection =
    document.getElementById("weatherWindDirection");

const weatherPressure =
    document.getElementById("weatherPressure");

const weatherSunrise =
    document.getElementById("weatherSunrise");

const weatherSunset =
    document.getElementById("weatherSunset");

const forecastGrid =
    document.getElementById("forecastGrid");

const lastUpdated =
    document.getElementById("lastUpdated");


/* =========================================================
   STATE
   ========================================================= */

let currentUnit =
    localStorage.getItem(STORAGE_UNIT) || DEFAULT_UNIT;

let currentWeatherData = null;

let currentLocationData = null;

let isLoading = false;


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", initialize);


function initialize() {

    setActiveUnit(currentUnit);

    cityInput.addEventListener(
        "input",
        handleInput
    );

    weatherForm.addEventListener(
        "submit",
        handleSearch
    );

    clearButton.addEventListener(
        "click",
        clearSearch
    );

    locationButton.addEventListener(
        "click",
        useCurrentLocation
    );

    locationMainButton.addEventListener(
        "click",
        useCurrentLocation
    );

    unitButtons.forEach((button) => {

        button.addEventListener(
            "click",
            () => {
                changeUnit(button.dataset.unit);
            }
        );

    });


    /*
     * Load the last searched city.
     */

    const lastCity =
        localStorage.getItem(STORAGE_CITY);

    if (lastCity) {
        cityInput.value = lastCity;
        updateClearButton();
    }
}


/* =========================================================
   SEARCH
   ========================================================= */

async function handleSearch(event) {

    event.preventDefault();

    if (isLoading) {
        return;
    }

    const city =
        cityInput.value.trim();

    if (!city) {

        showStatus(
            "Please enter a city name.",
            "error"
        );

        return;
    }

    await loadWeatherByCity(city);
}


async function loadWeatherByCity(city) {

    if (!validateApiKey()) {
        return;
    }

    setLoading(true);

    showStatus("Searching for city...");

    try {

        /*
         * First:
         * Convert city name into coordinates.
         */

        const location =
            await geocodeCity(city);

        currentLocationData = location;

        showStatus(
            `Loading weather for ${location.name}...`
        );


        /*
         * Second:
         * Request 5 day / 3 hour forecast.
         */

        const weather =
            await fetchForecast(
                location.lat,
                location.lon
            );

        currentWeatherData = weather;

        renderWeather(
            weather,
            location
        );


        /*
         * Save city.
         */

        localStorage.setItem(
            STORAGE_CITY,
            location.name
        );

        cityInput.value =
            location.name;

        updateClearButton();

        showStatus(
            "Weather successfully loaded.",
            "success"
        );

        setTimeout(() => {
            clearStatus();
        }, 2500);

    } catch (error) {

        console.error(
            "Weather error:",
            error
        );

        handleWeatherError(error);

    } finally {

        setLoading(false);
    }
}


/* =========================================================
   GEOCODING
   ========================================================= */

async function geocodeCity(city) {

    const url =
        `${API_BASE}/geo/1.0/direct?` +
        `q=${encodeURIComponent(city)}` +
        `&limit=1` +
        `&appid=${OPENWEATHER_API_KEY}`;


    const response =
        await fetch(url);


    if (!response.ok) {

        throw new Error(
            "GEOCODING_REQUEST_FAILED"
        );
    }


    const locations =
        await response.json();


    if (!locations.length) {

        throw new Error(
            "CITY_NOT_FOUND"
        );
    }


    return locations[0];
}


/* =========================================================
   WEATHER API
   ========================================================= */

async function fetchForecast(
    latitude,
    longitude
) {

    const url =
        `${API_BASE}/data/2.5/forecast?` +
        `lat=${latitude}` +
        `&lon=${longitude}` +
        `&units=metric` +
        `&lang=en` +
        `&appid=${OPENWEATHER_API_KEY}`;


    const response =
        await fetch(url);


    if (!response.ok) {

        if (response.status === 401) {
            throw new Error(
                "INVALID_API_KEY"
            );
        }

        throw new Error(
            "WEATHER_REQUEST_FAILED"
        );
    }


    return await response.json();
}


/* =========================================================
   GEOLOCATION
   ========================================================= */

function useCurrentLocation() {

    if (!navigator.geolocation) {

        showStatus(
            "Geolocation is not supported by your browser.",
            "error"
        );

        return;
    }


    if (isLoading) {
        return;
    }


    setLoading(true);

    showStatus(
        "Getting your location..."
    );


    navigator.geolocation.getCurrentPosition(

        async (position) => {

            try {

                const latitude =
                    position.coords.latitude;

                const longitude =
                    position.coords.longitude;


                showStatus(
                    "Loading weather..."
                );


                const location =
                    await reverseGeocode(
                        latitude,
                        longitude
                    );


                currentLocationData =
                    location;


                const weather =
                    await fetchForecast(
                        latitude,
                        longitude
                    );


                currentWeatherData =
                    weather;


                renderWeather(
                    weather,
                    location
                );


                localStorage.setItem(
                    STORAGE_CITY,
                    location.name
                );


                cityInput.value =
                    location.name;

                updateClearButton();


                showStatus(
                    "Location weather loaded.",
                    "success"
                );


                setTimeout(() => {
                    clearStatus();
                }, 2500);

            } catch (error) {

                console.error(
                    "Geolocation weather error:",
                    error
                );

                handleWeatherError(error);

            } finally {

                setLoading(false);
            }
        },


        (error) => {

            setLoading(false);

            switch (error.code) {

                case error.PERMISSION_DENIED:

                    showStatus(
                        "Location permission was denied.",
                        "error"
                    );

                    break;

                case error.POSITION_UNAVAILABLE:

                    showStatus(
                        "Your location is currently unavailable.",
                        "error"
                    );

                    break;

                case error.TIMEOUT:

                    showStatus(
                        "Location request timed out.",
                        "error"
                    );

                    break;

                default:

                    showStatus(
                        "Unable to determine your location.",
                        "error"
                    );
            }
        },


        {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000
        }
    );
}


/* =========================================================
   REVERSE GEOCODING
   ========================================================= */

async function reverseGeocode(
    latitude,
    longitude
) {

    const url =
        `${API_BASE}/geo/1.0/reverse?` +
        `lat=${latitude}` +
        `&lon=${longitude}` +
        `&limit=1` +
        `&appid=${OPENWEATHER_API_KEY}`;


    const response =
        await fetch(url);


    if (!response.ok) {

        throw new Error(
            "REVERSE_GEOCODING_FAILED"
        );
    }


    const locations =
        await response.json();


    if (!locations.length) {

        throw new Error(
            "LOCATION_NOT_FOUND"
        );
    }


    return locations[0];
}


/* =========================================================
   RENDER WEATHER
   ========================================================= */

function renderWeather(
    data,
    location
) {

    const current =
        data.list[0];


    /*
     * Show result.
     */

    emptyState.hidden = true;

    weatherResult.hidden = false;


    /*
     * Location.
     */

    weatherCity.textContent =
        formatLocation(location);


    /*
     * Date.
     */

    weatherDate.textContent =
        formatFullDate(
            new Date()
        );


    /*
     * Description.
     */

    const description =
        current.weather?.[0]?.description ||
        "Unknown";


    weatherCondition.textContent =
        description;


    /*
     * Main temperature.
     */

    weatherTemperature.textContent =
        formatTemperature(
            current.main.temp
        );


    weatherFeels.textContent =
        `Feels like ${formatTemperature(
            current.main.feels_like
        )}`;


    /*
     * Weather icon.
     */

    weatherIcon.innerHTML =
        getWeatherIcon(
            current.weather?.[0]?.id
        );


    /*
     * Details.
     */

    weatherHumidity.textContent =
        `${current.main.humidity}%`;


    weatherWind.textContent =
        formatWind(
            current.wind.speed
        );


    weatherWindDirection.textContent =
        getWindDirection(
            current.wind.deg
        );


    weatherPressure.textContent =
        `${current.main.pressure} hPa`;


    /*
     * Sunrise / sunset.
     */

    const timezone =
        data.city?.timezone || 0;


    weatherSunrise.textContent =
        formatTime(
            data.city.sunrise,
            timezone
        );


    weatherSunset.textContent =
        formatTime(
            data.city.sunset,
            timezone
        );


    /*
     * Forecast.
     */

    renderForecast(
        data.list
    );


    /*
     * Last updated.
     */

    lastUpdated.textContent =
        `Updated ${new Date().toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        )}`;
}


/* =========================================================
   FORECAST
   ========================================================= */

function renderForecast(list) {

    forecastGrid.innerHTML = "";


    const days =
        groupForecastByDay(list);


    days
        .slice(0, 5)
        .forEach((day) => {

            const card =
                createForecastCard(day);

            forecastGrid.appendChild(card);
        });
}


/* =========================================================
   GROUP FORECAST BY DAY
   ========================================================= */

function groupForecastByDay(list) {

    const grouped = {};


    list.forEach((item) => {

        const date =
            item.dt_txt.split(" ")[0];


        if (!grouped[date]) {

            grouped[date] = {

                date,

                minTemp:
                    item.main.temp,

                maxTemp:
                    item.main.temp,

                weatherId:
                    item.weather?.[0]?.id || 800,

                description:
                    item.weather?.[0]?.description || "",

                /*
                 * Used to prefer daytime weather.
                 */

                selectedHour:
                    -1
            };
        }


        grouped[date].minTemp =
            Math.min(
                grouped[date].minTemp,
                item.main.temp
            );


        grouped[date].maxTemp =
            Math.max(
                grouped[date].maxTemp,
                item.main.temp
            );


        const hour =
            Number(
                item.dt_txt
                    .split(" ")[1]
                    .split(":")[0]
            );


        /*
         * Prefer weather around noon.
         */

        const distance =
            Math.abs(12 - hour);


        if (
            grouped[date].selectedHour === -1 ||
            distance <
            Math.abs(
                12 -
                grouped[date].selectedHour
            )
        ) {

            grouped[date].weatherId =
                item.weather?.[0]?.id || 800;

            grouped[date].description =
                item.weather?.[0]?.description || "";

            grouped[date].selectedHour =
                hour;
        }

    });


    return Object.values(grouped);
}


/* =========================================================
   FORECAST CARD
   ========================================================= */

function createForecastCard(day) {

    const card =
        document.createElement("article");


    card.className =
        "forecast-card";


    const date =
        new Date(
            `${day.date}T12:00:00`
        );


    card.innerHTML = `

        <div class="forecast-day">
            ${formatWeekday(date)}
        </div>

        <div class="forecast-date">
            ${formatShortDate(date)}
        </div>

        <div class="forecast-icon">
            ${getWeatherIcon(day.weatherId)}
        </div>

        <div class="forecast-description">
            ${escapeHTML(day.description)}
        </div>

        <div class="forecast-temperatures">

            ${formatTemperature(day.maxTemp)}

            <span class="forecast-low">
                ${formatTemperature(day.minTemp)}
            </span>

        </div>
    `;


    return card;
}


/* =========================================================
   TEMPERATURE
   ========================================================= */

function formatTemperature(
    celsius
) {

    if (
        typeof celsius !== "number" ||
        Number.isNaN(celsius)
    ) {
        return "--°";
    }


    if (currentUnit === "F") {

        const fahrenheit =
            (celsius * 9 / 5) + 32;


        return `${Math.round(
            fahrenheit
        )}°F`;
    }


    return `${Math.round(
        celsius
    )}°C`;
}


/* =========================================================
   WIND
   ========================================================= */

function formatWind(
    metersPerSecond
) {

    if (
        typeof metersPerSecond !== "number"
    ) {
        return "--";
    }


    if (currentUnit === "F") {

        /*
         * m/s -> mph
         */

        const mph =
            metersPerSecond * 2.23694;


        return `${mph.toFixed(1)} mph`;
    }


    return `${metersPerSecond.toFixed(1)} m/s`;
}


/* =========================================================
   WIND DIRECTION
   ========================================================= */

function getWindDirection(
    degrees
) {

    if (
        typeof degrees !== "number"
    ) {
        return "--";
    }


    const directions = [
        "N",
        "NE",
        "E",
        "SE",
        "S",
        "SW",
        "W",
        "NW"
    ];


    const index =
        Math.round(degrees / 45) % 8;


    return directions[index];
}


/* =========================================================
   WEATHER ICONS
   ========================================================= */

function getWeatherIcon(
    weatherId
) {

    if (!weatherId) {
        return '<i class="fas fa-cloud"></i>';
    }


    /*
     * Thunderstorm
     */

    if (
        weatherId >= 200 &&
        weatherId < 300
    ) {
        return '<i class="fas fa-cloud-bolt"></i>';
    }


    /*
     * Drizzle
     */

    if (
        weatherId >= 300 &&
        weatherId < 400
    ) {
        return '<i class="fas fa-cloud-rain"></i>';
    }


    /*
     * Rain
     */

    if (
        weatherId >= 500 &&
        weatherId < 600
    ) {

        if (
            weatherId === 511
        ) {
            return '<i class="fas fa-snowflake"></i>';
        }

        return '<i class="fas fa-cloud-showers-heavy"></i>';
    }


    /*
     * Snow
     */

    if (
        weatherId >= 600 &&
        weatherId < 700
    ) {
        return '<i class="fas fa-snowflake"></i>';
    }


    /*
     * Atmosphere
     */

    if (
        weatherId >= 700 &&
        weatherId < 800
    ) {
        return '<i class="fas fa-smog"></i>';
    }


    /*
     * Clear
     */

    if (
        weatherId === 800
    ) {
        return '<i class="fas fa-sun"></i>';
    }


    /*
     * Clouds
     */

    if (
        weatherId > 800
    ) {
        return '<i class="fas fa-cloud-sun"></i>';
    }


    return '<i class="fas fa-cloud"></i>';
}


/* =========================================================
   TIME
   ========================================================= */

function formatTime(
    unixTimestamp,
    timezoneOffset
) {

    if (
        !unixTimestamp
    ) {
        return "--:--";
    }


    /*
     * OpenWeather gives Unix timestamp
     * in UTC. We apply the city's timezone.
     */

    const date =
        new Date(
            (unixTimestamp + timezoneOffset) * 1000
        );


    return date.toISOString()
        .slice(11, 16);
}


/* =========================================================
   DATE FORMATTING
   ========================================================= */

function formatFullDate(
    date
) {

    return date.toLocaleDateString(
        "en-US",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );
}


function formatWeekday(
    date
) {

    return date.toLocaleDateString(
        "en-US",
        {
            weekday: "short"
        }
    );
}


function formatShortDate(
    date
) {

    return date.toLocaleDateString(
        "en-US",
        {
            day: "numeric",
            month: "short"
        }
    );
}


/* =========================================================
   LOCATION
   ========================================================= */

function formatLocation(
    location
) {

    const parts = [];


    if (location.name) {
        parts.push(location.name);
    }


    if (location.state) {
        parts.push(location.state);
    }


    if (location.country) {
        parts.push(location.country);
    }


    return parts.join(", ");
}


/* =========================================================
   UNITS
   ========================================================= */

function changeUnit(
    unit
) {

    if (
        unit !== "C" &&
        unit !== "F"
    ) {
        return;
    }


    currentUnit = unit;


    localStorage.setItem(
        STORAGE_UNIT,
        unit
    );


    setActiveUnit(unit);


    /*
     * Re-render existing weather
     * without making another API request.
     */

    if (
        currentWeatherData &&
        currentLocationData
    ) {

        renderWeather(
            currentWeatherData,
            currentLocationData
        );
    }
}


function setActiveUnit(
    unit
) {

    unitButtons.forEach(
        (button) => {

            button.classList.toggle(
                "active",
                button.dataset.unit === unit
            );
        }
    );
}


/* =========================================================
   SEARCH INPUT
   ========================================================= */

function handleInput() {

    updateClearButton();
}


function updateClearButton() {

    clearButton.hidden =
        cityInput.value.length === 0;
}


function clearSearch() {

    cityInput.value = "";

    updateClearButton();

    cityInput.focus();

    clearStatus();
}


/* =========================================================
   LOADING
   ========================================================= */

function setLoading(
    loading
) {

    isLoading = loading;


    if (loading) {

        searchButton.classList.add(
            "loading"
        );

        searchButton.innerHTML =
            `
                <span class="loading-spinner"></span>
                <span>Loading</span>
            `;

        locationButton.disabled = true;

    } else {

        searchButton.classList.remove(
            "loading"
        );

        searchButton.innerHTML =
            `
                <i class="fas fa-magnifying-glass"></i>
                <span>Search</span>
            `;

        locationButton.disabled = false;
    }
}


/* =========================================================
   STATUS
   ========================================================= */

function showStatus(
    message,
    type = ""
) {

    statusElement.textContent =
        message;


    statusElement.className =
        "status";


    if (type) {
        statusElement.classList.add(type);
    }
}


function clearStatus() {

    statusElement.textContent = "";

    statusElement.className =
        "status";
}


/* =========================================================
   API KEY
   ========================================================= */

function validateApiKey() {

    if (
        !OPENWEATHER_API_KEY ||
        OPENWEATHER_API_KEY ===
        "YOUR_API_KEY_HERE"
    ) {

        showStatus(
            "OpenWeatherMap API key is not configured.",
            "error"
        );

        return false;
    }


    return true;
}


/* =========================================================
   ERROR HANDLING
   ========================================================= */

function handleWeatherError(
    error
) {

    switch (error.message) {

        case "CITY_NOT_FOUND":

            showStatus(
                "City not found. Try another name.",
                "error"
            );

            break;


        case "INVALID_API_KEY":

            showStatus(
                "Invalid OpenWeatherMap API key.",
                "error"
            );

            break;


        case "GEOCODING_REQUEST_FAILED":

            showStatus(
                "Unable to search for this city.",
                "error"
            );

            break;


        case "WEATHER_REQUEST_FAILED":

            showStatus(
                "Unable to load weather data.",
                "error"
            );

            break;


        case "LOCATION_NOT_FOUND":

            showStatus(
                "Unable to determine your city.",
                "error"
            );

            break;


        default:

            showStatus(
                "Something went wrong. Please try again.",
                "error"
            );
    }
}


/* =========================================================
   SECURITY / HTML
   ========================================================= */

function escapeHTML(
    value
) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}