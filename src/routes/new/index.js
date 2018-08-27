import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { Input, Select, Button } from 'uiw';
import PageHeader from '../../components/PageHeader';
import styles from './index.less';

const FormItem = ({
  label = '',
  value,
  type = 'text',
  options,
  onChange = () => {},
}) => {
  return (
    <div className={styles.formItem}>
      <label className={styles.formTitle}>{label}</label>
      <div className={styles.formItemCon}>
        {options && (
          <Select onChange={onChange} value={value}>
            {options.map((item, idx) => <Select.Option key={idx} {...item} />)}
          </Select>
        )}
        {!options && (
          <Input value={value} type={type} onChange={onChange} />
        )}
      </div>
    </div>
  );
};

class New extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      form: {
        name: '',
        owner: '',
        description: '',
      },
      rules: {},
      disabled: true,
    };
  }
  componentDidMount() {
    this.props.getOrgs();
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.orgsSelect !== this.props.orgsSelect) {
      if (nextProps.orgsSelect.length > 0 && !this.state.owner) {
        const { form } = this.state;
        form.owner = nextProps.orgsSelect[0].value;
        this.setState({ form: { ...form } });
      }
    }
  }
  onChange(key, e, value) {
    const { form } = this.state;
    form[key] = value;
    const props = {};
    if (form.name) {
      props.disabled = false;
    }
    this.setState({ form: { ...form }, ...props });
  }
  onSubmit() {
    const { form } = this.state;
    this.props.createRepo(form);
  }
  render() {
    const { form, disabled } = this.state;
    return (
      <PageHeader title="Create a new repository" content="A repository contains all the files for your project, including the revision history.">
        <FormItem
          label="Owner"
          value={form.owner}
          onChange={this.onChange.bind(this, 'owner')}
          field="owner"
          options={this.props.orgsSelect}
        />
        <FormItem
          label="Repository name"
          value={form.name}
          onChange={this.onChange.bind(this, 'name')}
          field="name"
        />
        <FormItem
          label="Description (optional)"
          value={form.description}
          onChange={this.onChange.bind(this, 'description')}
          field="description"
        />
        <Button onClick={this.onSubmit.bind(this)} disabled={disabled} type="success">成功按钮</Button>
      </PageHeader>
    );
  }
}

const mapState = ({ account, organizations }) => ({
  userData: account.userData,
  orgsSelect: organizations.orgsSelect,
});

const mapDispatch = ({ account, repo, organizations }) => ({
  logout: account.logout,
  getRepoDetail: repo.getRepoDetail,
  createRepo: repo.createRepo,
  getOrgs: organizations.getOrgs,
});

export default connect(mapState, mapDispatch)(New);
