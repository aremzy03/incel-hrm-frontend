import { redirect } from "next/navigation";

/** Root /appraisals → redirect to /appraisals/me */
export default function AppraisalsRootPage() {
  redirect("/appraisals/me");
}
