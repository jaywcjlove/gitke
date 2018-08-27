import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import styles from './index.less';

export default class PageHeader extends PureComponent {
  render() {
    const { className, isPadding, title, content, action, extraContent, children } = this.props;
    let Header = null;
    if (title || content || action || extraContent) {
      Header = (
        <div className={styles.pageHeader}>
          <div className={styles.row}>
            {title && <h1 className={styles.title}> {title} </h1>}
            {action && <div className={styles.action}> {action} </div>}
          </div>
          {(content || extraContent) && (
            <div className={styles.row}>
              {content && <div className={styles.content}>{content}</div>}
              {extraContent && <div className={styles.extraContent}>{extraContent}</div>}
            </div>
          )}
        </div>
      );
    }
    return (
      <div className={classNames(styles.warpper, className)} ref={node => this.header = node}>
        {Header}
        {children && (
          <div
            className={classNames({
              [styles.contentWarpper]: !isPadding,
            })}
          >
            {children}
          </div>
        )}
      </div>
    );
  }
}

PageHeader.propTypes = {
  isPadding: PropTypes.bool,
  title: PropTypes.oneOfType([
    PropTypes.string, PropTypes.node,
  ]),
};
PageHeader.defaultProps = {
  isPadding: false,
  title: '',
};
