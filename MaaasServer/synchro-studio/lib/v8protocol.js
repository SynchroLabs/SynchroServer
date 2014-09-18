﻿// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// RDD - originally derived from code in Node.js internal _debugger module
//       https://github.com/joyent/node/blob/master/lib/_debugger.js
//
var logger = require('log4js').getLogger("dbg-v8-pro");

module.exports = Protocol;
function Protocol() 
{
    this._newRes();
}
exports.Protocol = Protocol;

Protocol.prototype._newRes = function(raw) 
{
    this.res = { raw: raw || '', headers: {} };
    this.state = 'headers';
    this.reqSeq = 1;
    this.execute('');
    this.chunkCount = 0;
};

// !!! This needs work.  Header buffer plus array of body buffers, which get join()ed at the end should
//     be a big improvement.
//
// When getting a large response body, for example, "scripts" with includeSource, there can be a very
// large number of body chunks.  In my example (260 scripts with total body size of 5Mb), the response was
// received in approximately 650 chunks on my local Node instance and took 700ms.  However, on Azure the 
// response was received in 65,000+ chunks and took 119 seconds.  My theory is that the appending string
// builder is at fault here.
//

Protocol.prototype.execute = function(d) 
{
    var res = this.res;
    res.raw += d;

    //logger.debug("Got chunk " + this.chunkCount + " of length: " + d.length + " bytes");
    this.chunkCount += 1;

    switch (this.state) 
    {
        case 'headers':
            var endHeaderIndex = res.raw.indexOf('\r\n\r\n');

            if (endHeaderIndex < 0) break;

            var rawHeader = res.raw.slice(0, endHeaderIndex);
            var endHeaderByteIndex = Buffer.byteLength(rawHeader, 'utf8');
            var lines = rawHeader.split('\r\n');
            for (var i = 0; i < lines.length; i++) 
            {
                var kv = lines[i].split(/: +/);
                res.headers[kv[0]] = kv[1];
            }

            this.contentLength = +res.headers['Content-Length'];
            this.bodyStartByteIndex = endHeaderByteIndex + 4;

            this.state = 'body';

            var len = Buffer.byteLength(res.raw, 'utf8');
            if (len - this.bodyStartByteIndex < this.contentLength) 
            {
                break;
            }
            // pass thru

        case 'body':
            var resRawByteLength = Buffer.byteLength(res.raw, 'utf8');

            if (resRawByteLength - this.bodyStartByteIndex >= this.contentLength) 
            {
                var buf = new Buffer(resRawByteLength);
                buf.write(res.raw, 0, resRawByteLength, 'utf8');
                res.body = buf.slice(this.bodyStartByteIndex, this.bodyStartByteIndex + this.contentLength).toString('utf8');
                // JSON parse body?
                res.body = res.body.length ? JSON.parse(res.body) : {};

                logger.debug("Got response to command: " + res.body.command + " with length: " + this.contentLength + " bytes in " + this.chunkCount + " chunks");

                // Done!
                this.onResponse(res);

                this._newRes(buf.slice(this.bodyStartByteIndex + this.contentLength).toString('utf8'));
            }
            break;

        default:
            throw new Error('Unknown state');
            break;
    }
};

Protocol.prototype.serialize = function(req) 
{
    req.type = 'request';
    req.seq = this.reqSeq++;
    var json = JSON.stringify(req);
    return 'Content-Length: ' + Buffer.byteLength(json, 'utf8') + '\r\n\r\n' + json;
};