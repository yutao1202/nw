let http = require('http');
let querystring = require('querystring');

//云服务接口地址
const SERVER_PATH = '127.0.0.1';
const PORT = '8080';
const PROJECT_NAME = 'smartcommunity';
//获取小区列表
const COMMUNITY_LIST = `/${PROJECT_NAME}/facepass/querycommunity`;

//通过小区获取楼栋
const BLOCK_LIST = `/${PROJECT_NAME}/facepass/getblockbycommunity`;

//通过楼栋获取单元
const BUILD_LIST = `/${PROJECT_NAME}/facepass/getbuildbyblock`;

//通过单元获取房间
const HOUSE_LIST = `/${PROJECT_NAME}/facepass/gethousebybuild`;
//搜索
const QUERY_USER = `/${PROJECT_NAME}/facepass/gethousebysearch`;

const SAVE_FACEPASS = `/${PROJECT_NAME}/facepass/update`;

const POST = 'POST';
const GET = 'GET';
const CONTENTTYPE = 'application/x-www-form-urlencoded';
const DATA = 'data';
const END = 'end';
const ERROR = 'error';
const CHARTSET = 'utf8';
module.exports = {POST, GET, SERVER_PATH, COMMUNITY_LIST, BLOCK_LIST, BUILD_LIST, HOUSE_LIST, QUERY_USER,SAVE_FACEPASS,
    sendRequest: function (url, method, data={}) {
        const postData = querystring.stringify(data);
        url = (postData) ? `${url}?${postData}` : url;
        const options = {
            hostname: SERVER_PATH,
            port: PORT,
            path: url,
            method: method,
            headers: { 'Content-Type': CONTENTTYPE, 'Content-Length': Buffer.byteLength(postData)}
        };
        return new Promise((resolve, reject) => {
            let post = '';
            const req = http.request(options, (res) => {
                res.setEncoding(CHARTSET);
                res.on(DATA, (chunk) => {  post+=chunk;});
                res.on(ERROR,e=>{reject(e.message);});
                res.on(END,function(){ resolve((post)?JSON.parse(post):'');});
            });
            req.on(ERROR, e=> {reject(e.message);});
            req.write(postData);
            req.end();
        });
    }
};