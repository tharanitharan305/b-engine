const fs=require("fs");
module.exports=function saveJson(json){
    json=JSON.stringify(json);
    fs.writeFileSync("./output.json",json);
}