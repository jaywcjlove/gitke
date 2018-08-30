import React, { Component } from 'react';

export default class Repos extends Component {
  render() {
    const { type } = this.props;
    if (type === 'octiconbook') {
      return (
        <svg viewBox="0 0 16 16" width="16" height="16">
          <path fill="currentColor" fillRule="evenodd" d="M3 5h4v1H3V5zm0 3h4V7H3v1zm0 2h4V9H3v1zm11-5h-4v1h4V5zm0 2h-4v1h4V7zm0 2h-4v1h4V9zm2-6v9c0 .55-.45 1-1 1H9.5l-1 1-1-1H2c-.55 0-1-.45-1-1V3c0-.55.45-1 1-1h5.5l1 1 1-1H15c.55 0 1 .45 1 1zm-8 .5L7.5 3H2v9h6V3.5zm7-.5H9.5l-.5.5V12h6V3z" />
        </svg>
      );
    }
    if (type === 'folder') {
      return (
        <svg viewBox="0 0 14 16" width="14" height="16">
          <path fillRule="evenodd" d="M13 4H7V3c0-.66-.31-1-1-1H1c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1zM6 4H1V3h5v1z" />
        </svg>
      );
    }
    if (type === 'file') {
      return (
        <svg viewBox="0 0 12 16" width="12" height="16" aria-hidden="true">
          <path fillRule="evenodd" d="M6 5H2V4h4v1zM2 8h7V7H2v1zm0 2h7V9H2v1zm0 2h7v-1H2v1zm10-7.5V14c0 .55-.45 1-1 1H1c-.55 0-1-.45-1-1V2c0-.55.45-1 1-1h7.5L12 4.5zM11 5L8 2H1v12h10V5z" />
        </svg>
      );
    }
    if (type === 'submodule') {
      return (
        <svg viewBox="0 0 14 16" width="14" height="16" >
          <path fillRule="evenodd" d="M10 7H4v7h9c.55 0 1-.45 1-1V8h-4V7zM9 9H5V8h4v1zm4-5H7V3c0-.66-.31-1-1-1H1c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h2V7c0-.55.45-1 1-1h6c.55 0 1 .45 1 1h3V5c0-.55-.45-1-1-1zM6 4H1V3h5v1z" />
        </svg>
      );
    }
    return <span />;
  }
}
