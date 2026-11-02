import AuthForm from "@/components/auth-form";
import { developmentMailEnabled } from "@/server/auth";
export const dynamic = "force-dynamic";
export default function Page() {
  return <AuthForm mode="forgot" mailEnabled={developmentMailEnabled()} />;
}
