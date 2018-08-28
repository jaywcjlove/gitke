import React, { PureComponent } from 'react';

export default class ListItem extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }
  render() {
    const { level, children } = this.props;
    let LevelElm = null;
    switch (level) {
      case 1: LevelElm = <h1>{children}</h1>; break;
      case 2: LevelElm = <h2>{children}</h2>; break;
      case 3: LevelElm = <h3>{children}</h3>; break;
      case 4: LevelElm = <h4>{children}</h4>; break;
      case 5: LevelElm = <h5>{children}</h5>; break;
      case 6: LevelElm = <h6>{children}</h6>; break;
      default: break;
    }
    return LevelElm;
  }
}
