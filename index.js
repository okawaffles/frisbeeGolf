const express = require('express');
const app = express();
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const formidable = require('formidable');
//var vhost = require('vhost');
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
app.post('/api/createJSON', (req, res, next) => {
    let latest = JSON.parse(fs.readFileSync(`./db/games/latest.json`));
    const form = formidable({ multiples: true });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            next(err);
            return;
        }

        let newJSON = {
            "holes":9,
            "players":5,
            "playerA": {
                "1":fields.A1,
                "2":fields.A2,
                "3":fields.A3,
                "4":fields.A4,
                "5":fields.A5,
                "6":fields.A6,
                "7":fields.A7,
                "8":fields.A8,
                "9":fields.A9,
                "total":parseInt(fields.A1)+parseInt(fields.A2)+parseInt(fields.A3)+parseInt(fields.A4)+parseInt(fields.A5)+parseInt(fields.A6)+parseInt(fields.A7)+parseInt(fields.A8)+parseInt(fields.A9),
                "name":fields.namA
            },
            "playerB": {
                "1":fields.B1,
                "2":fields.B2,
                "3":fields.B3,
                "4":fields.B4,
                "5":fields.B5,
                "6":fields.B6,
                "7":fields.B7,
                "8":fields.B8,
                "9":fields.B9,
                "total":parseInt(fields.B1)+parseInt(fields.B2)+parseInt(fields.B3)+parseInt(fields.B4)+parseInt(fields.B5)+parseInt(fields.B6)+parseInt(fields.B7)+parseInt(fields.B8)+parseInt(fields.B9),
                "name":fields.namB
            },
            "playerC": {
                "1":fields.C1,
                "2":fields.C2,
                "3":fields.C3,
                "4":fields.C4,
                "5":fields.C5,
                "6":fields.C6,
                "7":fields.C7,
                "8":fields.C8,
                "9":fields.C9,
                "total":parseInt(fields.C1)+parseInt(fields.C2)+parseInt(fields.C3)+parseInt(fields.C4)+parseInt(fields.C5)+parseInt(fields.C6)+parseInt(fields.C7)+parseInt(fields.C8)+parseInt(fields.C9),
                "name":fields.namC
            },
            "playerD": {
                "1":fields.D1,
                "2":fields.D2,
                "3":fields.D3,
                "4":fields.D4,
                "5":fields.D5,
                "6":fields.D6,
                "7":fields.D7,
                "8":fields.D8,
                "9":fields.D9,
                "total":parseInt(fields.D1)+parseInt(fields.D2)+parseInt(fields.D3)+parseInt(fields.D4)+parseInt(fields.D5)+parseInt(fields.D6)+parseInt(fields.D7)+parseInt(fields.D8)+parseInt(fields.D9),
                "name":fields.namD
            },
            "playerE": {
                "1":fields.E1,
                "2":fields.E2,
                "3":fields.E3,
                "4":fields.E4,
                "5":fields.E5,
                "6":fields.E6,
                "7":fields.E7,
                "8":fields.E8,
                "9":fields.E9,
                "total":parseInt(fields.E1)+parseInt(fields.E2)+parseInt(fields.E3)+parseInt(fields.E4)+parseInt(fields.E5)+parseInt(fields.E6)+parseInt(fields.E7)+parseInt(fields.E8)+parseInt(fields.E9),
                "name":fields.namE
            }
        }

        let strJSON = JSON.stringify(newJSON);
        fs.mkdirSync(`./db/games/${latest.id + 1}`);
        await fs.writeFileSync(`./db/games/${latest.id + 1}/scores.json`, strJSON);

        res.redirect(`../../stats/games/${latest.id+1}`);

        let newId = JSON.stringify({ id:latest.id+1 });
        fs.writeFileSync(`./db/games/latest.json`, newId);
    });
})

app.get('/api/stats/games/*', (req, res) => {
    let id = req.url.split('/')[4];
    res.json(JSON.parse(fs.readFileSync(`./db/games/${id}/scores.json`)));
})

app.listen(3000);