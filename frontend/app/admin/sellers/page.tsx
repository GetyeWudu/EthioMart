import { redirect } from "next/navigation";

export default function AdminSellersRedirect() {
  redirect("/admin/vendors");
}
