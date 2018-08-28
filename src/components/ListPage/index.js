import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { List, Paging, Loading } from 'uiw';
import { Link } from 'react-router-dom';
import styles from './index.less';
import DateAgo from '../DateAgo';

class ListPage extends Component {
  render() {
    const { header, loading, data, page, count, limit, onChange } = this.props;
    return (
      <List
        size="small"
        header={header}
        className={styles.item}
        footer={<Paging onChange={onChange} activePage={page} pageSize={limit} total={count} />}
      >
        <Loading loading={loading}>
          {data.map((item, idx) => {
            return (
              <List.Item className={styles.listItem} key={idx}>
                <Link to={`/${item.owner.username}/${item.name}`}>{item.owner.username} / {item.name}</Link>
                {item.description && (<p>{item.description}</p>)}
                <div>
                  <DateAgo value={item.updated_at} />
                </div>
              </List.Item>
            );
          })}
        </Loading>
      </List>
    );
  }
}

export default ListPage;


ListPage.propTypes = {
  header: PropTypes.node,
  loading: PropTypes.bool,
  page: PropTypes.number,
  count: PropTypes.number,
  data: PropTypes.array,
};
ListPage.defaultProps = {
  loading: false,
  page: 0,
  count: 0,
  data: [],
};
