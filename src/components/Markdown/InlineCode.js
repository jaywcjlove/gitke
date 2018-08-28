import React, { PureComponent } from 'react';
// import styles from './InlineCode.less';

export default class Canvas extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }
  render() {
    const { value, language } = this.props;
    return (
      <pre className="highlight">
        <code className={`language-${language}`}>
          {value}
        </code>
      </pre>
    );
  }
}
