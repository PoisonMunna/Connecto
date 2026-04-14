import { backendUrl } from '../config';

export default function Avatar({ user = {}, size = '' }) {
  const initials = (user.username || '?')[0].toUpperCase();
  const sizeClass = size === 'sm' ? 'avatar-sm' : size === 'lg' ? 'avatar-lg' : '';

  if (user.profile_pic && user.profile_pic !== 'default.png') {
    return (
      <img
        src={backendUrl(user.profile_pic)}
        className={`avatar ${sizeClass}`}
        alt={user.username}
      />
    );
  }
  return (
    <div className={`avatar-init ${sizeClass}`}>
      {initials}
    </div>
  );
}
