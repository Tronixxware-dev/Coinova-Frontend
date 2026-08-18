import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import NavBar from '../components/NavBar';

function resizeImageToDataUrl(file, maxSize = 256) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      const canvas = document.createElement('canvas');
      canvas.width = maxSize;
      canvas.height = maxSize;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, sx, sy, size, size, 0, 0, maxSize, maxSize);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read that image file'));
    };
    img.src = objectUrl;
  });
}

export default function Account() {
  const { user, accessToken, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailError, setEmailError] = useState(null);
  const [emailSuccess, setEmailSuccess] = useState(null);

  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState(null);

  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    setPasswordBusy(true);
    try {
      await api.changePassword(accessToken, { currentPassword, newPassword });
      setPasswordSuccess('Password changed. Logging you out for security — please log back in.');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => logout(), 2000);
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordBusy(false);
    }
  }

  async function handleChangeEmail(e) {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(null);
    setEmailBusy(true);
    try {
      const data = await api.changeEmail(accessToken, { newEmail, password: emailPassword });
      updateUser(data.user);
      setEmailSuccess('Email updated.');
      setNewEmail('');
      setEmailPassword('');
    } catch (err) {
      setEmailError(err.message);
    } finally {
      setEmailBusy(false);
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarError(null);
    setAvatarBusy(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      const data = await api.updateAvatar(accessToken, { avatarDataUrl: dataUrl });
      updateUser(data.user);
    } catch (err) {
      setAvatarError(err.message || 'Could not update your photo.');
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleRemoveAvatar() {
    setAvatarError(null);
    setAvatarBusy(true);
    try {
      const data = await api.removeAvatar(accessToken);
      updateUser(data.user);
    } catch (err) {
      setAvatarError(err.message || 'Could not remove your photo.');
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleDeleteAccount(e) {
    e.preventDefault();
    setDeleteError(null);
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Type DELETE to confirm.');
      return;
    }
    setDeleteBusy(true);
    try {
      await api.deleteAccount(accessToken, { password: deletePassword });
      await logout();
      navigate('/signup');
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 space-y-6">
      <NavBar />

      <h1 className="text-xl font-bold">Account Settings</h1>
      <p className="text-slate-400 text-sm">
        Signed in as <span className="text-white">{user?.username}</span> ({user?.email})
      </p>

      <div className="bg-slate-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Profile Photo</h2>
        {avatarError && <p className="text-red-400 text-xs">{avatarError}</p>}
        <div className="flex items-center gap-4">
          {user?.avatarDataUrl ? (
            <img src={user.avatarDataUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-slate-900 font-semibold flex items-center justify-center text-lg">
              {(user?.username || user?.email || '?').slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="space-y-2">
            <label className="inline-block cursor-pointer bg-slate-700 hover:bg-slate-600 text-sm rounded-lg px-3 py-1.5 transition">
              {avatarBusy ? 'Uploading…' : 'Upload Photo'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={avatarBusy}
              />
            </label>
            {user?.avatarDataUrl && (
              <button
                onClick={handleRemoveAvatar}
                disabled={avatarBusy}
                className="block text-xs text-slate-400 hover:text-red-400 transition disabled:opacity-50"
              >
                Remove photo
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleChangePassword} className="bg-slate-800 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Change Password</h2>
          {passwordError && <p className="text-red-400 text-xs">{passwordError}</p>}
          {passwordSuccess && <p className="text-emerald-400 text-xs">{passwordSuccess}</p>}
          <div className="space-y-2">
            <input
              type="password"
              required
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="password"
              required
              minLength={8}
              placeholder="New password (min 8 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={passwordBusy}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-900 text-sm font-semibold rounded-lg py-2 transition"
          >
            {passwordBusy ? 'Changing…' : 'Change Password'}
          </button>
        </form>

        <form onSubmit={handleChangeEmail} className="bg-slate-800 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Change Email</h2>
          {emailError && <p className="text-red-400 text-xs">{emailError}</p>}
          {emailSuccess && <p className="text-emerald-400 text-xs">{emailSuccess}</p>}
          <div className="space-y-2">
            <input
              type="email"
              required
              placeholder="New email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="password"
              required
              placeholder="Current password"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={emailBusy}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-900 text-sm font-semibold rounded-lg py-2 transition"
          >
            {emailBusy ? 'Updating…' : 'Change Email'}
          </button>
        </form>
      </div>

      <form onSubmit={handleDeleteAccount} className="bg-red-500/5 border border-red-500/30 rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wide">Delete Account</h2>
        <p className="text-slate-400 text-xs">
          This permanently deletes your account, wallet balances, orders, trades, and stakes. This cannot be undone.
        </p>
        {deleteError && <p className="text-red-400 text-xs">{deleteError}</p>}
        <div className="space-y-2 max-w-md">
          <input
            type="password"
            required
            placeholder="Current password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
          />
          <input
            type="text"
            required
            placeholder='Type "DELETE" to confirm'
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <button
          type="submit"
          disabled={deleteBusy}
          className="bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-4 py-2 transition"
        >
          {deleteBusy ? 'Deleting…' : 'Delete Account'}
        </button>
      </form>
    </div>
  );
}