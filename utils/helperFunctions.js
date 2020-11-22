const {
  LocalTime,
  LocalDateTime,
  ZonedDateTime,
  ZoneId,
} = require("@js-joda/core");

const formatHour = (hour, i) => {
  let time = "";
  if (hour < 12) {
    time = hour;
  } else if (hour === 12) {
    time = hour;
  } else {
    const hr = i.minusHours(12);
    time = hr.hour();
  }
  return time;
};

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

const timeAlreadyExist = (requestedTimeArr, previousTimeArr) => {
  for (let i = 0; i < requestedTimeArr.length; i++) {
    if (previousTimeArr.indexOf(requestedTimeArr[i]) !== -1) {
      return true;
    }
  }
  return false;
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

const getFreeSlots = (config, existingTime, j, reqDate, timezone) => {
  let slots = [];
  for (
    let i = LocalTime.parse(config.startHours);
    i < config.endHours;
    i = i.plusMinutes(config.duration)
  ) {
    let time = formatHour(i.hour(), i) + ":" + i.minute();
    if (existingTime.indexOf(time) === -1) {
      const currentTimeZone = LocalDateTime.of(
        j._date._year,
        j._date._month,
        j._date._day,
        i.hour(),
        i.minute()
      )
        .atZone(ZoneId.of(config.timezone))
        .toString();
      const requestedTimeZone = ZonedDateTime.parse(currentTimeZone)
        .withZoneSameInstant(ZoneId.of(timezone))
        .toString();
      const requestedTimeDate = LocalDateTime.parse(
        ZonedDateTime.parse(requestedTimeZone)._dateTime.toString()
      );
      if (reqDate._date.toString() === requestedTimeDate._date.toString()) {
        const time = requestedTimeDate._time;
        slots.push(formatTimeToTwelve(time._hour, time));
      }
    }
  }
  return slots;
};

const getDates = (reqDate, zoneDate) => {
    const flag = reqDate > zoneDate;
    let startDate, endDate;
    if(flag == true){
        startDate = zoneDate.minusDays(1);
        endDate = zoneDate.plusDays(1);
    }else{
        startDate = zoneDate;
        endDate = zoneDate.plusDays(2);
    }
    return [startDate, endDate];
}

module.exports = {
  getRequestedTime,
  convertDateToString,
  timeAlreadyExist,
  getFreeSlots,
  getDates
};
