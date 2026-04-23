// Pages can now be statically rendered since mock database handles build phase

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
