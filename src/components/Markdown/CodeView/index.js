import React, { Component } from 'react';
import Prism from 'prismjs';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './styles/index.less';
import langs from '../../../utils/prismLang';
// https://github.com/github/linguist/blob/master/lib/linguist/languages.yml

export default class CodeView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      codeHtml: [],
      lang: '',
    };
  }
  componentDidMount() {
    const { lang } = this.props;
    let language = lang || 'markup';
    if (/(js)/.test(lang)) language = 'javascript';
    if (/(tsx)/.test(lang)) language = 'jsx';
    if (/(toml|gitconfig|editorconfig|gitmodules)/.test(lang)) language = 'ini';
    if (/(yml)/.test(lang)) language = 'yaml';
    if (/(styl)/.test(lang)) language = 'stylus';
    if (/(stylelintrc)/.test(lang)) language = 'json';
    if (/(sh|shell)/.test(lang)) language = 'powershell';
    console.log('language:', language);
    language = language.toLowerCase();

    if (/^(html|htm|xml|ejs)/.test(language)) {
      this.highlight('html');
      return;
    }
    if (!langs.includes(language)) {
      this.highlight(language);
      return;
    }
    console.log('language:', language);
    return import(`prismjs/components/prism-${language}.min.js`).then(() => {
      this.highlight(language);
    }).catch((err) => {
      throw (err);
    });
  }
  highlight(lang) {
    let html = this.props.value;
    if (Prism.languages[lang]) {
      html = Prism.highlight(this.props.value, Prism.languages[lang], lang);
    }
    this.setState({ html, lang });
  }
  getInstance(node) {
    if (node) this.code = node;
  }
  render() {
    const { lineHighlight, className } = this.props;
    const countLine = this.state.html ? this.state.html.split('\n') : [''];
    return (
      <pre ref={this.getInstance.bind(this)} data-line="1" className={classNames('highlight', className)}>
        <code style={{ height: countLine.length * 20 }} className={classNames(`language-${this.props.lang}`)} dangerouslySetInnerHTML={{ __html: this.state.html }} />
        {lineHighlight && countLine.map((item, idx) => {
          return (
            <div key={idx} id={`L${idx + 1}`} style={{ left: 0, top: idx * 20 }} className="line-number" data-start={idx + 1} />
          );
        })}
      </pre>
    );
  }
}

CodeView.propTypes = {
  lineHighlight: PropTypes.bool,
  value: PropTypes.string,
  lang: PropTypes.string,
};
CodeView.defaultProps = {
  lineHighlight: false,
  value: '',
  lang: 'markup',
};
