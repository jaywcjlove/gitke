import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import styles from './index.less';


const FormItem = ({ label, onChange = () => { }, type = 'text', value }) => (
  <div className={styles.formItem}>
    <label>{label}:</label>
    <input type={type} onChange={onChange} value={value} />
  </div>
);

class Login extends PureComponent {
  constructor() {
    super();
    this.state = {
      form: {
        password: 'admin',
        username: 'admin',
      },
    };
  }
  componentDidMount() {
    this.props.logout();
  }
  login() {
    this.props.login(this.state.form);
  }
  onChange(type, e) {
    const { form } = this.state;
    const formData = { ...form };
    formData[type] = e.target.value;
    this.setState({ form: formData });
  }
  render() {
    const { form } = this.state;
    return (
      <div className={styles.login}>
        <FormItem label="Username" value={form.username} onChange={this.onChange.bind(this, 'username')} placeholder="Username" />
        <FormItem label="Password" type="password" value={form.password} onChange={this.onChange.bind(this, 'password')} placeholder="Type your password" />
        <button type="button" className={styles.btn} onClick={this.login.bind(this)}>
          Login
        </button>
      </div>
    );
  }
}

const mapState = ({ global, account }) => ({
  test: global.test,
  token: global.token,
  userData: global.userData,
  message: account.message,
  loading: account.loading,
});

const mapDispatch = ({ account }) => ({
  logout: account.logout,
  login: account.login,
});

export default connect(mapState, mapDispatch)(Login);
