const SUBJECTS=['Mathematics','Science','English','Marathi','Hindi','History','Geography','Social Science','Computer'];
const SUBKEYS=['math','science','english','marathi','hindi','history','geography','social','computer'];
const CLASSES=['8-A','8-B','9-A','9-B'];
const CLASS_CHART_COLORS=['#a5b4fc','#fdba74','#86efac','#f9a8d4','#7dd3fc','#fde68a'];
const todayLocal=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
let stored=JSON.parse(localStorage.getItem('eduTrackDemoStudents')||'null');
let students=stored||window.eduTrackMockStudents.map(s=>({...s}));
students=students.map(s=>{SUBKEYS.forEach(k=>{if(s[k]==null) s[k]=s.attendance||0});return s});
let charts={},editingId=null;
let attendanceRecords=JSON.parse(localStorage.getItem('eduTrackDemoAttendanceRecords')||'{}');
const $=x=>document.getElementById(x);
const avg=s=>Math.round(SUBKEYS.reduce((a,k)=>a+(+s[k]||0),0)/SUBKEYS.length);
const monthlyAvg=s=>avg(s);
const dailyPresent=s=>0;
const save=()=>localStorage.setItem('eduTrackDemoStudents',JSON.stringify(students));
function status(s){let a=avg(s),v=(+s.attendance+a)/2;return v>=85?['Excellent','good']:v>=70?['Monitor','warn']:['At Risk','bad']}
function table(head,rows){return '<div class="tablewrap"><table><thead><tr>'+head.map(x=>`<th>${x}</th>`).join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table></div>'}
function filtered(){let c=$('classFilter').value,q=$('search').value.toLowerCase(),r=$('riskFilter').value;return students.filter(s=>(c==='All'||s.className===c)&&s.name.toLowerCase().includes(q)&&(r==='all'||(r==='risk'?(s.attendance<75||avg(s)<55):(s.attendance>=90&&avg(s)>=80))))}
function classes(){let sel=$('classFilter'),v=sel.value;[...new Set(students.map(s=>s.className))].sort().forEach(c=>{if(![...sel.options].some(o=>o.value===c))sel.add(new Option(c,c))});sel.value=v||'All'}
function classChartColors(classNames){return classNames.map((_,i)=>CLASS_CHART_COLORS[i%CLASS_CHART_COLORS.length])}
function destroy(k){if(charts[k])charts[k].destroy()}
function dashboard(){
 let d=filtered(),aa=d.length?Math.round(d.reduce((a,s)=>a+s.attendance,0)/d.length):0,ap=d.length?Math.round(d.reduce((a,s)=>a+avg(s),0)/d.length):0;
 $('total').textContent=d.length;$('attendanceAvg').textContent=aa+'%';$('performanceAvg').textContent=ap+'%';$('risk').textContent=d.filter(s=>s.attendance<75||avg(s)<55).length;
 renderTodaysAttendance();
 $('riskTable').innerHTML=table(['Student','Class','Attendance','Performance','Status'],d.filter(s=>s.attendance<80||avg(s)<65).map(s=>{let x=status(s);return `<tr><td><b>${s.name}</b></td><td>${s.className}</td><td>${s.attendance}%</td><td>${avg(s)}%</td><td><span class="status ${x[1]}">${x[0]}</span></td></tr>`}));
 $('topTable').innerHTML=table(['Rank','Student','Class','Attendance','Performance'],[...d].sort((a,b)=>avg(b)-avg(a)).slice(0,5).map((s,i)=>`<tr><td>#${i+1}</td><td><b>${s.name}</b></td><td>${s.className}</td><td>${s.attendance}%</td><td>${avg(s)}%</td></tr>`));
 let cs=[...new Set(students.map(s=>s.className))].sort(),classColors=classChartColors(cs);
 destroy('scatter');charts.scatter=new Chart($('scatter'),{type:'scatter',data:{datasets:cs.map((className,i)=>({label:className,data:d.filter(s=>s.className===className).map(s=>({x:s.attendance,y:avg(s)})),backgroundColor:classColors[i],borderColor:classColors[i],pointRadius:6}))},options:{responsive:true,scales:{x:{title:{display:true,text:'Overall Attendance %'},min:40,max:100},y:{title:{display:true,text:'Performance %'},min:30,max:100}}}});
 destroy('class');charts.class=new Chart($('classChart'),{type:'bar',data:{labels:cs,datasets:[{label:'Attendance %',data:cs.map(c=>{let z=students.filter(s=>s.className===c);return Math.round(z.reduce((a,s)=>a+s.attendance,0)/z.length)}),backgroundColor:classColors,borderColor:classColors,borderWidth:1}]},options:{responsive:true,scales:{y:{beginAtZero:true,max:100}}}});
}
function renderTodaysAttendance(){
 const today=todayLocal();
 const classSelect=$('todayAttendanceClass');
 const selectedClass=classSelect.value;
 const availableClasses=[...new Set(students.map(s=>s.className))].sort();
 classSelect.innerHTML='<option value="">Select a class</option>'+availableClasses.map(c=>`<option value="${c}">${c}</option>`).join('');
 classSelect.value=availableClasses.includes(selectedClass)?selectedClass:'';
 if(!classSelect.value){
  $('todayPresentSummary').textContent='Select a class to see today’s attendance.';
  $('todayPresentTable').innerHTML='';
  return;
 }
 const className=classSelect.value;
 const record=attendanceRecords[`${today}|${className}`];
 if(!record){
  $('todayPresentSummary').textContent=`No attendance has been saved for ${className} today.`;
  $('todayPresentTable').innerHTML='<p class="muted">Take attendance for this class to see who is present.</p>';
  return;
 }
 const classStudents=students.filter(s=>s.className===className);
 const marked=classStudents.filter(s=>record[String(s.id)]);
 const present=marked.filter(s=>record[String(s.id)]==='Present');
 $('todayPresentSummary').textContent=`${present.length} of ${marked.length} marked students in ${className} are present today.`;
 $('todayPresentTable').innerHTML=present.length
  ?table(['Present students'],present.map(s=>`<tr><td><b>${s.name}</b></td></tr>`))
  :'<p class="muted">No students were marked present in this class today.</p>';
}
function studentsPage(){let q=$('studentSearch').value.toLowerCase(),d=students.filter(s=>s.name.toLowerCase().includes(q));$('studentTable').innerHTML=table(['Name','Class','Overall','Math','Science','English','Marathi','Hindi','History','Geography','Social Science','Computer','Performance','Status','Actions'],d.map(s=>{let x=status(s);return `<tr><td><b>${s.name}</b></td><td>${s.className}</td><td>${s.attendance}%</td><td>${s.math}%</td><td>${s.science}%</td><td>${s.english}%</td><td>${s.marathi}%</td><td>${s.hindi}%</td><td>${s.history}%</td><td>${s.geography}%</td><td>${s.social}%</td><td>${s.computer}%</td><td><b>${avg(s)}%</b></td><td><span class="status ${x[1]}">${x[0]}</span></td><td><button class="tiny edit" data-id="${s.id}">Edit</button> <button class="tiny delete" data-id="${s.id}">Delete</button></td></tr>`}));
 document.querySelectorAll('.edit').forEach(b=>b.onclick=()=>openEdit(+b.dataset.id));document.querySelectorAll('.delete').forEach(b=>b.onclick=()=>removeStudent(+b.dataset.id))
}
function attendance(){
 let d=students;
 destroy('trend');let _cs=[...new Set(students.map(s=>s.className))].sort(),_cc=classChartColors(_cs);charts.trend=new Chart($('trend'),{type:'line',data:{labels:['June','July','August','September','October'],datasets:_cs.map((className,i)=>{let g=d.filter(s=>s.className===className);let base=g.length?Math.round(g.reduce((a,s)=>a+s.attendance,0)/g.length):0;let vals=[base-4,base-2,base-1,base,base].map(v=>Math.max(50,Math.min(100,v)));return{label:className+' Monthly Attendance %',data:vals,borderColor:_cc[i],backgroundColor:_cc[i],tension:.35,fill:false,pointRadius:5}}) },options:{responsive:true,scales:{y:{min:50,max:100}}}});
  destroy('pie');charts.pie=new Chart($('attendancePie'),{type:'doughnut',data:{labels:['90%+','75–89%','Below 75%'],datasets:[{data:[d.filter(s=>s.attendance>=90).length,d.filter(s=>s.attendance>=75&&s.attendance<90).length,d.filter(s=>s.attendance<75).length]}]}});
 $('attendanceTable').innerHTML=table(['Student','Class','Date','Overall','Math','Science','English','Marathi','Hindi','History','Geography','Social Science','Computer'],d.map(s=>`<tr><td>${s.name}</td><td>${s.className}</td><td>${todayLocal()}</td><td><b>${s.attendance}%</b></td><td>${s.math}%</td><td>${s.science}%</td><td>${s.english}%</td><td>${s.marathi}%</td><td>${s.hindi}%</td><td>${s.history}%</td><td>${s.geography}%</td><td>${s.social}%</td><td>${s.computer}%</td></tr>`))
}
function renderAttendanceEntry(){
 const classSelect=$('attendanceClass'),date=$('attendanceDate');
 if(!classSelect||!date)return;
 const selectedClass=classSelect.value;
 const availableClasses=[...new Set(students.map(s=>s.className))].sort();
 classSelect.innerHTML=availableClasses.map(c=>`<option value="${c}">${c}</option>`).join('');
 classSelect.value=availableClasses.includes(selectedClass)?selectedClass:(availableClasses[0]||'');
 if(!date.value)date.value=todayLocal();
 const className=classSelect.value,day=date.value,group=students.filter(s=>s.className===className);
 const saved=attendanceRecords[`${day}|${className}`]||{};
 $('attendanceEntryTable').innerHTML=table(['Student','Class','Attendance'],group.map(s=>{
  const status=saved[s.id]||'Present';
  return `<tr><td><b>${s.name}</b></td><td>${s.className}</td><td><select class="attendance-status" data-student-id="${s.id}" aria-label="Attendance status for ${s.name}"><option value="Present" ${status==='Present'?'selected':''}>Present</option><option value="Absent" ${status==='Absent'?'selected':''}>Absent</option></select></td></tr>`
 }));
 const present=group.filter(s=>(saved[s.id]||'Present')==='Present').length;
 $('attendanceCount').textContent=`${present} present · ${group.length-present} absent · ${group.length} students`;
 $('attendanceSaved').textContent=attendanceRecords[`${day}|${className}`]?'Attendance saved for this class and date.':'';
 const registerRows=Object.entries(attendanceRecords).sort(([a],[b])=>b.localeCompare(a)).flatMap(([key,record])=>{
  const [recordDate,recordClass]=key.split('|');
  return students.filter(s=>s.className===recordClass&&record[s.id]).map(s=>`<tr><td>${recordDate}</td><td>${recordClass}</td><td>${s.name}</td><td class="${record[s.id]==='Present'?'present':'absent'}">${record[s.id]}</td></tr>`);
 });
 $('savedAttendanceTable').innerHTML=registerRows.length?table(['Date','Class','Student','Status'],registerRows):'<p class="muted">No class registers saved yet.</p>';
}
function performance(){let d=students,cs=[...new Set(d.map(s=>s.className))].sort(),classColors=classChartColors(cs);destroy('subject');charts.subject=new Chart($('subjectChart'),{type:'bar',data:{labels:SUBJECTS,datasets:cs.map((className,i)=>{let group=d.filter(s=>s.className===className);return{label:className,data:SUBKEYS.map(k=>Math.round(group.reduce((a,s)=>a+(+s[k]||0),0)/group.length)),backgroundColor:classColors[i],borderColor:classColors[i],borderWidth:1}})},options:{responsive:true,scales:{y:{beginAtZero:true,max:100}}}});destroy('ppie');charts.ppie=new Chart($('performancePie'),{type:'doughnut',data:{labels:['80%+','60–79%','Below 60%'],datasets:[{data:[d.filter(s=>avg(s)>=80).length,d.filter(s=>avg(s)>=60&&avg(s)<80).length,d.filter(s=>avg(s)<60).length]}]}});$('performanceTable').innerHTML=table(['Student','Class','Math','Science','English','Marathi','Hindi','History','Geography','Social Science','Computer','Average'],d.map(s=>`<tr><td>${s.name}</td><td>${s.className}</td><td>${s.math}%</td><td>${s.science}%</td><td>${s.english}%</td><td>${s.marathi}%</td><td>${s.hindi}%</td><td>${s.history}%</td><td>${s.geography}%</td><td>${s.social}%</td><td>${s.computer}%</td><td><b>${avg(s)}%</b></td></tr>`))}
function insights(){let a=students.map(s=>s.attendance),b=students.map(s=>avg(s)),ma=a.reduce((x,y)=>x+y,0)/a.length,mb=b.reduce((x,y)=>x+y,0)/b.length,n=0,x=0,y=0;a.forEach((v,i)=>{let p=v-ma,q=b[i]-mb;n+=p*q;x+=p*p;y+=q*q});let corr=(n/Math.sqrt(x*y)||0).toFixed(2);let avgs=SUBKEYS.map(k=>students.reduce((acc,s)=>acc+(+s[k]||0),0)/students.length);$('insightsBox').innerHTML=[['🔎','Attendance–Performance Link',`Correlation: ${corr}. A positive value indicates stronger attendance tends to accompany stronger performance.`],['⚠️','Attendance Concern',`${students.filter(s=>s.attendance<75).length} student(s) are below 75% attendance.`],['🏆','High Achievers',`${students.filter(s=>s.attendance>=90&&avg(s)>=80).length} student(s) have 90%+ attendance and 80%+ average.`],['📚','Subject Focus',`Lowest scoring subject: ${SUBJECTS[avgs.indexOf(Math.min(...avgs))]}.`]].map(x=>`<div class="insight"><b>${x[0]}</b><h3>${x[1]}</h3><p>${x[2]}</p></div>`).join('')}
function openEdit(id){let s=students.find(x=>x.id===id);if(!s)return;editingId=id;$('modalTitle').textContent='Edit Student';let f=$('form');Object.keys(s).forEach(k=>{if(f.elements[k])f.elements[k].value=s[k]});$('modal').classList.remove('hidden')}
function removeStudent(id){let s=students.find(x=>x.id===id);if(s&&confirm(`Delete ${s.name}?`)){students=students.filter(x=>x.id!==id);save();refresh()}}
function exportCSV(){let heads=['Name','Class','Overall_Attendance',...SUBJECTS.map(s=>s.replace(' ','_')),'Performance_Average'];let csv=heads.join(',')+'\n'+students.map(s=>[s.name,s.className,s.attendance,...SUBKEYS.map(k=>s[k]),avg(s)].join(',')).join('\n');let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='edutrack-students.csv';a.click()}
function importCSV(file){let r=new FileReader();r.onload=()=>{let lines=r.result.trim().split(/\r?\n/).slice(1);let added=0;lines.forEach(line=>{let p=line.split(',').map(x=>x.trim());if(p.length>=3&&!isNaN(+p[2])){let obj={id:Date.now()+added,name:p[0],className:p[1],attendance:+p[2]};SUBKEYS.forEach((k,i)=>{obj[k]=+p[3+i]||0});students.push(obj);added++}});save();refresh();alert(`${added} student record(s) imported.`)};r.readAsText(file)}
function quickFilters(){document.querySelectorAll('.quick[data-risk]').forEach(b=>b.onclick=()=>{$('riskFilter').value=b.dataset.risk;dashboard()});$('lowAttendance').onclick=()=>{$('riskFilter').value='risk';$('search').value='';dashboard();$('quickAlert').textContent='Showing students needing attendance attention'};$('resetFilters').onclick=()=>{$('classFilter').value='All';$('riskFilter').value='all';$('search').value='';$('quickAlert').textContent='';dashboard()};let low=students.filter(s=>s.attendance<75).length;$('quickAlert').textContent=low?`⚠ ${low} student${low>1?'s':''} below 75% attendance`:'✓ Attendance looks healthy'}
function refresh(){classes();dashboard();studentsPage();attendance();renderAttendanceEntry();performance();insights();quickFilters()}
document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>{document.querySelectorAll('.nav').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));$(b.dataset.page).classList.add('active');refresh()});$('classFilter').onchange=dashboard;$('riskFilter').onchange=dashboard;$('search').oninput=dashboard;$('studentSearch').oninput=studentsPage;
$('add').onclick=()=>{editingId=null;$('modalTitle').textContent='Add Student';$('form').reset();$('modal').classList.remove('hidden')};$('close').onclick=()=>$('modal').classList.add('hidden');
$('form').onsubmit=e=>{e.preventDefault();let f=new FormData(e.target),obj={name:f.get('name'),className:f.get('className'),attendance:+f.get('attendance')};SUBKEYS.forEach(k=>{obj[k]=+f.get(k)});if(editingId)Object.assign(students.find(s=>s.id===editingId),obj);else students.push({id:Date.now(),...obj});save();$('modal').classList.add('hidden');e.target.reset();refresh()};
$('attendanceClass').onchange=renderAttendanceEntry;$('attendanceDate').onchange=renderAttendanceEntry;
$('todayAttendanceClass').onchange=renderTodaysAttendance;
$('takeAttendance').onclick=()=>{const className=$('todayAttendanceClass').value;document.querySelector('.nav[data-page="attendance"]').click();$('attendanceDate').value=todayLocal();if(className)$('attendanceClass').value=className;renderAttendanceEntry()};
document.querySelectorAll('#attendanceForm').forEach(form=>form.addEventListener('change',e=>{if(e.target.matches('.attendance-status')){const selects=[...form.querySelectorAll('.attendance-status')],present=selects.filter(s=>s.value==='Present').length;$('attendanceCount').textContent=`${present} present · ${selects.length-present} absent · ${selects.length} students`;$('attendanceSaved').textContent='Unsaved changes.'}}));
$('markAllPresent').onclick=()=>{const selects=[...document.querySelectorAll('.attendance-status')];selects.forEach(s=>s.value='Present');if(selects[0])selects[0].dispatchEvent(new Event('change',{bubbles:true}))};
$('markAllAbsent').onclick=()=>{const selects=[...document.querySelectorAll('.attendance-status')];selects.forEach(s=>s.value='Absent');if(selects[0])selects[0].dispatchEvent(new Event('change',{bubbles:true}))};
$('attendanceForm').onsubmit=e=>{e.preventDefault();const day=$('attendanceDate').value,className=$('attendanceClass').value;if(!day||!className){alert('Choose a class and date before saving attendance.');return}const record={};document.querySelectorAll('.attendance-status').forEach(s=>record[s.dataset.studentId]=s.value);attendanceRecords[`${day}|${className}`]=record;localStorage.setItem('eduTrackDemoAttendanceRecords',JSON.stringify(attendanceRecords));renderAttendanceEntry();renderTodaysAttendance()};
$('export').onclick=exportCSV;$('importBtn').onclick=()=>$('fileInput').click();$('fileInput').onchange=e=>e.target.files[0]&&importCSV(e.target.files[0]);$('print').onclick=()=>window.print();$('theme').onclick=()=>document.body.classList.toggle('dark');refresh();
