const DB_NAME = 'SIPETA_DATABASE';
const SHEETS = {
  Users:['id','name','email','phone','passwordHash','province','district','village','role','createdAt'],
  Farms:['id','userId','name','province','district','village','area','plantYear','landType','plantStatus','plantCount','spacing','createdAt'],
  Calculations:['id','userId','farmId','date','status','period','itemsJson','totalKg','totalCost','createdAt'],
  Activities:['id','userId','farmId','date','fertilizer','dose','quantityKg','area','workers','cost','status','notes','createdAt'],
  Schedules:['id','userId','farmId','date','title','fertilizer','status','notes','createdAt'],
  Inventory:['id','userId','fertilizer','stockKg','pricePerKg','updatedAt']
};

function doGet() {
  initializeDatabase_();
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('SIPETA — Sistem Informasi Pemupukan')
    .addMetaTag('viewport','width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function initializeDatabase_(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEETS).forEach(name=>{
    let sh=ss.getSheetByName(name);
    if(!sh){sh=ss.insertSheet(name); sh.appendRow(SHEETS[name]); sh.setFrozenRows(1); sh.getRange(1,1,1,SHEETS[name].length).setFontWeight('bold').setBackground('#063B2E').setFontColor('#ffffff');}
  });
}
function db_(){ initializeDatabase_(); return SpreadsheetApp.getActiveSpreadsheet(); }
function sheet_(name){return db_().getSheetByName(name);}
function rows_(name){
  const sh=sheet_(name), vals=sh.getDataRange().getValues();
  if(vals.length<2)return [];
  const headers=vals[0];
  return vals.slice(1).filter(r=>r[0]).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]])));
}
function append_(name,obj){
  const sh=sheet_(name), headers=SHEETS[name];
  sh.appendRow(headers.map(h=>obj[h]===undefined?'':obj[h]));
}
function id_(){return Utilities.getUuid();}
function json_(data){return JSON.stringify(data);}
function hash_(str){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,str,Utilities.Charset.UTF_8).map(b=>(b+256).toString(16).slice(-2)).join('');}
function safeUser_(u){const {passwordHash,...safe}=u;return safe;}
function register(payload){
  initializeDatabase_();
  if(!payload||!payload.name||!payload.email||!payload.password)throw new Error('Lengkapi data wajib.');
  if(payload.password!==payload.confirmPassword)throw new Error('Konfirmasi password tidak sama.');
  const email=String(payload.email).trim().toLowerCase();
  if(rows_('Users').some(u=>String(u.email).toLowerCase()===email))throw new Error('Email sudah terdaftar.');
  const user={id:id_(),name:String(payload.name).trim(),email,phone:payload.phone||'',passwordHash:hash_(payload.password),province:payload.province||'',district:payload.district||'',village:payload.village||'',role:payload.role||'pekebun',createdAt:new Date()};
  append_('Users',user);
  return {ok:true,user:safeUser_(user)};
}
function login(email,password){
  const u=rows_('Users').find(x=>String(x.email).toLowerCase()===String(email).trim().toLowerCase()&&x.passwordHash===hash_(password));
  if(!u)throw new Error('Email atau password salah.');
  const token=id_();
  CacheService.getScriptCache().put('sipeta_'+token,u.id,21600);
  return {token,user:safeUser_(u)};
}
function auth_(token){
  const uid=CacheService.getScriptCache().get('sipeta_'+token);
  if(!uid)throw new Error('Sesi berakhir. Silakan masuk kembali.');
  const u=rows_('Users').find(x=>x.id===uid);
  if(!u)throw new Error('Akun tidak ditemukan.');
  return u;
}
function logout(token){CacheService.getScriptCache().remove('sipeta_'+token);return {ok:true};}
function getAppData(token){
  const u=auth_(token), uid=u.id;
  const farms=rows_('Farms').filter(x=>x.userId===uid);
  const calculations=rows_('Calculations').filter(x=>x.userId===uid);
  const activities=rows_('Activities').filter(x=>x.userId===uid);
  const schedules=rows_('Schedules').filter(x=>x.userId===uid);
  const inventory=rows_('Inventory').filter(x=>x.userId===uid);
  return {user:safeUser_(u),farms,calculations,activities,schedules,inventory};
}
function saveFarm(token,p){
  const u=auth_(token); p=p||{};
  const farm={id:p.id||id_(),userId:u.id,name:p.name||'Kebun Baru',province:p.province||'',district:p.district||'',village:p.village||'',area:Number(p.area)||0,plantYear:Number(p.plantYear)||new Date().getFullYear(),landType:p.landType||'Mineral',plantStatus:p.plantStatus||'TBM',plantCount:Number(p.plantCount)||0,spacing:p.spacing||'9 x 9 x 9',createdAt:new Date()};
  const sh=sheet_('Farms'), all=rows_('Farms'), old=all.find(x=>x.id===farm.id&&x.userId===u.id);
  if(old){const vals=sh.getDataRange().getValues(),idx=vals.findIndex(r=>r[0]===farm.id); if(idx>0)sh.getRange(idx+1,1,SHEETS.Farms.length).setValues([SHEETS.Farms.map(h=>farm[h]===undefined?'':farm[h])]);}
  else append_('Farms',farm);
  return farm;
}
function deleteFarm(token,id){
  const u=auth_(token),sh=sheet_('Farms'),vals=sh.getDataRange().getValues();
  for(let i=vals.length-1;i>=1;i--)if(vals[i][0]===id&&vals[i][1]===u.id)sh.deleteRow(i+1);
  return {ok:true};
}
function saveCalculation(token,p){
  const u=auth_(token); p=p||{};
  const rec={id:id_(),userId:u.id,farmId:p.farmId||'',date:p.date||new Date(),status:'Rencana',period:p.period||'Tahunan',itemsJson:JSON.stringify(p.items||[]),totalKg:Number(p.totalKg)||0,totalCost:Number(p.totalCost)||0,createdAt:new Date()};
  append_('Calculations',rec); return rec;
}
function saveActivity(token,p){
  const u=auth_(token);p=p||{};
  const rec={id:id_(),userId:u.id,farmId:p.farmId||'',date:p.date||new Date(),fertilizer:p.fertilizer||'',dose:Number(p.dose)||0,quantityKg:Number(p.quantityKg)||0,area:Number(p.area)||0,workers:Number(p.workers)||0,cost:Number(p.cost)||0,status:p.status||'Terlaksana',notes:p.notes||'',createdAt:new Date()};
  append_('Activities',rec);return rec;
}
function saveSchedule(token,p){
  const u=auth_(token);p=p||{};
  const rec={id:id_(),userId:u.id,farmId:p.farmId||'',date:p.date||'',title:p.title||'Pemupukan',fertilizer:p.fertilizer||'',status:p.status||'Terjadwal',notes:p.notes||'',createdAt:new Date()};
  append_('Schedules',rec);return rec;
}
function saveInventory(token,p){
  const u=auth_(token);p=p||{};
  const sh=sheet_('Inventory'),all=rows_('Inventory');
  const old=all.find(x=>x.userId===u.id&&x.fertilizer===p.fertilizer);
  const rec={id:old?old.id:id_(),userId:u.id,fertilizer:p.fertilizer||'',stockKg:Number(p.stockKg)||0,pricePerKg:Number(p.pricePerKg)||0,updatedAt:new Date()};
  if(old){const vals=sh.getDataRange().getValues(),idx=vals.findIndex(r=>r[0]===old.id);sh.getRange(idx+1,1,SHEETS.Inventory.length).setValues([SHEETS.Inventory.map(h=>rec[h]===undefined?'':rec[h])]);}
  else append_('Inventory',rec);
  return rec;
}
function getPublicEducation(){return [
 {name:'Urea',nutrient:'Nitrogen (N) ± 46%',function:'Mendukung pertumbuhan vegetatif dan pembentukan daun.'},
 {name:'NPK',nutrient:'Nitrogen, Fosfor, Kalium',function:'Memberikan beberapa unsur hara makro dalam satu formulasi.'},
 {name:'MOP / KCl',nutrient:'Kalium (K₂O)',function:'Mendukung pengisian buah dan ketahanan tanaman.'},
 {name:'Kieserite',nutrient:'Magnesium (MgO) dan Sulfur (S)',function:'Mendukung pembentukan klorofil dan metabolisme tanaman.'},
 {name:'Dolomit',nutrient:'Kalsium (CaO) dan Magnesium (MgO)',function:'Sumber Ca dan Mg; penggunaannya perlu mempertimbangkan kondisi tanah.'},
 {name:'Borat',nutrient:'Boron (B)',function:'Unsur mikro penting; dosis harus mengikuti rekomendasi agronomis.'}
];}
