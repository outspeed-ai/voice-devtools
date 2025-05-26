import { NavLink } from "react-router";

interface NavLinkItemProps {
  to: string;
  children: React.ReactNode;
  onClick?: () => void;
}

const NavLinkItem: React.FC<NavLinkItemProps> = ({ to, children, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => `text-black ${isActive ? "font-medium border-b-2 border-teal-600 text-teal-700" : ""}`}
  >
    {children}
  </NavLink>
);

export default NavLinkItem;
