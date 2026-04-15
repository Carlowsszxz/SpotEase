export async function injectNavbar(){
  try{
    var host = document.getElementById('navbar');
    if(!host) return;
    var res = await fetch('FrameNavbar.html');
    var html = await res.text();
    host.innerHTML = html;

    var s = document.createElement('script');
    s.type = 'module';
    s.src = 'JS/navbar.js';
    document.body.appendChild(s);
  }catch(err){
    console.error('Failed to inject user navbar', err);
  }
}

export async function injectAdminNavbar(){
  try{
    var host = document.getElementById('navbar');
    if(!host) return;
    var res = await fetch('FrameAdminNavbar.html');
    var html = await res.text();
    host.innerHTML = html;

    var s = document.createElement('script');
    s.type = 'module';
    s.src = 'JS/admin-navbar.js';
    document.body.appendChild(s);
  }catch(err){
    console.error('Failed to inject admin navbar', err);
  }
}