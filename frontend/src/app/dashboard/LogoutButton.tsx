'use client';

import { useRouter } from 'next/navigation';
import Logout03Icon from '../../../public/icons/logout-03-stroke-rounded';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    try {
      localStorage.removeItem('authToken');
    } catch {}

    try {
      document.cookie = 'authToken=; Max-Age=0; Path=/; SameSite=Lax';
    } catch {}

    try {
      router.replace('/');
    } catch {
      window.location.replace('/');
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="menu-item menu-item-danger cursor-pointer"
    >
      <Logout03Icon width={20} height={20} color="currentColor" />
      خروج از حساب
    </button>
  );
}


