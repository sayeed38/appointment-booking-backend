const express = require("express");
const db = require("./firebase");
const {
  LocalDateTime,
  LocalDate,
  LocalTime,
  ZonedDateTime,
  ZoneId,
} = require("@js-joda/core");
var jsJoda = require("@js-joda/timezone");
const {
  getRequestedTime,
  convertDateToString,
  timeAlreadyExist,
  getFreeSlots,
  getDates
} = require("./utils/helperFunctions");
var cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const config = {
  startHours: "08:00",
  endHours: "17:00",
  duration: 30,
  timezone: "US/Eastern",
};

const eventRef = db.collection("events");

app.get("/", (req, res) => {
  res.send("Appointment Booking API");
});

app.post("/api/freeSlots", async (req, res) => {
  console.log(req.body);
  const timezone = req.body.timezone;
  if (
    req.body.date === undefined ||
    timezone === undefined ||
    timezone.trim() === ""
  ) {
    res.sendStatus(422);
    return;
  }
  const date = LocalDate.parse(req.body.date);
  const reqDT = LocalDateTime.of(date._year, date._month, date._day)
    .atZone(ZoneId.of(timezone)).toString();
  const reqDate = LocalDateTime.parse(ZonedDateTime.parse(reqDT)._dateTime.toString());
  const zoneDT = ZonedDateTime.parse(reqDT).withZoneSameInstant(
    ZoneId.of(config.timezone)
  );
  const zoneDate = LocalDateTime.parse(zoneDT._dateTime.toString());

  const [startDate, endDate] = getDates(reqDate, zoneDate);

  let availableTimeSlot = [];
  for(let j=startDate; j<=endDate; j=j.plusDays(1)){
    const dateStr = convertDateToString(j);
    const result = await eventRef.doc(dateStr).collection("timeEvents").get();
    let existingTime = [];

    if (result.docs.length !== 0) {
      existingTime = result.docs.map((res) => {
        let dt = LocalDateTime.parse(res.data().datetime);
        let time = dt.hour() + ":" + dt.minute();
        return time;
      });
    }

    availableTimeSlot.push(...getFreeSlots(config, existingTime, j, reqDate, timezone));
  }
  
  res.send({"FreeSlot" : availableTimeSlot});
});

app.post("/api/getEvents", async (req, res) => {
  if (req.body.startdate === undefined || req.body.enddate === undefined) {
    res.sendStatus(422);
    return;
  }
  const startDate = LocalDate.parse(req.body.startdate);
  const endDate = LocalDate.parse(req.body.enddate);

  if (
    startDate.toString() === "Invalid Date" ||
    endDate.toString() === "Invalid Date"
  ) {
    res.sendStatus(422);
    return;
  }
  let eventsBooked = [];
  for (let i = startDate; i <= endDate; i = i.plusDays(1)) {
    const date = convertDateToString(i);
    const result = await eventRef.doc(date).collection("timeEvents").get();
    let existingTime = [];
    if (result.docs.length !== 0) {
      existingTime = result.docs.map((res) => {
        return res.data();
      });
    }
    const obj = {
      date: date,
      events: existingTime,
    };
    eventsBooked.push(obj);
  }
  res.send({ events: eventsBooked });
});

app.post("/api/createEvent", async (req, res) => {
  console.log(req.body);
  const timezone = req.body.timezone;
  if (req.body.datetime === undefined || timezone === undefined || timezone.trim() === "") {
    res.sendStatus(422);
    return;
  }

  const dur = +req.body.duration;
  let reqDT = LocalDateTime.parse(req.body.datetime)
    .atZone(ZoneId.of(timezone))
    .toString();
  console.log(reqDT);
  const zoneDT = ZonedDateTime.parse(reqDT).withZoneSameInstant(
    ZoneId.of(config.timezone)
  );
  const datetime = zoneDT._dateTime;
  console.log(datetime);
  if (
    !(
      LocalTime.parse(datetime._time.toString()) <
      LocalTime.parse(config.endHours)
    ) ||
    !(
      LocalTime.parse(datetime._time.toString()) >=
      LocalTime.parse(config.startHours)
    )
  ) {
    res.status(422).send("Time is Above/Lower than appointment time");
    return;
  }
  if (datetime.toString() === "Invalid Date" || !dur) {
    res.sendStatus(422);
    return;
  }

  const date = convertDateToString(datetime);
  const requestedTime = getRequestedTime(datetime, dur, config);
  console.log(requestedTime);
  let flag = false;
  const result = await eventRef.doc(date).collection("timeEvents").get();
  if (result.docs.length === 0) {
    flag = true;
  }

  let dtn = 30;
  if (flag) {
    const docRef = eventRef.doc(date).collection("timeEvents");
    for (let i = 0; i < dur; i += config.duration) {
      let totalDuration = dtn;
      if (i != 0) {
        totalDuration = dur - dtn;
        dtn += 30;
      }
      docRef
        .add({
          datetime: datetime.plusMinutes(i).toString(),
          duration: totalDuration,
          timezone: config.timezone
        })
        .then(() => console.log("Saved"));
    }
  } else {
    const times = result.docs.map((res) => {
      let dt = LocalDateTime.parse(res.data().datetime);
      let time = dt.hour() + ":" + dt.minute();
      return time;
    });
    console.log(times);
    if (timeAlreadyExist(requestedTime, times)) {
      res.sendStatus(422);
      return;
    }
    const docRef = eventRef.doc(date).collection("timeEvents");
    for (let i = 0; i < dur; i += config.duration) {
      let totalDuration = dtn;
      if (i != 0) {
        totalDuration = Math.abs(dur - dtn);
        dtn += 30;
      }
      docRef
        .add({
          datetime: datetime.plusMinutes(i).toString(),
          duration: totalDuration,
          timezone: config.timezone
        })
        .then(() => console.log("Saved"));
    }
  }

  res.send("Event Created");

});

app.listen(process.env.PORT || 5000, () => console.log("App Started"));
