import React, { Component } from 'react';
import { Input, Tooltip, Button } from 'uiw';
import copyTextToClipboard from '@uiw/copy-to-clipboard';
import styles from './CloneModal.less';

export default class CloneModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      repo: props.repo,
    };
  }
  clickCopyTextToClipboard() {
    clearTimeout(this.timer);
    const { repo } = this.state;
    copyTextToClipboard(repo, () => {
      this.timer = setTimeout(() => {
        this.tooltip.setState({ showTooltip: true });
      }, 200);
    });
  }
  render() {
    const { repo } = this.state;
    return (
      <div>
        <Input
          className={styles.cloneModel}
          addonAfter={
            <Tooltip
              ref={node => this.tooltip = node}
              trigger="click"
              placement="right"
              content="Copied!"
              visible={false}
            >
              <Button
                onClick={this.clickCopyTextToClipboard.bind(this)}
                icon="copy"
                type="primary"
              />
            </Tooltip>
          }
          value={repo}
        />
        <div>
          Clone with HTTPS
        </div>
      </div>
    );
  }
}
