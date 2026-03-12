let cakesData=[];
let activeFilters = new Set();

fetch("/db/pasteles.json")
.then(res=>res.json())
.then(data=>{
cakesData=data.pasteles;
printCakes(cakesData);
});

fetch("/db/pasteles.json")
.then(res=>res.json())
.then(data=>{

cakesData=data.pasteles;

createFilters();

printCakes(cakesData);

}); 

function printCakes(cakes){

const gallery=document.getElementById("gallery");
gallery.innerHTML="";

cakes.forEach((cake,index)=>{

const div=document.createElement("div");
div.className="cake";

let tagsHTML="";

cake.etiquetas.forEach(tag=>{
tagsHTML+=`<span class="tag">${tag}</span>`;
});

div.innerHTML=`
<img loading="lazy" src="${cake.imagenes[0]}">
<div class="tags">${tagsHTML}</div>
`;

div.onclick=()=>openModal(cake);

gallery.appendChild(div);

/* animacion */

setTimeout(()=>{
div.classList.add("show");
},index*80);

});

}

function filterCakes(filter){

if(filter === "all"){
printCakes(cakesData);
return;
}

const filtered = cakesData.filter(cake => 
cake.etiquetas.includes(filter)
);

printCakes(filtered);

}

function openModal(cake){

const modal=document.getElementById("modal");

modal.classList.add("active");

document.getElementById("cakeTitle").innerText=cake.nombre;

document.getElementById("cakeDesc").innerText=cake.descripcion;

const mainImg=document.getElementById("modalImg");
mainImg.src=cake.imagenes[0];

const modalTags=document.getElementById("modalTags");
modalTags.innerHTML="";

cake.etiquetas.forEach(tag=>{
modalTags.innerHTML+=`<span class="tag">${tag}</span>`;
});

/* miniaturas */

const thumbs=document.getElementById("thumbs");
thumbs.innerHTML="";

cake.imagenes.forEach(img=>{

const t=document.createElement("img");

t.loading="lazy";
t.src=img;

t.onclick=()=>mainImg.src=img;

t.onclick=()=>{
mainImg.style.opacity=0;

setTimeout(()=>{
mainImg.src=img;
mainImg.style.opacity=1;
},150);
};

thumbs.appendChild(t);

});

}

function closeModal(){
document.getElementById("modal").classList.remove("active");
}

function createFilters(){

const filtersContainer = document.getElementById("filters");

/* obtener todas las etiquetas */

const tags = new Set();

cakesData.forEach(cake=>{
cake.etiquetas.forEach(tag=>{
tags.add(tag);
});
});

/* boton TODOS */

const allBtn = document.createElement("button");
allBtn.textContent="Todos";
allBtn.className="filter-btn";

allBtn.onclick=()=>{
activeFilters.clear();
updateFiltersUI();
printCakes(cakesData);
};

filtersContainer.appendChild(allBtn);

/* crear filtros */

tags.forEach(tag=>{

const btn=document.createElement("button");

btn.textContent=tag;
btn.className="filter-btn";

btn.onclick=()=>toggleFilter(tag,btn);

filtersContainer.appendChild(btn);

});

}

function toggleFilter(tag,button){

if(activeFilters.has(tag)){
activeFilters.delete(tag);
button.classList.remove("active");
}else{
activeFilters.add(tag);
button.classList.add("active");
}

applyFilters();

}

function applyFilters(){

if(activeFilters.size === 0){
printCakes(cakesData);
return;
}

const filtered = cakesData.filter(cake =>

[...activeFilters].every(tag =>
cake.etiquetas.includes(tag)
)

);

printCakes(filtered);

}

function updateFiltersUI(){

document.querySelectorAll(".filter-btn")
.forEach(btn=>btn.classList.remove("active"));

}

/* ESC */

document.addEventListener("keydown",(e)=>{
if(e.key==="Escape") closeModal();
});

/* clic fuera */

document.getElementById("modal").addEventListener("click",(e)=>{
if(e.target.id==="modal") closeModal();
});