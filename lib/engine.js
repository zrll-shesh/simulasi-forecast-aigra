const P=["temperature","humidity","carbondioxide"],L={temperature:"Suhu",humidity:"Kelembapan",carbondioxide:"CO2"},U={temperature:"°C",humidity:"%",carbondioxide:" ppm"},D={temperature:1,humidity:1,carbondioxide:0};
const T={temperature:{mk:18,mp:22,Mp:28,Mk:30},humidity:{mk:70,mp:80,Mp:90,Mk:98},carbondioxide:{mk:1,mp:500,Mp:1000,Mk:1500}};
// Dua sumber threshold: profil Inkubasi (automation_mode true) dan device Threshold manual (false). Ganti nilai manual sesuai device.
const THR={inkubasi:JSON.parse(JSON.stringify(T)),threshold_manual:JSON.parse(JSON.stringify(T))};
const MAPE={temperature:.28,humidity:.61,carbondioxide:1.46},MULT={5:.6,10:.8,15:1,30:1.4,60:2,180:3,360:4,1440:3,4320:4,10080:6};
const MARG={temperature:.5,humidity:1,carbondioxide:15},EPS={temperature:.5,humidity:1.5,carbondioxide:40};
const ACT={"temperature|atas":["exhaust fan","ventilasi"],"humidity|bawah":["sprayer (mist)","menaikkan kelembapan"],"humidity|atas":["exhaust fan","menurunkan kelembapan dan mencegah jamur kontaminan"],"carbondioxide|atas":["blower atau exhaust fan","sirkulasi udara"]};
const DMP={"temperature|atas":"Suhu terlalu tinggi dapat membuat miselium stres dan memperlambat pertumbuhan.","temperature|bawah":"Suhu terlalu rendah memperlambat pertumbuhan miselium.","humidity|bawah":"Kelembapan terlalu rendah membuat media tanam cepat kering dan menghambat miselium.","humidity|atas":"Kelembapan terlalu tinggi meningkatkan risiko jamur kontaminan.","carbondioxide|atas":"CO2 yang tinggi menandakan sirkulasi udara kurang baik di dalam kumbung.","carbondioxide|bawah":"Nilai CO2 terlalu rendah tidak lazim, sebaiknya periksa sensor."};
const G0={5:[27.4,85.1,873],10:[27.4,84.9,865],15:[27.7,86.1,862],30:[27.8,85.5,867],60:[28.2,82.9,900],180:[29.9,81.3,942],360:[29.2,80.1,831],1440:[24.9,81.3,1106],4320:[25.2,85.1,1064],10080:[25.2,87.1,839]};
const MS=Object.keys(G0).map(Number),H6=[60,180,360],A0=[27.2,84.6,879];
const SCN={"Suhu naik (contoh utama)":()=>[A0,G0],"Semua aman":()=>[[25.4,85.2,760],Object.fromEntries(MS.map(m=>[m,[25.4,85.2,760]]))],
"Dua parameter bermasalah":()=>{const g=JSON.parse(JSON.stringify(G0));g[15][0]=28.6;g[30][1]=79.2;return[A0,g]},
"Sudah di luar Normal":()=>{const g=JSON.parse(JSON.stringify(G0));[5,10,15,30].forEach(m=>g[m][0]=29.2);return[[28.9,84.6,879],g]}};
const R={"Kumbung 1":{n:79,w:21,p1:"pukul 13:00-15:00, terutama suhu yang cenderung terlalu tinggi (sekitar 68% waktu pada jam tersebut)",p2:"pukul 01:00-03:00, terutama suhu yang cenderung terlalu rendah (sekitar 33% waktu pada jam tersebut)",b:"lebih stabil pada suhu dan kelembapan, tetapi lebih sering berstatus Peringatan atau Kritis pada CO2"},
"Kumbung 2":{n:76,w:24,p1:"pukul 13:00-15:00, terutama suhu yang cenderung terlalu tinggi (sekitar 62% waktu pada jam tersebut)",p2:"pukul 01:00-03:00, terutama suhu yang cenderung terlalu rendah (sekitar 45% waktu pada jam tersebut)",b:"lebih sering berstatus Peringatan atau Kritis pada kelembapan"},
"Kumbung 3":{n:82,w:18,p1:"pukul 13:00-15:00, terutama suhu yang cenderung terlalu tinggi (sekitar 65% waktu pada jam tersebut)",p2:"",b:"lebih stabil pada kelembapan dan CO2, tetapi lebih sering berstatus Peringatan atau Kritis pada suhu"}};
const f=(p,v)=>v.toFixed(D[p])+U[p],nm=p=>p=="carbondioxide"?"CO2":L[p].toLowerCase(),$=id=>document.getElementById(id);
const idl=(p,t)=>(t[p].mp+t[p].Mp)/2,st=(p,v,t)=>{const x=t[p];return v<=x.mk||v>=x.Mk?"Kritis":v<x.mp||v>x.Mp?"Peringatan":"Normal"};
const sisi=(p,v,t)=>v>=idl(p,t)?"atas":"bawah",bp=(p,v,t)=>sisi(p,v,t)=="atas"?t[p].Mp:t[p].mp,bk=(p,v,t)=>sisi(p,v,t)=="atas"?t[p].Mk:t[p].mk;
const FW=0.2,mg=(p,t)=>FW*(t[p].Mp-t[p].mp)/2;
const r6=x=>Math.round(x*1e6)/1e6;
const near=(p,v,t)=>st(p,v,t)=="Normal"&&(r6(t[p].Mp-v)<r6(mg(p,t))||r6(v-t[p].mp)<r6(mg(p,t)));
const tek=(p,v,t)=>{const i=idl(p,t),x=t[p];return Math.abs(v-i)/(v>=i?x.Mp-i:i-x.mp)};
const skor=(p,v,t)=>{const i=idl(p,t),x=t[p],tol=v>=i?x.Mp-i:i-x.mp,jk=v>=i?x.Mk-i:i-x.mk,j=Math.abs(v-i);return j<=tol?100:j>=jk?0:100*(1-(j-tol)/(jk-tol))};
const bobot=m=>{const inv=P.map(p=>1/(MAPE[p]*MULT[m])),s=inv.reduce((a,b)=>a+b);return Object.fromEntries(P.map((p,i)=>[p,inv[i]/s]))};
const gab=(m,v,t)=>{const b=bobot(m);return P.reduce((a,p)=>a+skor(p,v[p],t)*b[p],0)};
const conf=m=>m<=360?"Tinggi":m<=4320?"Sedang":"Sedang-Rendah",hz=m=>m<60?m+" menit":m<1440?m/60+" jam":m/1440+" hari";
const clock=(n,m)=>{const x=(n+m)%1440;return String(Math.floor(x/60)).padStart(2,"0")+":"+String(x%60).padStart(2,"0")};
const HARI=["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"],BLN=["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
function act(p,s,auto,k,w){const a=ACT[p+"|"+s];if(!a)return[`Tidak ada perangkat pengendali untuk kondisi ini, pantau ${nm(p)} secara manual.`,null];
const[n,tj]=a,N=n[0].toUpperCase()+n.slice(1);
const A={pd:`Sistem akan menyalakan ${n} secara otomatis sebelum pukul ${w} untuk ${tj}. Tidak perlu tindakan manual, cukup pastikan ${n} berstatus Otomatis.`,ps:`Sistem sedang mengaktifkan ${n} secara otomatis untuk ${tj}. Pantau apakah nilainya mulai membaik dalam beberapa menit.`,m:`${N} akan aktif otomatis saat nilai menyentuh batas, perkiraan paling lambat pukul ${w}. Pastikan perangkat dalam kondisi siap.`,w:`${N} akan aktif otomatis jika ${nm(p)} menyentuh batas. Belum perlu tindakan manual.`,l:`${N} diperkirakan lebih sering aktif otomatis ${w}. Pastikan perangkat dalam kondisi baik dan siap bekerja.`};
const M={pd:`Persiapkan ${n} dan nyalakan sebelum pukul ${w} untuk ${tj}.`,ps:`Nyalakan ${n} sekarang untuk ${tj}.`,m:`Persiapkan ${n} dan nyalakan sebelum pukul ${w} untuk ${tj}.`,w:`Pantau ${nm(p)}, dan siapkan ${n} jika terus mendekati batas.`,l:`Siapkan jadwal pengoperasian ${n} untuk ${tj} ${w}.`};
return[(auto?A:M)[k],{n,tj,by:auto?"sistem":"operator",kap:{ps:"sekarang",pd:"sebelum pukul "+w,m:"sebelum pukul "+w,w:"jika mendekati batas",l:w}[k]}]}
function jp(S){const{t,auto,a,g,now}=S;let K=[];
for(const p of P)for(const m of [5,10,15,30]){const v=g[m][p],s=st(p,v,t);if(s!="Normal"||near(p,v,t)){K.push({p,m,v,s,sd:sisi(p,v,t),sk:skor(p,v,t),tk:tek(p,v,t)});break}}
if(!K.length){const gp=p=>Math.min(...[a[p],...[5,10,15,30].map(m=>g[m][p])].map(v=>Math.min(t[p].Mp-v,v-t[p].mp)));
return{tone:"ok",judul:"Kondisi kumbung stabil dan aman",ring:`Suhu ${f("temperature",a.temperature)}, kelembapan ${f("humidity",a.humidity)}, dan CO2 ${f("carbondioxide",a.carbondioxide)} semuanya berada di rentang Normal, dan prediksi 30 menit ke depan tidak mendekati batas Peringatan. Jarak terdekat ke batas: ${P.map(p=>nm(p)+" "+f(p,gp(p))).join(", ")}.`,tind:auto?"Tidak ada tindakan yang diperlukan. Sistem terus memantau dan akan menyalakan perangkat secara otomatis jika ada parameter mendekati batas.":"Tidak ada tindakan yang diperlukan. Lanjutkan pemantauan rutin, sistem akan memberi peringatan dini jika ada parameter mendekati batas.",damp:"Tidak ada risiko bagi kumbung dalam 30 menit ke depan.",acts:[]}}
K.sort((x,y)=>x.sk-y.sk||y.tk-x.tk);const u=K[0],p=u.p,sn=st(p,a[p],t),ar=u.sd=="atas"?"naik ke":"turun ke",w=clock(now,u.m),h=hz(u.m),b=bp(p,u.v,t);let judul,ring,k,pre="";
if(sn!="Normal"){judul=`${L[p]} berada di luar rentang Normal`;ring=`${L[p]} saat ini ${f(p,a[p])} (status ${sn}) dan diperkirakan ${f(p,u.v)} dalam ${h} (status ${u.s}).`;k="ps"}
else if(u.s!="Normal"){const bb=u.s=="Kritis"?bk(p,u.v,t):b;judul=`${L[p]} akan melewati batas ${u.s} dalam ${h}`;ring=`${L[p]} diperkirakan ${ar} ${f(p,u.v)} dalam ${h} (saat ini ${f(p,a[p])}), melampaui batas ${u.s} ${f(p,bb)} sebesar ${f(p,Math.abs(u.v-bb))}.`;k="pd"}
else{judul=`${L[p]} mendekati batas dalam ${h}`;ring=`${L[p]} diperkirakan ${ar} ${f(p,u.v)} dalam ${h} (saat ini ${f(p,a[p])}). Status masih Normal, tersisa ${f(p,Math.abs(b-u.v))} sebelum batas Peringatan ${f(p,b)}.`;k="pd";pre="Jika melewati batas: "}
const[tind,ac]=act(p,u.sd,auto,k,w),acts=ac?[ac]:[],extra=[];
for(const o of K.slice(1)){const wj=clock(now,o.m);extra.push(`Selain itu, ${nm(o.p)} diperkirakan ${o.sd=="atas"?"naik ke":"turun ke"} ${f(o.p,o.v)} pada pukul ${wj} (${o.s!="Normal"?"status "+o.s:"masih Normal, mendekati batas"}), ditangani setelah ${nm(p)}.`);const[,a2]=act(o.p,o.sd,auto,"pd",wj);if(a2)acts.push(a2)}
const c=t.carbondioxide,cm=[5,10,15,30].some(m=>Math.min(Math.abs(g[m].carbondioxide-c.Mp),Math.abs(g[m].carbondioxide-c.mp))<=15);
return{tone:u.s=="Kritis"?"crit":u.s!="Normal"||sn!="Normal"?"warn":"near",judul,ring,tind,damp:DMP[p+"|"+u.sd]?pre+DMP[p+"|"+u.sd]:"",extra,cat:cm?"Prediksi CO2 berada dalam margin ±15 ppm dari batas Peringatan, pantau manual karena akurasi model CO2 terbatas.":"",acts}}
function jm(S){const{t,auto,a,g,now}=S,I={};
for(const p of P){const v=m=>g[m][p],sts=H6.map(m=>st(p,v(m),t)),mp=H6.reduce((b,m)=>tek(p,v(m),t)>tek(p,v(b),t)?m:b),sel=v(mp)-a[p];
const ev=sts.findIndex(s=>s!="Normal"),pu=ev>=0?H6.find((m,i)=>i>ev&&sts[i]=="Normal"):undefined,dk=H6.filter(m=>near(p,v(m),t));
I[p]={mp,ar:Math.abs(sel)<=EPS[p]?"stabil":sel>0?"naik":"turun",ev:ev>=0?{m:H6[ev],s:sts[ev]}:null,pu,md:dk.length?dk.reduce((b,m)=>tek(p,v(m),t)>tek(p,v(b),t)?m:b):null,sk:Math.min(...H6.map(m=>skor(p,v(m),t))),tk:tek(p,v(mp),t)}}
const bad=P.filter(p=>I[p].ev).sort((x,y)=>I[x].sk-I[y].sk||I[y].tk-I[x].tk),wa=P.filter(p=>!I[p].ev&&I[p].md),ok=P.filter(p=>!I[p].ev&&!I[p].md),kal=[],tl=[],acts=[];let damp="",pu0=null,mj=0;
for(const p of bad){const i=I[p],vp=g[i.mp][p],bb=i.ev.s=="Kritis"?bk(p,vp,t):bp(p,vp,t),ar=i.ar!="stabil"?i.ar:vp>a[p]?"naik":"turun";
kal.push(`${L[p]} diperkirakan ${ar} dari ${f(p,a[p])} menjadi ${f(p,vp)} pada pukul ${clock(now,i.mp)} (puncak dalam 6 jam). Batas ${i.ev.s} ${f(p,bb)} diperkirakan terlewati paling lambat pukul ${clock(now,i.ev.m)}, sekitar ${hz(i.ev.m)} lagi.${i.pu?` Kondisi kembali Normal pada pukul ${clock(now,i.pu)}.`:" Belum diperkirakan kembali Normal sampai akhir periode 6 jam."}`)}
for(const p of wa){const i=I[p],v=g[i.md][p],b=bp(p,v,t);kal.push(`${L[p]} diperkirakan ${sisi(p,v,t)=="atas"?"naik":"turun"} ke ${f(p,v)} pada pukul ${clock(now,i.md)}. Status masih Normal, tetapi tinggal ${f(p,Math.abs(b-v))} dari batas Peringatan ${f(p,b)}.`)}
const sb=ok.filter(p=>I[p].ar=="stabil");if(sb.length)kal.push((sb.length>1?sb.slice(0,-1).map(p=>L[p]).join(", ")+" dan "+L[sb[sb.length-1]]:L[sb[0]])+" diperkirakan tetap stabil di kisaran ideal.");
for(const p of ok.filter(p=>I[p].ar!="stabil"))kal.push(`${L[p]} diperkirakan ${I[p].ar} ke ${f(p,g[I[p].mp][p])}, masih dalam rentang Normal.`);
if(bad.length){const p=bad[0],vp=g[I[p].mp][p],s=sisi(p,vp,t),[x,a1]=act(p,s,auto,"m",clock(now,I[p].ev.m));tl.push(x);if(a1)acts.push(a1);damp=DMP[p+"|"+s]||"";pu0=p;mj=I[p].ev.m}
for(const p of wa){const v=g[I[p].md][p],s=sisi(p,v,t);tl.push(act(p,s,auto,"w")[0]);if(!bad.length){damp=damp||"Jika melewati batas: "+(DMP[p+"|"+s]||"");pu0=pu0||p}}
if(!bad.length&&!wa.length){const gp=p=>Math.min(...H6.map(m=>Math.min(t[p].Mp-g[m][p],g[m][p]-t[p].mp)));kal.push(`Jarak terdekat ke batas Peringatan selama 6 jam: ${P.map(p=>nm(p)+" "+f(p,gp(p))).join(", ")}.`);damp="Tidak ada risiko bagi kumbung dalam 6 jam ke depan."}
if(!tl.length)tl.push(auto?"Tidak ada tindakan yang diperlukan. Sistem terus memantau dan akan menyalakan perangkat secara otomatis jika ada parameter mendekati batas.":"Tidak ada tindakan yang diperlukan. Lanjutkan pemantauan rutin, sistem akan memberi peringatan dini jika ada parameter mendekati batas.");
return{tone:bad.length?"warn":wa.length?"near":"ok",judul:bad.length?`${L[pu0]} berpotensi keluar dari rentang Normal dalam ${hz(mj)}`:wa.length?`${L[pu0]} mendekati batas dalam 6 jam ke depan`:"Seluruh parameter diperkirakan tetap Normal dalam 6 jam ke depan",ring:"Prediksi 6 jam ke depan: "+kal.join(" "),tind:tl.join(" "),damp,acts}}
function jl(S){const{t,auto,g,now}=S,lb=h=>{const d=new Date(now.d);d.setDate(d.getDate()+h);return`hari ke-${h} (${HARI[d.getDay()]}, ${String(d.getDate()).padStart(2,"0")} ${BLN[d.getMonth()]})`};
const pts=[1440,4320,10080].map(m=>{const v=g[m],s=Object.fromEntries(P.map(p=>[p,skor(p,v[p],t)])),b=bobot(m);return{h:m/1440,v,s,b,o:P.reduce((x,p)=>x+s[p]*b[p],0),st:Object.fromEntries(P.map(p=>[p,st(p,v[p],t)]))}});
const dg=x=>x.o<70||Object.values(x.st).some(z=>z!="Normal"),bad=pts.filter(dg),last=pts[2],cat=`Prediksi jangka panjang bersifat indikatif (tingkat keyakinan ${conf(10080)} pada hari ke-7).`,rs=pts.map(x=>`hari ke-${x.h} ${x.o.toFixed(0)}%`).join(", ");
if(!bad.length){const o=pts.map(x=>x.o);return{tone:"ok",judul:"Kondisi satu minggu ke depan relatif stabil",ring:`Selama 7 hari ke depan, kondisi lingkungan diperkirakan relatif stabil mendekati kondisi ideal. Skor kondisi gabungan berada di kisaran ${Math.min(...o).toFixed(0)} sampai ${Math.max(...o).toFixed(0)}%.`,tind:auto?"Tidak diperlukan tindakan khusus. Sistem terus memantau dan mengatur perangkat secara otomatis.":"Tidak diperlukan tindakan khusus. Lanjutkan pemantauan rutin.",damp:"Tidak ada risiko bagi kumbung dalam 7 hari ke depan.",cat,acts:[]}}
const w=bad.reduce((b,x)=>Math.min(...P.map(p=>x.s[p]))<Math.min(...P.map(p=>b.s[p]))?x:b),p=P.reduce((b,q)=>w.s[q]<w.s[b]?q:b),hp=bad.filter(x=>x.st[p]!="Normal"),v=w.v[p],s=sisi(p,v,t),sn=w.st[p],b=sn=="Kritis"?bk(p,v,t):bp(p,v,t);
let r=`${L[p]} diperkirakan melewati batas ${sn} (${f(p,b)}) pada ${hp.map(x=>lb(x.h)).join(" dan ")}. Puncaknya sekitar ${f(p,v)} pada hari ke-${w.h}, ${f(p,Math.abs(v-b))} ${s=="atas"?"di atas":"di bawah"} batas. `;
r+=!dg(last)&&last.h>Math.max(...hp.map(x=>x.h))?`Kondisi diperkirakan kembali Normal pada ${lb(last.h)}. `:dg(last)?`Kondisi belum diperkirakan pulih pada hari ke-7. `:"";
r+=w.o>=70&&w.b[p]<.2?`Skor kondisi gabungan tetap tinggi (${rs}) karena bobot ${L[p]} hanya ${w.b[p].toFixed(2)}, tetapi parameter ini tetap perlu diperhatikan.`:`Skor kondisi gabungan: ${rs}.`;
const aw=Math.min(...hp.map(x=>x.h)),[tind,ac]=act(p,s,auto,"l",aw==1?"mulai besok":"mulai "+lb(aw));
return{tone:"warn",judul:`${L[p]} diperkirakan melewati batas pada ${hp.map(x=>x.h).join(" dan ")} hari ke depan`,ring:r,tind,damp:DMP[p+"|"+s]||"",cat,acts:ac?[ac]:[]}}
function rk(S,k){const d=R[k],s=S.auto;return{tone:"ok",judul:`${k} Normal ${d.n}% dari waktu, paling sering bermasalah pukul 13:00-15:00`,
ring:`Selama 30 hari terakhir, ${k} (mode ${s?"Otomasi":"Threshold manual"}) berada dalam status Normal ${d.n}% dari waktu pengamatan, Peringatan ${d.w}%, dan Kritis 0%. Kondisi paling sering keluar dari Normal pada ${d.p1}.${d.p2?` Pola kedua muncul pada ${d.p2}.`:""} Dibanding kumbung lain, ${k} ${d.b}.`,
tind:s?`Mode Otomasi aktif, tetapi kondisi masih keluar dari Normal ${d.w}% waktu. Periksa apakah exhaust fan bereaksi cukup cepat dan kapasitasnya memadai pada jam tersebut.`:"Karena mode Threshold manual, pertimbangkan jadwal tetap: nyalakan exhaust fan sekitar 30 menit sebelum pukul 13:00.",acts:[],bar:d}}
function chart(p,S){const t=S.t,x=t[p],vals=[S.a[p],...[5,10,15,30,60,180,360].map(m=>S.g[m][p])],lb=["Sekarang","5m","10m","15m","30m","1j","3j","6j"],rg=x.Mp-x.mp,lo=Math.min(...vals,x.mp)-rg*.2,hi=Math.max(...vals,x.Mp)+rg*.2;
const W=520,Hh=230,pl=8,pr=8,pt=14,pb=22,X=i=>pl+i*(W-pl-pr)/7,Y=v=>pt+(hi-v)/(hi-lo)*(Hh-pt-pb),c=v=>Math.max(lo,Math.min(hi,v)),R_=(a,b,fl)=>`<rect x="${pl}" y="${Y(Math.max(a,b))}" width="${W-pl-pr}" height="${Math.max(0,Math.abs(Y(a)-Y(b)))}" fill="${fl}"/>`;
const z=R_(c(x.Mp),c(x.mp),"#dcfce7")+R_(hi,c(x.Mp),"#fef3c7")+R_(c(x.mp),lo,"#fef3c7")+R_(hi,c(x.Mk),"#fee2e2")+R_(c(x.mk),lo,"#fee2e2");
const col={Normal:"#16a34a",Peringatan:"#d97706",Kritis:"#dc2626"};
return`<div><div class="mb-1 flex items-baseline justify-between"><b class="text-green-900">${L[p]}</b><span class="text-xs text-slate-500">ideal ${f(p,idl(p,t))}</span></div><svg viewBox="0 0 ${W} ${Hh}" width="100%">${z}<line x1="${pl}" x2="${W-pr}" y1="${Y(idl(p,t))}" y2="${Y(idl(p,t))}" stroke="#16a34a" stroke-dasharray="3 4"/><polyline fill="none" stroke="#14532d" stroke-width="2" points="${vals.map((v,i)=>X(i)+","+Y(v)).join(" ")}"/>${vals.map((v,i)=>`<circle cx="${X(i)}" cy="${Y(v)}" r="4.5" fill="${col[st(p,v,t)]}" stroke="#fff" stroke-width="1.5"/>${i==0||i>=5||i==3?`<text x="${X(i)}" y="${Y(v)-9}" font-size="10" text-anchor="middle" fill="#10231a">${f(p,v)}</text>`:""}`).join("")}${lb.map((l,i)=>`<text x="${X(i)}" y="${Hh-6}" font-size="10" text-anchor="middle" fill="#5b6f64">${l}</text>`).join("")}</svg></div>`}

const KBS=Object.keys(R);
const toApi=o=>({urgensi:o.tone,judul:o.judul,ringkasan:o.ring,tindakan:o.tind,dampak:o.damp||"",tambahan:o.extra||[],catatan:o.cat||"",
aksi_rekomendasi:(o.acts||[]).map(a=>({aktuator:a.n,tujuan:a.tj||"",dieksekusi_oleh:a.by,kapan:a.kap})),
...(o.bar?{distribusi_status:{normal_persen:o.bar.n,peringatan_persen:o.bar.w,kritis_persen:0}}:{})});
export {toApi,P,L,U,D,THR,MS,H6,SCN,R,KBS,f,st,skor,gab,conf,hz,idl,jp,jm,jl,rk,chart,bobot,near};
