import React, { Component } from 'react';
import Prism from 'prismjs';
import classNames from 'classnames';
import styles from './index.less';
import langs from '../../utils/prismLang';
// https://github.com/github/linguist/blob/master/lib/linguist/languages.yml

class CodeView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      codeHtml: [],
      lang: '',
    };
  }
  componentDidMount() {
    const { lang } = this.props;
    let language = lang;
    if (/(js)/.test(lang)) language = 'javascript';
    if (/(tsx)/.test(lang)) language = 'jsx';
    if (/(toml|gitconfig|editorconfig|gitmodules)/.test(lang)) language = 'ini';
    if (/(yml)/.test(lang)) language = 'yaml';
    if (/(stylelintrc)/.test(lang)) language = 'json';
    if (/(sh|shell)/.test(lang)) language = 'powershell';
    language = language.toLowerCase();

    if (/^(html|htm|xml|ejs)/.test(language)) {
      this.highlight('html');
      return;
    }
    if (!langs.includes(language)) {
      this.highlight(language);
      return;
    }

    return import(`prismjs/components/prism-${language}.min.js`).then(() => {
      this.highlight(language);
    }).catch((err) => {
      throw (err);
    });
  }
  highlight(lang) {
    let html = this.props.source;
    if (Prism.languages[lang]) {
      html = Prism.highlight(this.props.source, Prism.languages[lang], lang);
    }
    this.setState({ html, lang });
  }
  getInstance(node) {
    if (node) this.code = node;
  }
  render() {
    const countLine = this.state.html ? this.state.html.split('\n') : [];
    return (
      <div className={styles.highlight}>
        <pre ref={this.getInstance.bind(this)} data-line="1" className={classNames(`language-${this.state.lang}`)}>
          <code style={{ height: countLine.length * 20 }} dangerouslySetInnerHTML={{ __html: this.state.html }} />
          {countLine.map((item, idx) => {
            return (
              <div key={idx} id={`L${idx + 1}`} style={{ left: 0, top: idx * 20 }} className="line-number" data-start={idx + 1} />
            );
          })}
        </pre>
      </div>
    );
  }
}

export default CodeView;
