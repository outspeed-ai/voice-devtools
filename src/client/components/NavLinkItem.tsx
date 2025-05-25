import { NavLink } from "react-router";

interface NavLinkItemProps {
  to: string;
  children: React.ReactNode;
}

const NavLinkItem: React.FC<NavLinkItemProps> = ({ to, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `text-black ${isActive ? "font-medium border-b-2 border-teal-600 text-teal-700" : ""}`}
  >
    {children}
  </NavLink>
);

export default NavLinkItem;
