import PaymentReturn from "@/components/payment-return";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ attempt?: string }>;
}) {
  const { attempt } = await searchParams;
  return (
    <main id="main-content" className="account-main">
      <PaymentReturn
        id={/^[a-f0-9]{64}$/.test(attempt ?? "") ? attempt! : "invalid"}
      />
    </main>
  );
}
