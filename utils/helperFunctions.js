const {
  LocalTime,
  LocalDateTime,
  ZonedDateTime,
  ZoneId,
} = require("@js-joda/core");

const getRequestedTime = (datetime, dur, config) => {
  requestedTime = [];
  for (let i = 0; i < dur; i += config.duration) {
    let dt = datetime.plusMinutes(i);
    const time = dt.hour() + ":" + dt.minute();
    requestedTime.push(time);
  }
  return requestedTime;
};

const convertDateToString = (datetime) =>
  datetime.year() + "-" + datetime.monthValue() + "-" + datetime.dayOfMonth();

const timeAlreadyExist = (reqDateTime, previousTimeArr) => {
  const reqStartEvent = LocalDateTime.parse(reqDateTime.toString());
  for (let i = 0; i < previousTimeArr.length; i++) {
    const prevStartEvent = LocalDateTime.parse(previousTimeArr[i].datetime);
    const prevEndEvent = prevStartEvent.plusMinutes(
      previousTimeArr[i].duration
    );
    if (reqStartEvent >= prevStartEvent && reqStartEvent < prevEndEvent) {
      return true;
    }
  }
  return false;
};

const getFreeSlots = (config, existingTime, j, reqDate, timezone) => {
  let slots = [];
  for (
    let i = LocalTime.parse(config.startHours);
    i < config.endHours;
    i = i.plusMinutes(config.duration)
  ) {
    const currentDateTime = LocalDateTime.of(
      j._date._year,
      j._date._month,
      j._date._day,
      i.hour(),
      i.minute()
    );
    if (!eventExist(currentDateTime, existingTime)) {
      const requestedTimeDate = getRequestedZoneDateTime(
        j,
        i,
        config,
        timezone
      );
      if (reqDate._date.toString() === requestedTimeDate._date.toString()) {
        const time = requestedTimeDate._time;
        slots.push(formatTimeToTwelve(time._hour, time));
      }
    }
  }
  return slots;
};

const eventExist = (currentDateTime, existingTime) => {
  for (let i = 0; i < existingTime.length; i++) {
    const prevStartEvent = LocalDateTime.parse(existingTime[i].datetime);
    const prevEndEvent = prevStartEvent.plusMinutes(existingTime[i].duration);
    if (currentDateTime >= prevStartEvent && currentDateTime < prevEndEvent) {
      return true;
    } else if (
      currentDateTime.plusMinutes(30) > prevStartEvent &&
      currentDateTime.plusMinutes(30) <= prevEndEvent
    ) {
      return true;
    }
  }
  return false;
};

const getRequestedZoneDateTime = (j, i, config, timezone) => {
  const currentTimeZone = LocalDateTime.of(
    j._date._year,
    j._date._month,
    j._date._day,
    i.hour(),
    i.minute()
  )
    .atZone(ZoneId.of(config.timezone))
    .toString();
  const requestedTimeZone = ZonedDateTime.parse(currentTimeZone.toString())
    .withZoneSameInstant(ZoneId.of(timezone))
    .toString();
  return LocalDateTime.parse(
    ZonedDateTime.parse(requestedTimeZone)._dateTime.toString()
  );
};

const formatTimeToTwelve = (hour, i) => {
  let time = "";
  if (hour < 12) {
    time = i + " AM";
  } else if (hour === 12) {
    time = i + " PM";
  } else {
    time = i.minusHours(12) + " PM";
  }
  return time;
};

const getDates = (reqDate, zoneDate) => {
  const flag = reqDate > zoneDate;
  let startDate, endDate;
  if (flag == true) {
    startDate = zoneDate.minusDays(1);
    endDate = zoneDate.plusDays(1);
  } else {
    startDate = zoneDate;
    endDate = zoneDate.plusDays(2);
  }
  return [startDate, endDate];
};

module.exports = {
  getRequestedTime,
  convertDateToString,
  timeAlreadyExist,
  getFreeSlots,
  getDates,
};
