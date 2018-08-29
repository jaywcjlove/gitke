import React, { PureComponent } from 'react';
import Prism from 'prismjs';

export default class Canvas extends PureComponent {
  constructor(props) {
    super(props);
    this.state = { html: props.value || '' };
  }
  componentDidMount() {
    const { value, language } = this.props;
    if (!language) return;
    let lang = language;
    switch (language) {
      case 'js': lang = 'javascript'; break;
      case 'sh': lang = 'powershell'; break;
      case 'shell': lang = 'powershell'; break;
      default: lang = language; break;
    }
    lang = lang.toLowerCase();
    return import(`prismjs/components/prism-${lang}.min.js`).then(() => {
      const html = Prism.highlight(value, Prism.languages[lang], lang);
      this.setState({ html });
    }).catch(() => {
      if (/^(html|htm|xml)/.test(lang)) {
        const html = Prism.highlight(value, Prism.languages.html, 'html');
        this.setState({ html });
      }
    });
  }
  render() {
    const { language } = this.props;
    return (
      <pre className="highlight">
        <code className={`language-${language}`} dangerouslySetInnerHTML={{ __html: this.state.html }} />
      </pre>
    );
  }
}
