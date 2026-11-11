const {app, dialog} = require('electron');
const {autoUpdater} = require('electron-updater');
const fs = require('node:fs');
const path = require('node:path');

module.exports = function setupUpdates(getWindow) {
  let apiOrigin, session, checking=false, promptedVersion=null, downloaded=false;
  try { apiOrigin=JSON.parse(fs.readFileSync(path.join(__dirname,'../web/update-config.json'),'utf8')).apiOrigin; } catch { return () => {}; }
  if(!app.isPackaged || process.platform!=='win32' || !/^https:\/\//.test(apiOrigin)) return () => {};
  autoUpdater.setFeedURL({provider:'generic',url:`${apiOrigin}/api/v1/updates/desktop/assets`});
  autoUpdater.autoDownload=false;
  autoUpdater.autoInstallOnAppQuit=false;
  autoUpdater.disableDifferentialDownload=true;
  const status=(state,extra={})=>getWindow()?.webContents.send('update:status',{state,...extra});
  autoUpdater.on('update-available',async info=>{
    if(promptedVersion===info.version) return;
    promptedVersion=info.version;
    const choice=await dialog.showMessageBox(getWindow(),{type:'info',title:'New Update Available',message:'New Update Available',detail:'A new version of TaskFlow is available with improvements, new features, and bug fixes.',buttons:['Update Now','Remind Me Later'],defaultId:0,cancelId:1,noLink:true});
    if(choice.response===0) {
      status('downloading',{percent:0});
      try {await autoUpdater.downloadUpdate();} catch {status('error'); await dialog.showMessageBox(getWindow(),{type:'error',message:'The update could not be downloaded or verified.',detail:'Please try again later.'});}
    }
  });
  autoUpdater.on('download-progress',progress=>{getWindow()?.setProgressBar(progress.percent/100);status('downloading',{percent:Math.round(progress.percent)});});
  autoUpdater.on('update-downloaded',async()=>{
    downloaded=true;getWindow()?.setProgressBar(-1);status('ready');
    const choice=await dialog.showMessageBox(getWindow(),{type:'info',message:'Update ready to install',detail:'Restart TaskFlow to finish installing the integrity-checked update.',buttons:['Install and Restart','Later'],defaultId:0,cancelId:1,noLink:true});
    if(choice.response===0 && downloaded) autoUpdater.quitAndInstall(false,true);
  });
  autoUpdater.on('error',()=>{getWindow()?.setProgressBar(-1);status('error');});
  async function check(){
    if(!session || checking || downloaded) return;
    checking=true;autoUpdater.requestHeaders={Authorization:`Bearer ${session}`};
    try {await autoUpdater.checkForUpdates();} catch {status('unavailable');} finally {checking=false;}
  }
  const timer=setInterval(check,6*60*60*1000);timer.unref();
  return value=>{session=value;if(value) check();};
};
