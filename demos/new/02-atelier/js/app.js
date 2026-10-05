const projects=[
 ['01','Casa Verde','Residential / Lisbon','../../../../images/02-atelier-interior.webp'],
 ['02','Courtyard House','Residential / Melbourne','../../../../images/02-atelier-interior.webp'],
 ['03','Oak & Stone','Residential / Copenhagen','../../../../images/02-atelier-interior.webp'],
 ['04','Mizu House','Hospitality / Kyoto','../../../../images/02-atelier-interior.webp']
];
const list=document.querySelector('#projectList'), img=document.querySelector('#projectImage'), title=document.querySelector('#projectTitle'), meta=document.querySelector('#projectMeta');
projects.forEach((p,i)=>{const el=document.createElement('div');el.className='project'+(i===0?' active':'');el.innerHTML=`<span>${p[0]}</span><div><h3>${p[1]}</h3><p>${p[2]}</p></div>`;el.onclick=()=>{document.querySelectorAll('.project').forEach(x=>x.classList.remove('active'));el.classList.add('active');img.src=p[3];title.textContent=p[1];meta.textContent=p[2]};list.appendChild(el)});
document.querySelector('.menu')?.addEventListener('click',()=>{const n=document.querySelector('.nav');n.style.display=n.style.display==='flex'?'none':'flex'});
const obs=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add('in')),{threshold:.12});document.querySelectorAll('.reveal').forEach(e=>obs.observe(e));
