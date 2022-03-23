const express = require('express');
const app = express();
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
app.use(express.static('views'));
app.use(cors());

let feelslike_f,wind_mph,fulldata,fullres;

async function getWeatherData(zip) {
    await axios
        .get(`http://api.weatherapi.com/v1/current.json?key=bd80ca6b030b4fd28e3195613222103&q=${zip}&aqi=no`)
        .then(res => {
            feelslike_f = res.data.current.feelslike_f;
            wind_mph = res.data.current.wind_mph;
            fulldata = res.data;
            fullres = res;
        })
        .catch(error => {
            console.log(error);
        })
}
async function determineOptimal() {
    await getWeatherData(58852);
    //console.log(feelslike_f, wind_mph);
    let score = 100;
    if(feelslike_f < 40) {
        score -= 50;
        if(feelslike_f < 20) {
            score -= 25;
        }
    }
    if(wind_mph > 15) {
        score -= 25;
        if(wind_mph > 25) {
            score -= 25;
        }
    }

    if(score === 100) {
        return "very optimal";
    } else if (score <= 99 && score >= 76) {
        return "optimal";
    } else if (score <= 75 && score >= 51) {
        return "somewhat optimal";
    } else if (score <= 50 && score >= 26) {
        return "not very optimal";
    } else if (score <= 25) {
        return "not optimal";
    }
}


app.get('/', async (req, res) => {
    let latest = JSON.parse(fs.readFileSync("./db/games/latest.json"));
    res.render('home.ejs', {
        "optimal":`${await determineOptimal()}`,
        "location":"Tioga, North Dakota",
        "degrees":feelslike_f,
        "winds":wind_mph,
        "latest":latest.id
    });
})

app.get('/weather/*', async (req, res) => {
    let zip = req.url.split('/')[2];
    await getWeatherData(zip);
    res.render('weather.ejs', {
        "icon":fulldata.current.condition.icon,
        "wind":wind_mph,
        "windDir":fulldata.current.wind_dir,
        "deg":feelslike_f,
        "lastUpd":`${fulldata.current.last_updated.split(' ')[1]}`,
        "humidity":fulldata.current.humidity,
        "condition":fulldata.current.condition.text,
        "location":`${fulldata.location.name}, ${fulldata.location.region}`
    })
})

app.get('/stats/games/*', (req, res) => {
    let id = req.url.split('/')[3];
    let stats = JSON.parse(fs.readFileSync(`./db/games/${id}/scores.json`));
    // create combo strings
    let chsA,chsB,chsC,chsD,chsE;
    let totA,totB,totC,totD,totE;
    let namA;
    let namB = "No Player";
    let namC = "No Player";
    let namD = "No Player";
    let namE = "No Player";
    chsA = stats.playerA["1"];
    totA = stats.playerA.total;
    namA = stats.playerA.name;
    if (stats.playerB) {
        chsB = stats.playerB["1"];
        totB = stats.playerB.total;
        namB = stats.playerB.name;
    }
    if (stats.playerC) {
        chsC = stats.playerC["1"];
        totC = stats.playerC.total;
        namC = stats.playerC.name;
    }
    if (stats.playerD) {
        chsD = stats.playerD["1"];
        totD = stats.playerD.total;
        namD = stats.playerD.name;
    }
    if (stats.playerE) {
        chsE = stats.playerE["1"];
        totE = stats.playerE.total;
        namE = stats.playerE.name;
    }
    for(let i = 1; i < 9; i++) {
        chsA = `${chsA},${stats.playerA[i.toString()]}`
        if (stats.playerB) chsB = `${chsB},${stats.playerB[i.toString()]}`
        if (stats.playerC) chsC = `${chsC},${stats.playerC[i.toString()]}`
        if (stats.playerD) chsD = `${chsD},${stats.playerD[i.toString()]}`
        if (stats.playerE) chsE = `${chsE},${stats.playerE[i.toString()]}`
    }
    res.render('stats.ejs', {
        "id":id,
        "stats":stats,
        "playerA":namA,
        "playerB":namB,
        "playerC":namC,
        "playerD":namD,
        "playerE":namE,
        "comboHoleScoresA":chsA,
        "comboHoleScoresB":chsB,
        "comboHoleScoresC":chsC,
        "comboHoleScoresD":chsD,
        "comboHoleScoresE":chsE,
        "totalScoreA":totA,
        "totalScoreB":totB,
        "totalScoreC":totC,
        "totalScoreD":totD,
        "totalScoreE":totE
    })
})
app.get('/api/game/*', (req, res) => {
    let id = req.url.split('/')[3];
    let stats = JSON.parse(fs.readFileSync(`./db/games/${id}/scores.json`));
    res.json(stats);
})

app.get('/manage/create', (req, res) => {
    res.render('creator.ejs', {});
})

app.listen(3000);