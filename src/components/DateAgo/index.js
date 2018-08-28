import React, { Component } from 'react';
import { Timestamp } from 'uiw';

const minute = 1000 * 60;
const hour = minute * 60;
const day = hour * 24;
// const halfamonth = day * 15;
const month = day * 30;
const year = month * 12;

class DateAgo extends Component {
  onDateChange(number) {
    let label = '';
    const _year = number / year;
    const _month = number / month;
    const _week = number / (7 * day);
    const _day = number / day;
    const _hour = number / hour;
    const _min = number / minute;

    if (_year >= 1) label = `${parseInt(_year, 10)} years ago`;
    else if (_month >= 1) label = `${parseInt(_month, 10)} months ago`;
    else if (_week >= 1) label = `${parseInt(_week, 10)} weeks ago`;
    else if (_day >= 1) label = `${parseInt(_day, 10)} days ago`;
    else if (_hour >= 1) label = `${parseInt(_hour, 10)} hours ago`;
    else if (_min >= 1) label = `${parseInt(_min, 10)} minutes ago`;
    else label = 'just';
    return (
      <span>{label}</span>
    );
  }
  render() {
    const { value } = this.props;
    if (!value) return null;
    return (
      <Timestamp
        beforeDate
        interval={0}
        renderDate={this.onDateChange.bind(this)}
        value={value}
      />
    );
  }
}

export default DateAgo;
