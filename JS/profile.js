// Profile form: auto-fill from Supabase (users table). DB is the source of truth.
import { checkAuth } from './auth.js'
import { supabase, getCurrentUser } from './supabase-auth.js'

(async function(){
  // ensure authenticated before showing profile
  const ok = await checkAuth('FrameLogin.html');
  if (!ok) return;
  var form = document.getElementById('profileForm');
  var fullName = document.getElementById('fullName');
  var email = document.getElementById('email');
  var currentPassword = document.getElementById('currentPassword');
  var newPassword = document.getElementById('newPassword');
  var confirmPassword = document.getElementById('confirmPassword');
  var msg = document.getElementById('profileMsg');
  var emailHelp = document.getElementById('emailHelp');
  var securityHelp = document.getElementById('securityHelp');

  var rfidLastTap = document.getElementById('rfidLastTap');
  var rfidEmpty = document.getElementById('rfidEmpty');
  var rfidErr = document.getElementById('rfidErr');

  var authProvider = 'email';
  var isOAuthAccount = false;

  function setMsg(text){
    if(!msg) return;
    msg.textContent = text || '';
  }

  function setSecurityHelp(text){
    if(!securityHelp) return;
    securityHelp.textContent = text || '';
  }

  function setEmailHelp(text){
    if(!emailHelp) return;
    emailHelp.textContent = text || '';
  }

  function formatWhen(ts){
    if(!ts) return '';

    // Supabase/Postgres may return timestamps in non-ISO formats that Date() won't parse reliably.
    // Examples:
    // - 2026-04-12T16:23:14.572163+00:00
    // - 2026-04-12 16:23:14.572163
    var raw = ts;
    var s = (typeof ts === 'string') ? ts.trim() : ts;

    if(typeof s === 'string'){
      if(s.indexOf('T') === -1 && s.indexOf(' ') !== -1) s = s.replace(' ', 'T');
      var hasTz = (s.endsWith('Z') || s.indexOf('+') !== -1 || /-\d\d:?\d\d$/.test(s));
      if(!hasTz) s = s + 'Z';
    }

    var d = new Date(s);
    if(isNaN(d.getTime())){
      return (typeof raw === 'string') ? raw : '';
    }
    return d.toLocaleString();
  }

  function getPrimaryProvider(user){
    if(!user) return 'email';
    try{
      var app = user.app_metadata || {};
      if(app && typeof app.provider === 'string' && app.provider) return app.provider;
      if(app && Array.isArray(app.providers) && app.providers.length) return String(app.providers[0] || 'email');
    }catch(e){}
    try{
      if(Array.isArray(user.identities) && user.identities.length){
        var p = user.identities[0] && user.identities[0].provider;
        if(p) return String(p);
      }
    }catch(e){}
    return 'email';
  }

  function configureSecurityUI(){
    // Email is always read-only in the student profile UI
    try{ if(email) email.setAttribute('readonly', 'true'); }catch(e){}

    if(isOAuthAccount){
      // OAuth (Google): password is managed by the provider.
      setSecurityHelp('Signed in with ' + (authProvider || 'Google') + '. Password changes are managed by your provider.');
      [currentPassword, newPassword, confirmPassword].forEach(function(el){
        if(!el) return;
        el.value = '';
        el.disabled = true;
        el.setAttribute('aria-disabled', 'true');
        el.placeholder = 'Managed by your sign-in provider';
      });
    } else {
      setSecurityHelp('To change your password, enter your current password and a new password.');
      [currentPassword, newPassword, confirmPassword].forEach(function(el){
        if(!el) return;
        el.disabled = false;
        el.removeAttribute('aria-disabled');
      });
    }
  }

  function setRfidError(text){
    if(rfidErr){
      var msg = (text == null) ? '' : String(text);
      rfidErr.textContent = msg;
      rfidErr.style.display = msg ? 'block' : 'none';
    }
  }

  function setRfidEmpty(isEmpty){
    if(rfidEmpty) rfidEmpty.style.display = isEmpty ? 'block' : 'none';
  }

  function renderRfidActivity(scans){
    var items = scans || [];
    if(!items.length){
      if(rfidLastTap) rfidLastTap.textContent = '—';
      setRfidEmpty(true);
      return;
    }

    setRfidEmpty(false);
    if(rfidLastTap) rfidLastTap.textContent = formatWhen(items[0].scanned_at) || '—';
  }

  async function loadRfidActivity(){
    if(!rfidLastTap) return;
    try{
      setRfidError('');
      if(rfidLastTap) rfidLastTap.textContent = 'Loading…';
      setRfidEmpty(false);

      const { data } = await supabase.auth.getUser();
      const user = data && data.user;
      if(!user){
        if(rfidLastTap) rfidLastTap.textContent = '—';
        return;
      }

      // Best-effort: show last_seen_at from assigned tags even if scan history isn't linked yet.
      try{
        const { data: tags, error: tagErr } = await supabase
          .from('user_rfid_tags')
          .select('last_seen_at,is_active')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('last_seen_at', { ascending: false, nullsFirst: false })
          .limit(1);

        if(!tagErr && tags && tags.length && tags[0].last_seen_at){
          if(rfidLastTap) rfidLastTap.textContent = formatWhen(tags[0].last_seen_at);
        }
      }catch(e){
        // ignore
      }

      const { data: scans, error } = await supabase
        .from('rfid_scans')
        .select('scanned_at')
        .eq('user_id', user.id)
        .order('scanned_at', { ascending: false })
        .limit(1);

      if(error){
        // Common if migration/policy not applied yet.
        if(rfidLastTap) rfidLastTap.textContent = '—';
        setRfidEmpty(true);
        setRfidError('RFID activity is not available yet (missing database migration/policies).');
        return;
      }

      renderRfidActivity(scans || []);
    }catch(e){
      if(rfidLastTap) rfidLastTap.textContent = '—';
      setRfidEmpty(true);
      setRfidError('RFID activity is not available yet.');
    }
  }

  async function loadFromSupabase(){
    try{
      const { data } = await supabase.auth.getUser();
      const user = data && data.user;
      if(!user) return;

      authProvider = getPrimaryProvider(user);
      isOAuthAccount = !!(authProvider && authProvider !== 'email');

      // Always prefer auth email if present.
      if(email && user.email) email.value = user.email;

      // Email is managed by auth (not editable here)
      if(authProvider === 'google') setEmailHelp('Email is managed by Google sign-in.');
      else if(isOAuthAccount) setEmailHelp('Email is managed by your sign-in provider.');
      else setEmailHelp('Email can’t be changed here.');

      configureSecurityUI();

      // Best-effort load profile row.
      const { data: profile, error } = await supabase
        .from('users')
        .select('name,email')
        .eq('id', user.id)
        .single();

      if(error){
        // Common if RLS blocks. Still ok.
        return;
      }

      if(profile){
        if(fullName && profile.name) fullName.value = profile.name;
        // Email stays from auth; do not allow changing it here.
      }
    }catch(e){
      // ignore
    }
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    setMsg('');
    var nameVal = fullName.value.trim();
    var emailVal = (email && email.value ? email.value.trim() : '');
    if(!nameVal || !emailVal){ setMsg('Name and email are required.'); return; }

    var wantsPasswordChange = !!((newPassword && newPassword.value) || (confirmPassword && confirmPassword.value) || (currentPassword && currentPassword.value));

    // Server updates (name only) + optional password update
    (async function(){
      try{
        const { data } = await supabase.auth.getUser();
        const user = data && data.user;
        if(!user){
          setMsg('Not signed in.');
          return;
        }

        var nameSaved = false;
        var nameSaveErrMsg = '';
        try{
          const { data: updatedProfile, error: nameUpdateErr } = await supabase
            .from('users')
            .update({ name: nameVal, updated_at: new Date().toISOString() })
            .eq('id', user.id)
            .select('name')
            .single();

          if(nameUpdateErr){
            console.warn('users.name update failed', nameUpdateErr);
            nameSaveErrMsg = (nameUpdateErr.message || String(nameUpdateErr));
          } else {
            nameSaved = true;
            if(updatedProfile && typeof updatedProfile.name === 'string' && fullName) {
              fullName.value = updatedProfile.name;
            }
          }
        }catch(e){
          nameSaveErrMsg = (e && e.message) ? e.message : String(e);
        }

        if(!wantsPasswordChange){
          if(!nameSaved){
            setMsg('Failed to save to database: ' + (nameSaveErrMsg || 'Unknown error'));
            return;
          }
          setMsg('Profile saved.');
          return;
        }

        if(wantsPasswordChange){
          if(isOAuthAccount){
            setMsg('This account uses ' + (authProvider || 'Google') + ' sign-in. Password changes are managed by your provider.');
            return;
          }

          if(!currentPassword || !currentPassword.value){
            setMsg('Enter your current password to change it.');
            return;
          }
          if(!newPassword || !newPassword.value || !confirmPassword || !confirmPassword.value){
            setMsg('Enter and confirm your new password.');
            return;
          }
          if(newPassword.value !== confirmPassword.value){
            setMsg('New passwords do not match.');
            return;
          }

          // Verify current password by re-authenticating
          const { error: reauthErr } = await supabase.auth.signInWithPassword({
            email: emailVal,
            password: currentPassword.value
          });
          if(reauthErr){
            setMsg('Current password is incorrect.');
            return;
          }

          const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword.value });
          if(updateErr){
            setMsg('Password update failed: ' + (updateErr.message || updateErr));
            return;
          }

          if(currentPassword) currentPassword.value = '';
          if(newPassword) newPassword.value = '';
          if(confirmPassword) confirmPassword.value = '';

          if(nameSaved) setMsg('Profile saved. Password updated.');
          else setMsg('Password updated. Name save failed: ' + (nameSaveErrMsg || 'Unknown error'));
          return;
        }
      }catch(err){
        console.warn('profile save error', err);
        setMsg('Failed to save profile.');
      }
    })();
  });

  // Ensure email is not editable even before network
  try{ if(email) email.setAttribute('readonly', 'true'); }catch(e){}
  // Replace with current server values when available
  await loadFromSupabase();
  await loadRfidActivity();

})();
