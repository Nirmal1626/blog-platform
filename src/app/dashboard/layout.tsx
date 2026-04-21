// Force all pages to be dynamically rendered (not static)
// This is needed because Supabase client requires valid env vars at build time
export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
