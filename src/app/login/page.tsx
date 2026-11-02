import AuthForm from "@/components/auth-form";
export const metadata = { title: "Log in | Pakistan Railways" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  return <AuthForm mode="login" returnTo={(await searchParams).returnTo} />;
}
