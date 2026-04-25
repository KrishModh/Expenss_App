import { Mail, ShieldCheck, User } from "lucide-react";
import { useAuth } from "../hooks/useAuth.jsx";

const Profile = () => {
  const { user } = useAuth();

  return (
    <section className="page-stack">
      <div className="page-title">
        <div>
          <p>Profile</p>
          <h1>{user?.name}</h1>
        </div>
      </div>
      <article className="panel profile-panel">
        <div className="profile-avatar">{user?.username?.slice(0, 2).toUpperCase()}</div>
        <div className="profile-lines">
          <span><User size={18} /> {user?.username}</span>
          <span><Mail size={18} /> {user?.email}</span>
          <span><ShieldCheck size={18} /> Google verified email</span>
        </div>
      </article>
    </section>
  );
};

export default Profile;
