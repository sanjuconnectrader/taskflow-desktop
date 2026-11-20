const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const {EventEmitter}=require('node:events');

test('a dismissed popup can still download, verify and restart through Notifications',async()=>{
  const updater=new EventEmitter();
  let downloads=0,restarts=0,dialogs=0;
  Object.assign(updater,{setFeedURL(){},async checkForUpdates(){updater.emit('update-available',{version:'1.1.0'});return {updateInfo:{version:'1.1.0'}};},async downloadUpdate(){downloads++;updater.emit('update-downloaded');},quitAndInstall(){restarts++;}});
  const context={module:{exports:{}},__dirname:__dirname,process:{platform:'win32'},setInterval:()=>({unref(){}}),require(name){
    if(name==='electron') return {app:{isPackaged:true,getVersion:()=> '1.0.0'},dialog:{async showMessageBox(){dialogs++;return {response:1};}}};
    if(name==='electron-updater') return {autoUpdater:updater};
    if(name==='node:fs') return {readFileSync:()=>JSON.stringify({apiOrigin:'https://api.example.com'})};
    return require(name);
  }};
  vm.runInNewContext(fs.readFileSync(require.resolve('../src/updates.cjs'),'utf8'),context);
  const session=context.module.exports(()=>({webContents:{send(){}},setProgressBar(){}}));
  session('session-token');await new Promise(resolve=>setImmediate(resolve));
  assert.equal(dialogs,1);assert.equal(downloads,0);
  await session.install();
  assert.equal(downloads,1);assert.equal(restarts,0);
  await session.install();assert.equal(restarts,1);
  assert.equal(updater.requestHeaders.Authorization,'Bearer session-token');
  session(null);await assert.rejects(()=>session.install(),/sign in/);
});
