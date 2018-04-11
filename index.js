// 引入node-webkit API
let utils = require('./utils');
let SP = require('./serialport');
let HttpClient = require('./httpclient');

let connectionId;
let win;
let communityObj = getDomOBJ('community');
let buildObj = getDomOBJ('build');
let unitObj = getDomOBJ('unit');
let roomObj = getDomOBJ('room');
let idnumObj = getDomOBJ('idnum');
let telObj = getDomOBJ('tel');

DoServerHander = {
    saveData: function () {
        let userId = getDomOBJ('userId').value;
        let faceImg = getDomOBJ('faceImg').value;
        let faceFeature = getDomOBJ('faceFeature').value;
        let houseId = getDomOBJ('room').value;

        if (!userId) {
            alert('未查询到用户');
            return;
        }
        if (!faceImg) {
            alert('人脸图片信息不能为空');
            return;
        }
        if (!faceFeature) {
            alert('人脸数据不能为空');
            return;
        }
        HttpClient.sendRequest(HttpClient.SAVE_FACEPASS, HttpClient.POST, {
            'userId': userId,
            'faceImg': faceImg,
            'houseId':houseId,
            'faceFeature': faceFeature
        }).then(
            resolve => {
                alert(resolve.data);
            }, reject => {
                alert('保存数据失败' + reject);
            });
    },
    findCommunity: function () {
        /**
         * 处理下拉列表请求
         */
        doSelectRequest(HttpClient.COMMUNITY_LIST, HttpClient.GET, {}).then(resolve => {
            communityObj.innerHTML = resolve;
            DoServerHander.inputCommunity();

        }, reject => {
            alert('请求异常');
        });
    },
    /**
     * 处理小区改变后级联楼栋信息
     * @author anni
     */
    inputCommunity: function () {
        let communitySip = communityObj.value;
        /**
         * 处理下拉列表请求
         */
        doSelectRequest(HttpClient.BLOCK_LIST, HttpClient.GET, {'sipNum': communitySip}).then(resolve => {
            buildObj.innerHTML = resolve;
            DoServerHander.inputBuild();
        }, reject => {
            alert('请求异常' + reject);
        });
    },

    /**
     * 处理楼栋级联单元逻辑
     */
    inputBuild: function () {
        let blockSip = buildObj.value;
        /**
         * 处理下拉列表请求
         */
        doSelectRequest(HttpClient.BUILD_LIST, HttpClient.GET, {'sipNum': blockSip}).then(resolve => {
            unitObj.innerHTML = resolve;
            DoServerHander.inputUnit();
        }, reject => {
            alert('请求异常');
        });
    },
    /**
     * 处理楼栋级联单元逻辑
     */
    inputUnit: function () {
        let unitSip = unitObj.value;
        /**
         * 处理下拉列表请求
         */
        doSelectRequest(HttpClient.HOUSE_LIST, HttpClient.GET, {'sipNum': unitSip}).then(resolve => {

            roomObj.innerHTML = resolve;
        }, reject => {
            alert('请求异常');
        });
    },
    search: function () {
        let houseSip = roomObj.value;
        let tel = telObj.value;
        let idnum = idnumObj.value;
        tel = (tel == undefined) ? "" : tel;
        idnum = (idnum == undefined) ? "" : idnum;

        if (!houseSip) {
            alert('请选择房间');
            return;
        }
        if (!tel && !idnum) {
            alert('身份证和手机号请至少填写一个');
            return;
        }

        let URL = `${HttpClient.QUERY_USER}`;
        HttpClient.sendRequest(URL, HttpClient.GET, {'sipNum': houseSip, 'idnum': idnum, 'tel': tel}).then(
            res => {
                if (res && res.data) {
                    res = res.data;
                    let communityName = getSelectValue('community').text;
                    let buildName = getSelectValue('build').text;
                    let unitName = getSelectValue('unit').text;
                    let roomName = getSelectValue('room').text;
                    getDomOBJ('realName').innerText = res.realName;
                    getDomOBJ('cellphone').innerText = res.cellphone;
                    getDomOBJ('idCard').innerText = res.idnum;
                    getDomOBJ('userId').value = res.id;
                    getDomOBJ('fc').innerText = `${communityName}${buildName}${unitName}${roomName}`;
                    getDomOBJ('img').src= (res.faceImg)?res.faceImg:"timg.gif";
                }
                else {
                    alert('未查询到数据');
                    getDomOBJ('realName').innerText = '未查询到数据';
                    getDomOBJ('cellphone').innerText = '未查询到数据';
                    getDomOBJ('idCard').innerText = '未查询到数据';
                    getDomOBJ('fc').innerText = '未查询到数据';
                    getDomOBJ('img').src="timg.gif";
                    getDomOBJ('userId').value = '';//需清空该值,避免是上一个人id
                    getDomOBJ('faceImg').value = '';
                    getDomOBJ('faceFeature').value ='';
                }
            },
            err => {
                alert(`请求错误: ${err.message}`);
            });
    }
}

function doSelectRequest(url, method, data) {
    if (!url) return;
    getDomOBJ('userId').value= '';//注意需清空该值,避免是上一个人id
    getDomOBJ('faceImg').value='';
    getDomOBJ('faceFeature').value='';
    return new Promise((resolve, reject) => {
        HttpClient.sendRequest(url, method, data).then(
            res => {
                if (res && res.data) {
                    res = res.data;
                    //非空判断
                    if (res && res.length > utils.INT_0) {

                        let tempArr = [];
                        for (let ele of res) {
                            tempArr.push(`<option value="${ele.sipnum}">${ele.name}</option>`);
                        }
                        resolve(tempArr.join(''));
                    }
                    else {
                        resolve('');
                    }
                }
            },
            err => {

                resolve(err.message);
            });
    });
}

