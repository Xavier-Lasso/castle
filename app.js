const restaurant = require('./restaurant');
const hotel = require('./hotel');
const express = require('express');
const stringSimilarity = require('string-similarity');
const cheerio = require('cheerio');

let app = express();
app.use(express.static("public"));

let hotelsWithStarredRestaurant = [];

function isIterable(obj) {
    if (obj == null) {
        return false;
    }
    return typeof obj[Symbol.iterator] === 'function';
}

function getHotelsWithStarredRestaurant(hotels, starredRestaurants) {
    loop1:
        for(let hotel of hotels) {
            if(hotel !== undefined && isIterable(hotel.restaurants)) {
                loop2:
                    for (let restaurant of hotel.restaurants) {
                        loop3:
                            for (let starredRestaurant of starredRestaurants) {
                                let similarityRestaurant = stringSimilarity.compareTwoStrings(restaurant.name, starredRestaurant.name);
                                let similarityCity = stringSimilarity.compareTwoStrings(hotel.city, starredRestaurant.city);
                                if (similarityRestaurant >= 0.90 && similarityCity >= 0.90) {
                                    hotelsWithStarredRestaurant.push(hotel);
                                    break loop2;
                                }
                            }
                    }
            }
    }
    /*
    hotels.forEach(hotel => {
        hotel.restaurants.forEach(restaurant => {
            starredRestaurants.forEach(starredRestaurant => {
                let similarity = stringSimilarity.compareTwoStrings(restaurant.name, starredRestaurant);
                if(similarity >= 0.90) {
                    hotelsWithStarredRestaurant.push(hotel);
                }
            });
        });
    });
    */
    return hotelsWithStarredRestaurant;
}

async function main() {
    const starredRestaurants = await restaurant.getRestaurants();
    starredRestaurants.forEach(res => {
        console.log(res);
    });
    console.log(starredRestaurants.length);
    const hotels = await hotel.getHotels();
    hotels.forEach(res => {
        console.log(res);
    });
    console.log(hotels.length);
    console.log('-----------------------------------------------------');
    const hotelsWithStarredRestaurant = getHotelsWithStarredRestaurant(hotels, starredRestaurants);
    hotelsWithStarredRestaurant.forEach(res => {
        console.log(res);
    });
    console.log(hotelsWithStarredRestaurant.length);
}

function fillList(req, res) {
    const $ = cheerio.load('public/index.html');
    console.log($.html());
    $('.hotel').remove();
    hotelsWithStarredRestaurant.forEach(res => {
        $('ul').append('<li class="hotel">' + res.name + '</li>');
    });
}

main();

app.get('/', function (req, res) {
    fillList(req, res);
    res.sendfile('public/index.html');
});

app.listen(8080);
console.log('Listenning on port 8080...');
