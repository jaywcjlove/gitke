import React, { Component } from 'react';
import { Input } from 'uiw';
import styles from './DescriptionEdit.less';

export default class DescriptionEdit extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isEdit: false,
      description: props.description || '',
    };
  }
  onChange(e, value) {
    this.setState({ description: value });
  }
  onSubmit() {
    const { isEdit, onSubmit } = this.state;
    onSubmit && onSubmit();
    this.setState({ isEdit: !isEdit });
  }
  render() {
    const { isEdit, description } = this.state;
    const descriptionShow = !isEdit && (description || 'No description, website, or topics provided. ');
    return (
      <span className={styles.edit}>
        {descriptionShow}
        {isEdit && (
          <Input length="5" placeholder="Short description of this repository" value={description} onChange={this.onChange.bind(this)} />
        )}
        <span className={styles.btn} onClick={this.onSubmit.bind(this)}>{isEdit ? 'Save' : 'Edit'}</span>
      </span>
    );
  }
}
