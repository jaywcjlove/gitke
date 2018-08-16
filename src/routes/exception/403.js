import React, { PureComponent } from 'react';

export default class Exception extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }
  render() {
    return (
      <div>
        403 Sorry, you don't have access to this page.
      </div>
    );
  }
}
