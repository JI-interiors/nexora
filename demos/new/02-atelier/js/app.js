const projects=[
 ['01','Casa Verde','Residential / Lisbon','https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=82'],
 ['02','Courtyard House','Residential / Melbourne','https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=82'],
 ['03','Oak & Stone','Residential / Copenhagen','https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1600&q=82'],
 ['04','Mizu House','Hospitality / Kyoto','https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1600&q=82']
];
const list=document.querySelector('#projectList'), img=document.querySelector('#projectImage'), title=document.querySelector('#projectTitle'), meta=document.querySelector('#projectMeta');
projects.forEach((p,i)=>{const el=document.createElement('div');el.className='project'+(i===0?' active':'');el.innerHTML=`<span>${p[0]}</span><div><h3>${p[1]}</h3><p>${p[2]}</p></div>`;el.onclick=()=>{document.querySelectorAll('.project').forEach(x=>x.classList.remove('active'));el.classList.add('active');img.src=p[3];title.textContent=p[1];meta.textContent=p[2]};list.appendChild(el)});
document.querySelector('.menu')?.addEventListener('click',()=>{const n=document.querySelector('.nav');n.style.display=n.style.display==='flex'?'none':'flex'});
const obs=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add('in')),{threshold:.12});document.querySelectorAll('.reveal').forEach(e=>obs.observe(e));
