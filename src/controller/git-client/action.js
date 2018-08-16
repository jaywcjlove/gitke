
const through = require('through2');
const zlib = require('zlib');
const encodings = {
  'gzip': function () { return zlib.createGunzip(); },
  'deflate': function () { return zlib.createDeflate(); }
};

const headerRE = {
  'receive-pack': '([0-9a-fA-F]+) ([0-9a-fA-F]+)'
    + ' refs\/(heads|tags)\/(.*?)( |00|\u0000)'
    + '|^(0000)$',
  'upload-pack': '^\\S+ ([0-9a-fA-F]+)'
};

const services = ['upload-pack', 'receive-pack'];

module.exports = async (ctx) => {
  const { service } = ctx.params;
  ctx.assert(services.indexOf(service) > -1, 405, 'service not avaiable')
  ctx.set('content-type', 'application/x-git-' + service + '-result');

  ctx.set('expires', 'Fri, 01 Jan 1980 00:00:00 GMT');
  ctx.set('pragma', 'no-cache');
  ctx.set('cache-control', 'no-cache, max-age=0, must-revalidate');

  const buffered = through().pause();
  const tmp = through();
  // const decoder = encodings[ctx.get('content-encoding')] || encodings[ctx.get('content-encoding')]();
  
  console.log('decoder:', ctx.get('content-encoding'));
}