'use strict';

var Beaufort = [{
    windFrom: 0,
    windTo: 2,
    force: 0
}, {
    windFrom: 2,
    windTo: 6,
    force: 1
}, {
    windFrom: 6,
    windTo: 12,
    force: 2
}, {
    windFrom: 12,
    windTo: 20,
    force: 3
}, {
    windFrom: 20,
    windTo: 29,
    force: 4
}, {
    windFrom: 29,
    windTo: 39,
    force: 5
}, {
    windFrom: 39,
    windTo: 50,
    force: 6
}, {
    windFrom: 50,
    windTo: 62,
    force: 7
}, {
    windFrom: 62,
    windTo: 75,
    force: 8
}, {
    windFrom: 75,
    windTo: 89,
    force: 9
}, {
    windFrom: 89,
    windTo: 103,
    force: 10
}, {
    windFrom: 103,
    windTo: 118,
    force: 11
}, {
    windFrom: 118,
    windTo: 10000,
    force: 12
}];

document.addEventListener('DOMContentLoaded', function () {

    window.scroll({
        left: 0,
        top: 0
    });

    var sun = document.querySelector('#bg-sun');
    var search = document.querySelector('#search');
    var searchButton = document.querySelector('#searchButton');
    var day1Element = document.querySelector('#day1');
    var day2Element = document.querySelector('#day2');
    var day3Element = document.querySelector('#day3');
    var cityLink = document.querySelector('#city');
    var backButton = document.querySelector('#back');
    var loader = document.querySelector('#loader');

    var gpsBox = document.querySelector('#gps-box');
    var gpsButton = document.querySelector('#gps');

    var loading = false;

    var iconsDay1 = document.querySelector('#icons-day-1');
    var iconsDay2 = document.querySelector('#icons-day-2');
    var iconsDay3 = document.querySelector('#icons-day-3');

    var windDay1 = document.querySelector('#wind-day-1');
    var windDay2 = document.querySelector('#wind-day-2');
    var windDay3 = document.querySelector('#wind-day-3');

    var weatherIcons = {
        "sun": "005-sun.svg",
        "thunder": "001-thunder.svg",
        "rain": "002-rain.svg",
        "cloud2": "003-cloudy.svg",
        "cloudy": "004-cloud2.svg",
        "cloud": "005-clouds.svg"
    };

    var previousScrollY = 0;

    var sunBehavior = _.throttle(function (y, max) {
        var pos = 1 - y / max;
        var sunPos = y * (pos + 0.5);
        sun.style.transform = 'translateY(' + sunPos + 'px)';
    }, 30);

    window.addEventListener('scroll', _.debounce(function (e) {
        var y = e.pageY;
        var max = window.innerHeight;

        //Auto scroll
        if (y - previousScrollY > 0) {
            window.scroll({
                left: 0,
                top: max,
                behavior: 'smooth'
            });
        } else {
            window.scroll({
                left: 0,
                top: 0,
                behavior: 'smooth'
            });
        }

        sunBehavior(y, max);

        previousScrollY = y;
    }, 30));

    var weatherFromCity = function weatherFromCity(city) {
        return fetch('https://api.openweathermap.org/data/2.5/forecast?q=' + city + '&APPID=6841e5450643e5d4ff59981dbf58944e').then(function (response) {
            return response.json();
        });
    };

    var weatherFromCoord = function weatherFromCoord(lat, long) {
        return fetch('https://api.openweathermap.org/data/2.5/forecast?lat=' + lat + '&lon=' + long + '&APPID=6841e5450643e5d4ff59981dbf58944e').then(function (response) {
            return response.json();
        });
    };

    var getWeather = function getWeather(dataPromise) {
        loader.classList.remove('hide');

        return dataPromise.then(function (data) {

            var weatherId = function weatherId(id) {
                if (id === 800) {
                    return "sun";
                } else if (id === 801) {
                    return "cloudy";
                } else if (id < 900 && id >= 802) {
                    return "cloud1";
                } else if (id < 800 && id >= 700 || id < 700 && id >= 600) {
                    return "cloud2";
                } else if (id >= 900 || id < 300) {
                    return "thunder";
                } else if (id < 400 && id >= 300 || id < 600 && id >= 500) {
                    return "rain";
                }
            };

            var collectData = function collectData(day) {
                var wind = day.wind.speed;

                var windForce = Beaufort.find(function (e) {
                    return e.windFrom <= wind && wind <= e.windTo;
                });
                return {
                    date: moment(day.dt * 1000).format('dddd DD MMM'),
                    temp: Math.round(day.main.temp - 273.15, 2),
                    humidity: day.main.humidity,
                    wind: wind,
                    beaufort: windForce.force,
                    weather: weatherId(day.weather[0].id)
                };
            };

            var day1 = collectData(data.list[0]);
            windDay1.className = 'wind icon b-' + day1.beaufort;
            var day2 = collectData(data.list[8]);
            windDay2.className = 'wind icon b-' + day2.beaufort;
            var day3 = collectData(data.list[16]);
            windDay3.className = 'wind icon b-' + day3.beaufort;

            var city = {
                name: data.city.name,
                lat: data.city.coord.lat,
                long: data.city.coord.lon,
                country: data.city.country
            };

            cityLink.text = city.name + ', ' + city.country;
            cityLink.href = 'https://www.google.com/maps/place/' + city.lat + ',' + city.long;

            return { day1: day1, day2: day2, day3: day3 };
        }).then(function (days) {
            var changeIcons = function changeIcons(iconsParent, weatherId) {
                iconsParent.childNodes.forEach(function (node) {
                    if (node.className.indexOf(weatherId) != -1) {
                        if (node.classList.contains('hide')) node.classList.remove("hide");
                    } else {
                        if (!node.classList.contains('hide')) node.classList.add("hide");
                    }
                });
            };

            var updateElement = function updateElement(day, element) {
                element.querySelector('.date').textContent = day.date;
                element.querySelector('.temp').textContent = day.temp;
                element.querySelector('.humidity').textContent = day.humidity;
                element.querySelector('.wind').textContent = day.wind;
                // element.querySelector('.sunset').textContent = weatherIcons[day.weather]
            };

            updateElement(days.day1, day1Element);
            updateElement(days.day2, day2Element);
            updateElement(days.day3, day3Element);

            //Change weather svg
            changeIcons(iconsDay1, days.day1.weather);
            changeIcons(iconsDay2, days.day2.weather);
            changeIcons(iconsDay3, days.day3.weather);

            loader.classList.add('hide');
        });
    };

    // search.addEventListener('change', e => {
    //     console.log("Change");

    //     getWeather(e.target.value)
    //     .then(() => {
    //         window.scroll(0, window.innerHeight)
    //     })
    //     .catch(e => {
    //         console.error("Weather", e)
    //     })
    // })

    var request = function request(city) {
        getWeather(weatherFromCity(city)).then(function () {
            window.scroll({
                left: 0,
                top: window.innerHeight,
                behavior: "smooth"
            });
        }).catch(function (e) {
            console.error("Weather", e);
            search.parentElement.classList.add('shake');
            setTimeout(function () {
                search.parentElement.classList.remove('shake');
            }, 1000);
            loader.classList.add('hide');
        });
    };

    searchButton.addEventListener('click', function (e) {
        request(search.value);
    });

    search.addEventListener('keydown', function (e) {
        if (e.keyCode == 13) {
            request(e.target.value);
        }
    });

    backButton.addEventListener('click', function (e) {
        search.value = "";
        search.focus();
    });

    gpsButton.addEventListener('click', function (e) {
        navigator.geolocation.getCurrentPosition(function (position) {
            getWeather(weatherFromCoord(position.coords.latitude, position.coords.longitude)).then(function () {
                window.scroll({
                    left: 0,
                    top: window.innerHeight,
                    behavior: "smooth"
                });
            }).catch(function (e) {
                gpsBox.classList.add('shake');
                setTimeout(function () {
                    gpsBox.classList.remove('shake');
                }, 1000);
                loader.classList.add('hide');
            });
        }, function (err) {
            console.error('Geolocation Error', err);
            gpsBox.classList.add('shake');
            setTimeout(function () {
                gpsBox.classList.remove('shake');
            }, 1000);
        });
    });

    if ("geolocation" in navigator) {
        /* geolocation is available */
        gpsBox.classList.remove('hide');
    }

    getWeather(weatherFromCity('Paris'));
}, false);
//# sourceMappingURL=script.js.map
