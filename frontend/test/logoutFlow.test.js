import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('navbar logout uses the confirmation dialog instead of immediate logout', () => {
  const navbar = read('../src/components/navbar/TopNavbar.jsx');
  const dialog = read('../src/components/auth/LogoutDialog.jsx');

  assert.match(navbar, /useLogout\(\)/);
  assert.match(navbar, /<LogoutDialog/);
  assert.match(navbar, /setLogoutDialogOpen\(true\)/);
  assert.doesNotMatch(navbar, /await logout\(\)/);

  assert.match(dialog, /Log out of CodeMentor AI\?/);
  assert.match(dialog, /Log out from all devices/);
  assert.match(dialog, /logoutFromAllDevices/);
  assert.match(dialog, /onConfirm\(\{ logoutFromAllDevices \}\)/);
});

test('logout hook chooses the existing current-browser or all-device endpoint', () => {
  const hook = read('../src/hooks/useLogout.js');
  const api = read('../src/api/authApi.js');
  const profile = read('../src/pages/learner/ProfilePage.jsx');
  const login = read('../src/pages/public/LoginPage.jsx');

  assert.match(hook, /authApi\.logoutAll\(\)/);
  assert.match(hook, /authApi\.logout\(\)/);
  assert.match(hook, /signOut\(\)/);
  assert.match(hook, /navigate\('\/login'/);
  assert.match(api, /logoutAll:\s*\(\)\s*=>\s*api\.post\('\/auth\/logout-all'\)/);
  assert.doesNotMatch(profile, /authApi\.logoutAll|Sign out from all devices/);
  assert.match(login, /location\.state\?\.message/);
});
