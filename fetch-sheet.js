const fs = require("fs");
const request = require("request");
const d3 = require("d3");

const piano = d3.csvParse(fs.readFileSync("./src/data/piano.csv", "utf8"));
const midiFull = piano.map(d => +d.midi).filter(d => d >= 36 && d <= 84);
const durationFull = [0, 1, 2, 3, 4];

function parseMidi({ value, sequence }) {
  const midis = sequence.map(d => d.midi);
  if (value === "exact") return [...new Set(midis)];
  else if (value === "between") {
    const [s, e] = d3.extent(midis);
    return d3.range(s, e + 1).map(d => d);
  } else if (value === "full") {
    return midiFull;
  }
  // default to exact
  return [...new Set(midis)];
}

function parseDuration({ value, sequence }) {
  const durations = sequence.map(d => d.duration);
  if (value === "exact") return [...new Set(durations)];
  else if (value === "between") {
    const [s, e] = d3.extent(durations);
    return d3.range(s, e + 1).map(d => d);
  } else if (value === "full") {
    return durationFull;
  }
  // default to exact
  return [...new Set(midis)];
}

function parseSequence(str) {
  const notes = str.split(".");
  return notes.map(d => {
    const [midi, duration] = d.split("-").map(d => +d);
    return { midi, duration };
  });
}

function cleanData(data) {
  return data
    .filter(d => d.sequence)
    .map(d => {
      const sequence = parseSequence(d.sequence);
      return {
        title: d.title,
        artist: d.artist,
        odds: +d.odds,
        apm: +d.apm,
        est: +d.est,
        tempo: +d.tempo,
        sig: d.sig ? d.sig.split(".").map(d => +d) : 4,
        sequence,
        range: {
          midis: parseMidi({ value: d.range_midi, sequence }),
          durations: parseDuration({ value: d.range_duration, sequence })
        }
      };
    });
}

function getSheet() {
  const id = "1KOLaqf34-8e0S1VsMzIa6IafaTiCc0UE46UK6Owex7o";
  const gid = 0;
  const base = "https://docs.google.com/spreadsheets/u/1/d";
  const url = `${base}/${id}/export?format=csv&id=${id}&gid=${gid}`;

  return new Promise((resolve, reject) => {
    request(url, (error, response, body) => {
      if (error) reject(error);
      else if (response && response.statusCode === 200) {
        try {
          const data = d3.csvParse(body);
          const levels = cleanData(data);
          fs.writeFileSync("./src/data/levels.json", JSON.stringify(levels));
        } catch (err) {
          reject(err);
        }
      } else reject(response.statusCode);
    });
  });
}

async function init() {
  try {
    await getSheet();
  } catch (err) {
    return Promise.reject(err);
  }
}

init();
