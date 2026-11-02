import AuthForm from "@/components/auth-form";
export const metadata = { title: "Create account | Pakistan Railways" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  return <AuthForm mode="signup" returnTo={(await searchParams).returnTo} />;
}
