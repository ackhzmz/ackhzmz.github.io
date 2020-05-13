<?php
$key = "key";
//T1后端云Key（必填）
$token = "token";
//T1后端云Token（必填）
$user = $_POST["user"];
//登录账号（必填）
$pass = $_POST["pass"];
//登录密码（必填）
$imei = "";
//imei设备号（非必填）
$token = $key.$user.$pass.$imei.$token;
//需要MD5加密的参数
$token = md5($token);
//MD5加密
$url ="http://t1.huayi-w.cn/user_info.json?type=info&key=".$key."&user=".$user."&pass=".$pass."&imei=".$imei."&token=".$token;
//拼接T1后端云接口完整url
$data = file_get_contents($url);
//get请求接口
echo $data;
?>