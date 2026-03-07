// Profile form: load/save user info to localStorage (pm_user). Basic password change logic (demo only).
import { checkAuth } from './auth.js'

(async function(){
  // ensure authenticated before showing profile
  const ok = await checkAuth('FrameLogin.html');
  if (!ok) return;
  var key = 'pm_user';
  var form = document.getElementById('profileForm');
  var fullName = document.getElementById('fullName');
  var email = document.getElementById('email');
  var role = document.getElementById('role');
  var currentPassword = document.getElementById('currentPassword');
  var newPassword = document.getElementById('newPassword');
  var confirmPassword = document.getElementById('confirmPassword');
  var msg = document.getElementById('profileMsg');

  function load(){
    try{ return JSON.parse(localStorage.getItem(key) || '{}'); }catch(e){return{}} }

  function save(obj){ try{ localStorage.setItem(key, JSON.stringify(obj)); }catch(e){} }

  function init(){
    var u = load();
    if(u.name) fullName.value = u.name;
    if(u.email) email.value = u.email;
    if(u.role) role.value = u.role;
  }

  form.addEventListener('submit', function(e){
    e.preventDefault(); msg.textContent = '';
    var u = load();
    var nameVal = fullName.value.trim(); var emailVal = email.value.trim(); var roleVal = role.value;
    if(!nameVal || !emailVal){ msg.textContent = 'Name and email are required.'; return; }

    // handle password change if requested
    if(newPassword.value || confirmPassword.value){
      if(newPassword.value !== confirmPassword.value){ msg.textContent = 'New passwords do not match.'; return; }
      // if user has existing password, require current
      if(u.password){ if(currentPassword.value !== u.password){ msg.textContent = 'Current password is incorrect.'; return; } }
      u.password = newPassword.value;
    }

    u.name = nameVal; u.email = emailVal; u.role = roleVal;
    save(u);
    msg.textContent = 'Profile saved.';
    // clear sensitive fields
    currentPassword.value = ''; newPassword.value = ''; confirmPassword.value = '';
  });

  init();

})();
