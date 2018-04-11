var utils = require('./utils');
const FB = 'FB';
const FACE_IMG_CMD = '1301';
const FACE_FEATURE_CMD = '1401';

/**
 * 报文数据实体类
 * @author anni
 */
class SerialDATA {
    constructor(LEN,MSG_TYYP,CMD_TYPE,CODE,DB){
        //报文总长度
        this.LEN = LEN;
        //消息类型人脸识别命令报文（0x01）、 疲劳（0x02）、 手势模块命令报文（0令报文(0x09)、响应报文(0x12)
        this.MSG_TYYP = MSG_TYYP ;
        //命令类型
        this.CMD_TYPE = CMD_TYPE ;
        //结果码
        this.CODE = CODE ;
        //消息主体数据
        this.DB =  DB;
    }
}

/**
 * 串口处理工具类
 * @author anni
 */
class SerialPort{
    constructor()
    {
    }


    static registFace(){
        let cmd = 'FB170000000000000001110100000100000000000000da';
        let buffer = SerialPort.assemCMD(cmd);
        return buffer;
    }

    /**
     * @author anni
     * 获取人脸特征数据
     */
    static getFaceFeatures ()
    {
        let cmd = 'FB170000000000000001140100000100000000000000d7';
        let buffer = SerialPort.assemCMD(cmd);
        return buffer;
    }

    /**
     * @author anni
     * 获取人脸图片
     */
    static getFaceImage(){
        let cmd = 'FB170000000000000001130100000100000000000000d8';
        let buffer = SerialPort.assemCMD(cmd);
        return buffer;
    }

    /**
     * 组装数据
     * @author anni
     */
    static  assemDATA(str){
        let spDATA;
        try{
            if (str)
            {
                let lenstr = str.substr(utils.INT_2,utils.INT_4);
                lenstr = lenstr.substr(utils.INT_2,utils.INT_4)+lenstr.substr(utils.INT_0,utils.INT_2);
                spDATA = new SerialDATA();
                spDATA.LEN = SerialPort.HexToInt(lenstr);
                //消息类型人脸识别命令报文（0x01）、 疲劳（0x02）、 手势模块命令报文（0令报文(0x09)、响应报文(0x12)
                spDATA.MSG_TYYP = str.substr(utils.INT_18,utils.INT_2) ;
                //命令类型
                spDATA.CMD_TYPE = str.substr(utils.INT_20,utils.INT_4) ;
                //结果码
                spDATA.CODE = str.substr(utils.INT_24,utils.INT_4) ;
                //消息主体数据
                //判断是否为获取图片或者人脸特征数据,如果是必须去掉4个字节的长度
                if (spDATA.CMD_TYPE==FACE_IMG_CMD){
                    str = str.substr(utils.INT_36,str.length-utils.INT_36-utils.INT_2);
                    let arr2 = [];
                    let len2  = str.length / utils.INT_2;
                    for (let i=utils.INT_0;i<len2;i++)
                    {
                        arr2[i] = '0x'+str.substr(i*utils.INT_2,utils.INT_2);
                    }
                    var img = `data:image/png;base64,${new Buffer(arr2).toString('base64')}`;
                    spDATA.DB = img;
                }
                else if (spDATA.CMD_TYPE== FACE_FEATURE_CMD){ //否则如果是人脸特征采集
                    spDATA.DB =  str.substr(utils.INT_36,str.length-utils.INT_36-utils.INT_2);
                }
                else{
                    spDATA.DB =  str.substr(utils.INT_28,str.length-utils.INT_28-utils.INT_2);
                }
            }

            //alert(`len=${spDATA.LEN},msgType=${spDATA.MSG_TYYP},cmdType=${spDATA.CMD_TYPE},code=${spDATA.CODE},db=${spDATA.DB}`);
        }
        catch (e){
            alert(e.message);
        }

        return spDATA;
    }

    /**
     * 组装命令,准备发送数据
     * @author anni
     * @param str
     */
    static assemCMD(str){
        let arr = [];
        let len  = str.length / utils.INT_2;
        for (let i=utils.INT_0;i<len;i++)
        {
            arr[i] = `0x${str.substr(i*utils.INT_2,utils.INT_2)}`;
        }
        let buffer = new ArrayBuffer(arr.length);
        let dataView = new DataView(buffer);
        for (let i=utils.INT_0;i<len;i++){
            dataView.setUint8(i, arr[i]);
        }
        return buffer;
    }
    static HexToInt(str){
        return  parseInt(str,utils.INT_16).toString(utils.INT_10);
    }
    static doErr(error){
        if (error){
            if (error.disconnected){
                alert('连接已断开');
            }
            else if(error.pending){
                alert('发送操作正在进行');
            }
            else if(error.timeout){
                alert('发送操作超时');
            }
            else if(error.system_error){
                alert('发生系统错误，连接可能无法恢复');
            }
        }
    }

}

module.exports = SerialPort;