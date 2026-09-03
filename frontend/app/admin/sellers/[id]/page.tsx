import { redirect } from "next/navigation";

export default async function AdminSellerDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/vendors/${id}`);
}
