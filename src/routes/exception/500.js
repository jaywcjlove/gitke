import React, { PureComponent } from 'react';

export default class Exception extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }
  render() {
    return (
      <div>
        500 Sorry, the server is wrong.
      </div>
    );
  }
}