function closeWin() {
    if (confirm("确定本次退出?")) win.close();
}

try {
    let gui = require('nw.gui');
    win = gui.Window.get();

    let tempRes = '';
    let dataLen = utils.INT_0;
    let onReceiveCallback = function (info) {//串口数据接收函数
        let buf = info.data;

        let msg = getDomOBJ('message');
        let bufView = new Uint8Array(buf);

        for (let ele of bufView) {

            let temp = ele.toString(utils.INT_16);
            temp = temp.toUpperCase();
            if (temp.length == 1) temp = "0" + temp;
            tempRes += temp;
            let idx = tempRes.indexOf('FB');
            let lenstr = tempRes.substr(idx + utils.INT_2, utils.INT_4);

            //判断FB后的长度数据过来,此时需要算出长度
            if (lenstr) {
                lenstr = lenstr.substr(utils.INT_2, utils.INT_4) + lenstr.substr(utils.INT_0, utils.INT_2);
                dataLen = SP.HexToInt(lenstr);
                if (tempRes.length == dataLen * utils.INT_2) { //判断如果数据组装完整了
                    let data = SP.assemDATA(tempRes);

                    if (data.MSG_TYYP == '12') {
                        // 首先判断获取结果
                        if ('01FF' == data.CODE) {
                            alert('报文接收超时');
                            tempRes = "";
                            return;
                        }
                        if ('07FF' == data.CODE) {
                            alert('请求冲突');
                            tempRes = "";
                            return;
                        }
                        if ('12FF' == data.CODE) {
                            alert('数据库查询超时');
                            tempRes = "";
                            return;
                        }
                        if ('20FF' == data.CODE) {
                            alert('系统内存不足');
                            tempRes = "";
                            return;
                        }
                        if ('41FF' == data.CODE) {
                            alert('获取的数据不存在');
                            tempRes = "";
                            return;
                        }
                        if ('01FE' == data.CODE) {
                            alert('人员 ID 已经存在');
                            tempRes = "";
                            return;
                        }
                        if ('02FE' == data.CODE) {
                            alert('人员 ID 不存在');
                            tempRes = "";
                            return;
                        }
                        if ('03FE' == data.CODE) {
                            alert('人员没有注册人脸');
                            tempRes = "";
                            return;
                        }
                        if ('04FE' == data.CODE) {
                            alert('查询的人脸不存在');
                            tempRes = "";
                            return;
                        }
                        if ('05FE' == data.CODE) {
                            alert('人脸特征长度错误');
                            tempRes = "";
                            return;
                        }
                        if ('06FE' == data.CODE) {
                            alert('查询的人脸图片不存在');
                            tempRes = "";
                            return;
                        }

                        //如果获取数据成功
                        if ('0000' == data.CODE) {
                            //判断如果是采集人脸特征
                            if (data.CMD_TYPE == '1101') {
                                let code = data.DB.substr(utils.INT_0, utils.INT_2);
                                if (code == '00') { //采集中
                                    getDomOBJ('tip').innerText = '人脸才集中,请将脸对准摄像头';
                                }
                                else if (code == '01') {
                                    getDomOBJ('tip').innerText = '采集成功';
                                    getFaceDB();
                                }
                                else if (code == '02') {
                                    getDomOBJ('tip').innerText = '采集超时';
                                }
                            }
                            //判断如果是人脸图片的获取
                            else if (data.CMD_TYPE == '1301') {
                                getDomOBJ('faceImg').value = data.DB;
                                getDomOBJ('img').src = data.DB;
                            }
                            else if (data.CMD_TYPE == '1401') {//判断是人脸特征响应数据
                                getDomOBJ('faceFeature').value = data.DB;
                            }
                        }
                    }
                    // msg.innerHTML = `<p>类型:${data.CMD_TYPE}>>${tempRes}</p>`;
                    tempRes = "";
                    dataLen = utils.INT_0;
                }
            }
        }
    };

    var onConnect = function (connectionInfo) {
        chrome.serial.onReceive.addListener(onReceiveCallback);
        connectionId = connectionInfo.connectionId;
    };
    const BITRATE = 115200; //115200
    chrome.serial.connect('COM3', {bitrate: BITRATE}, onConnect);

    //默认初始化所有的小区
    DoServerHander.findCommunity();

}
catch (e) {
    console.log(e);
    alert('系统错误' + e.message);
}

function takePhoto() {

    if (!connectionId) {
        alert('USB串口未打开或冲突');
        return;
    }

    let registFaceBuffer = SP.registFace();
    chrome.serial.send(connectionId, registFaceBuffer, (res, error) => {
        getDomOBJ('tip').innerText = '数据请求中';
        SP.doErr(error);
    });
}

function getFaceDB() {
    if (!connectionId) {
        alert('USB串口未打开');
        return;
    }

    let featuresBuffer = SP.getFaceFeatures();
    chrome.serial.send(connectionId, featuresBuffer, (res, error) => {
        SP.doErr(error);
    });
    window.setTimeout(function () {
        var imageBuffer = SP.getFaceImage();
        chrome.serial.send(connectionId, imageBuffer, (res, error) => {
            SP.doErr(error);
        });
    }, utils.INT_1000);
}