import "../styles/profile.css";
import { Camera, CheckCircle2, Mail, Pencil, Save, ShieldCheck, User } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth.jsx";
import { authApi, userApi } from "../services/api.js";

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

const Profile = () => {
  const { user, updateUser } = useAuth();
  const fileRef = useRef(null);
  const nameRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || "", username: user?.username || "" });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(user?.profileImage || "");
  const [usernameState, setUsernameState] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ name: user?.name || "", username: user?.username || "" });
    setPreview(user?.profileImage || "");
  }, [user]);

  useEffect(() => {
    if (!editing || !form.username || form.username === user?.username || form.username.length < 3) {
      setUsernameState("");
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const data = await authApi.checkUsername(form.username);
        setUsernameState(data.available ? "available" : "taken");
      } catch {
        setUsernameState("");
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [editing, form.username, user?.username]);

  useEffect(() => {
    if (!imageFile) return undefined;

    const nextPreview = URL.createObjectURL(imageFile);
    setPreview(nextPreview);

    return () => URL.revokeObjectURL(nextPreview);
  }, [imageFile]);

  const initials = useMemo(() => user?.username?.slice(0, 2).toUpperCase() || "ET", [user]);

  const updateField = useCallback((event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }, []);

  const startEditing = useCallback(() => {
    setEditing(true);
    setError("");
    setSuccess("");
    window.setTimeout(() => nameRef.current?.focus(), 0);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditing(false);
    setImageFile(null);
    setPreview(user?.profileImage || "");
    setForm({ name: user?.name || "", username: user?.username || "" });
    setUsernameState("");
    setError("");
  }, [user]);

  const selectImage = useCallback((event) => {
    const file = event.target.files?.[0];
    setError("");

    if (!file) return;

    if (!allowedImageTypes.includes(file.type)) {
      setError("Only jpg, png, and webp images are allowed");
      event.target.value = "";
      return;
    }

    setImageFile(file);
  }, []);

  const saveProfile = useCallback(
    async (event) => {
      event.preventDefault();
      setError("");
      setSuccess("");

      if (usernameState === "taken") {
        setError("Username already taken");
        return;
      }

      const payload = new FormData();
      payload.append("name", form.name);
      payload.append("username", form.username);
      if (imageFile) payload.append("profileImage", imageFile);

      setSaving(true);
      try {
        const data = await userApi.updateProfile(payload);
        updateUser(data.user);
        setEditing(false);
        setImageFile(null);
        setSuccess("Profile updated");
      } catch (err) {
        setError(err.message);
      } finally {
        setSaving(false);
      }
    },
    [form, imageFile, updateUser, usernameState]
  );

  return (
    <section className="page-stack">
      <div className="page-title">
        <div>
          <p>Profile</p>
          <h1>{user?.name}</h1>
        </div>
        {!editing && (
          <button className="ghost-button" onClick={startEditing}>
            <Pencil size={17} />
            Edit Profile
          </button>
        )}
      </div>

      <article className="panel profile-card">
        <div className="profile-photo-wrap">
          {preview ? <img src={preview} alt={user?.name || "Profile"} className="profile-photo" /> : <div className="profile-avatar large">{initials}</div>}
          {editing && (
            <>
              <button className="icon-button photo-button" onClick={() => fileRef.current?.click()} type="button" aria-label="Upload profile photo">
                <Camera size={18} />
              </button>
              <input ref={fileRef} className="hidden-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={selectImage} />
            </>
          )}
        </div>

        {editing ? (
          <form className="form-grid profile-form" onSubmit={saveProfile}>
            <label>
              Name
              <input ref={nameRef} name="name" value={form.name} onChange={updateField} required minLength={2} />
            </label>
            <label>
              Username
              <input name="username" value={form.username} onChange={updateField} required pattern="[A-Za-z0-9_]{3,30}" />
              {usernameState === "available" && <small className="ok-text">Username available</small>}
              {usernameState === "taken" && <small className="form-error">Username already taken</small>}
            </label>
            <div className="button-row">
              <button className="primary-button" disabled={saving || usernameState === "taken"}>
                <Save size={17} />
                {saving ? "Saving..." : "Save Profile"}
              </button>
              <button type="button" className="ghost-button" onClick={cancelEditing}>Cancel</button>
            </div>
          </form>
        ) : (
          <div className="profile-lines">
            <span><User size={18} /> {user?.username}</span>
            <span><Mail size={18} /> {user?.email}</span>
            <span><ShieldCheck size={18} /> Google verified email</span>
            {success && <span className="ok-text"><CheckCircle2 size={18} /> {success}</span>}
          </div>
        )}

        {error && <p className="form-error profile-error">{error}</p>}
      </article>
    </section>
  );
};

export default Profile;

