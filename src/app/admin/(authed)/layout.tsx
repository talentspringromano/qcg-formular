import Link from 'next/link';
import LogoutButton from '../LogoutButton';

export default function AuthedAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="bg-green-800 text-white sticky top-0 z-50 px-6 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <Link href="/admin" className="flex items-center gap-3 min-w-0">
          <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center font-serif text-base">Q</span>
          <span className="text-sm font-medium truncate">QCG Admin · Talentspring</span>
        </Link>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/admin" className="text-sm text-white/80 hover:text-white">Anträge</Link>
          <LogoutButton />
        </div>
      </div>
      <div className="max-w-[1080px] mx-auto px-6 py-8">{children}</div>
    </div>
  );
}
