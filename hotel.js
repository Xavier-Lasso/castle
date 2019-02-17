const rp = require('request-promise');
const cheerio = require('cheerio');
const fetch = require('node-fetch');

const urlCastle = "https://www.relaischateaux.com/us/site-map/etablissements";
const urlCastlePrice = "https://www.relaischateaux.com/us/search/availability";

function getAllUrl() {
    const options = {
        uri: urlCastle,
        transform: function (body) {
            return cheerio.load(body);
        }
    };
    return rp(options)
        .then(($) => {
            let list = [];
            $('div[id="countryF"]').find('div > ul > li > a').each(function (index, element) {
                if($(element).attr('href').includes("france")) {
                    list.push($(element).attr('href'));
                }
            });
            return list;
        })
        .catch((err) => {
            console.log(err);
        });
}

function getPriceHotel(id) {
    const date = new Date(Date.now());
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const fullUrl = urlCastlePrice + "/check?month=" + year + "-" + month + "&idEntity=" + id + "&pax=2&room=1";
    fetch(fullUrl).then(response => {
        return response.json();
    }).then(data => {
        console.log(data);
    }).catch(err => {
        console.log(err);
    });
}

function getOtherRestaurants(url, listRestaurants) {
    const options = {
        uri: url,
        transform: function (body) {
            return cheerio.load(body);
        }
    };
    return rp(options)
        .then(($) => {
            let res = $('#tabRestaurants > div > div > div > div.col-1-1.collapse-xs > div > div > div.hotelTabsHeaderTitle > h3').each(function (index, element) {
                let restaurantName = $(this).text().trim();
                listRestaurants.push({name: restaurantName});
            });
            return listRestaurants
        })
        .catch((err) => {
            console.log(err);
        });
}

function getRestaurants(url) {
    const options = {
        uri: url,
        transform: function (body) {
            return cheerio.load(body);
        }
    };
    return rp(options)
        .then(($) => {
            let list = [];
            let restaurants = $('body > div.jsSecondNav.will-stick > ul.jsSecondNavSub.active');
            if(restaurants.length) {
                let res = $('body > div.jsSecondNav.will-stick > ul.jsSecondNavSub.active > li').each(function (index, element) {
                    let restaurantName = $(this).text().trim();
                    if(restaurantName === 'Other restaurants')
                    {
                        list = getOtherRestaurants($(this).children().attr('href'), list);
                    }
                    else {
                        list.push({name: restaurantName});
                    }
                });
            }
            else {
                list.push({name: ($('.tabRestaurant > div > div.row.hotelTabsHeader > div:nth-child(1) > div.hotelTabsHeaderTitle > h3').text().trim())});
            }
            return list;
        })
        .catch((err) => {
            console.log(err);
        });
}

function GetHotelRestaurant(url) {
    const options = {
        uri: url,
        transform: function (body) {
            return cheerio.load(body);
        }
    };
    return rp(options)
        .then(($) => {
            let hotels = {};
            let hotel = $('body > div.jsSecondNav.will-stick > ul.jsSecondNavMain > li.active > a > span').text();
            let restaurant = $('body > div.jsSecondNav.will-stick > ul.jsSecondNavMain > li:nth-child(2) > a > span').text();
            let hotelCity = $('body > div.hotelHeader > div.headings > h2 > span:nth-child(2)').text();
            if(hotel === 'Hotel' && restaurant === 'Restaurant') {
                let hotelName = $('body > div.hotelHeader > div.headings > h1').text().trim();
                let urlRestaurants = $('body > div.jsSecondNav.will-stick > ul.jsSecondNavMain > li:nth-child(2) > a').attr('href');
                return getRestaurants(urlRestaurants).then(res => {
                    hotels.name = hotelName;
                    hotels.city = hotelCity;
                    hotels.restaurants = res;
                    return hotels;
                })
                    .catch((err) => {
                    console.log(err);
                });
            }
            else {
                return null;
            }
        })
        .catch((err) => {
            console.log(err);
        });
}

async function GetAllHotelRestaurants(listUrl) {
    let listHotelRest = [];
    for(let i = 0; i < listUrl.length; i++) {
        let hotelRest = await GetHotelRestaurant(listUrl[i]);
        if (hotelRest !== null) {
            listHotelRest.push(hotelRest);
        }
    }
    return listHotelRest;
}

async function getHotels() {
    const listAllUrl = await getAllUrl();
    const listHotelRestaurant = await GetAllHotelRestaurants(listAllUrl);
    return listHotelRestaurant;
}

exports.getHotels = getHotels;
