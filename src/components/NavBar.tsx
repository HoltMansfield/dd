import { getCurrentUser } from "@/actions/auth";
import NavBarClient from "./NavBarClient";

export default async function NavBar() {
  const currentUser = await getCurrentUser();
  
  return <NavBarClient currentUser={currentUser} />;
}
