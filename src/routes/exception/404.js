import React, { PureComponent } from 'react';

export default class Exception extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }
  render() {
    return (
      <div>
        404 Sorry, the page you visited does not exist.
      </div>
    );
  }
}
