import React from 'react';
import { getInitials, avatarBg } from '../../utils/avatar';

const UserAvatar = ({ user = {}, size = 40, className = '' }) => {
  const { username = '', fullName = '', profileImage } = user;
  const px = `${size}px`;

  if (profileImage) {
    return (
      <img
        src={profileImage} alt={username}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
        style={{ width: px, height: px }}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 select-none font-display font-bold text-white ${className}`}
      style={{
        width: px, height: px,
        background: avatarBg(username || fullName),
        fontSize: size * 0.38,
      }}
      title={username ? `@${username}` : fullName}
    >
      {getInitials(fullName || username)}
    </div>
  );
};

export default UserAvatar;
