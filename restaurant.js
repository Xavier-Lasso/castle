const rp = require('request-promise');
const cheerio = require('cheerio');

const urlMichelin = "https://restaurant.michelin.fr/restaurants/france/restaurants-1-etoile-michelin/restaurants-2-etoiles-michelin/restaurants-3-etoiles-michelin";

function getRestaurantsInfo(url) {
    const options = {
        uri: url,
        transform: function (body) {
            return cheerio.load(body);
        }
    };
    return rp(options)
        .then(($) => {
            let restaurantName = $('body > div.l-page > div > div.l-main > div > div.panel-display.panels-michelin-content-layout.panels-michelin-2colsidebar.clearfix > div.panels-content-main.panels-content-main_regionone > div > div.panels-content-main-left > div > div > div > div > h1').text().trim();
            let restaurantCity = $('body > div.l-page > div > div.l-main > div > div.panel-display.panels-michelin-content-layout.panels-michelin-2colsidebar.clearfix > div.panels-content-main.panels-content-main_regionone > div > div.panels-content-main-left > div > div > div > div > div.poi_intro-display-address > div > div > div > div.addressfield-container-inline.locality-block.country-FR > span.locality').text();
            return {name: restaurantName, city: restaurantCity};
        })
        .catch(err => {
            console.log(err);
        });
}

function getHttpRestaurants(url, list) {
    const options = {
        uri: url,
        transform: function (body) {
            return cheerio.load(body);
        }
    };
    return rp(options)
        .then(($) => {
            //let listRes = [];
            $('#panels-content-main-leftwrapper > div.panel-panel.panels-content-main-left > div > div > ul > li > div > a').each(function(i, elem) {
                let urlRestaurant = 'https://restaurant.michelin.fr' + $(this).attr('href');
                getRestaurantsInfo(urlRestaurant).then(res => {
                    // console.log(res);
                    list.push(res);
                    // return listRes;
                })
                    .catch(err => {
                        console.log(err);
                    });
            });
            return list;
        })
        .catch(err => {
            console.log(err);
        });
}

function getHttpNbPages(url) {
    const options = {
        uri: url,
        transform: function (body) {
            return cheerio.load(body);
        }
    };
    return rp(options)
        .then(($) => {
            let pages = parseInt($('#panels-content-main-leftwrapper > div.panel-panel.panels-content-main-left > div > div > div > div.item-list-first > div > ul > li:nth-child(13) > a').text());
            return pages;
        })
        .catch(err => {
            console.log(err);
        });
}

async function getRestaurants() {
    let list = [];
    list = await getHttpRestaurants(urlMichelin, list);
    let pages = await getHttpNbPages(urlMichelin);
    for(let i = 2; i <= pages; i++) {
        list = await getHttpRestaurants(urlMichelin + "/page-" + i, list);
    }
    return list;
}

exports.getRestaurants = getRestaurants;
