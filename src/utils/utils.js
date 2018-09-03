// 拼接url参数
function splitUrl(url, options) {
  let urlNew = url;
  const paramsArray = [];
  // Object.keys(options).forEach(key => paramsArray.push(key + '=' + options[key]));
  Object.keys(options).forEach(key => paramsArray.push(`${key}=${options[key]}`));
  if (Object.keys(options).length === 0) {
    return url;
  }
  if (/\?/.test(urlNew) === false) {
    urlNew = `${urlNew}?${paramsArray.join('&')}`;
  } else {
    urlNew += `&${paramsArray.join('&')}`;
  }
  return urlNew;
}

//  /user/23/info => [
//   {
//     name: 'user',
//     path: '/user'
//   },{
//     name: '23',
//     path: '/user/23'
//   }, {
//     name: 'info',
//     path: '/user/23/info'
//   }
// ]
function urlToList(url) {
  const urllist = url.split('/').filter(i => i);
  return urllist.map((urlItem, index) => {
    return {
      name: urlItem,
      path: `/${urllist.slice(0, index + 1).join('/')}`,
    };
  });
}


function bytesToSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1000; // or 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = (bytes / (k ** i)).toPrecision(3);
  return `${parseFloat(size)} ${sizes[i]}`;
}

export {
  splitUrl,
  urlToList,
  bytesToSize,
};
