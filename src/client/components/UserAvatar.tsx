import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { useAuth } from "@/contexts/auth";

export default function UserAvatar() {
  const { currentUser, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      setIsDropdownOpen(false);
    } catch (error) {
      toast.error("Error during logout");
      console.error("Error during logout:", error);
    }
  };

  const getAvatarContent = () => {
    // Check for profile picture URL in user_metadata
    const avatarUrl = currentUser?.user_metadata?.avatar_url || currentUser?.user_metadata?.picture;

    if (avatarUrl && !imageError) {
      return (
        <img
          src={avatarUrl}
          alt="Profile"
          className="w-8 h-8 rounded-full object-cover"
          onError={() => setImageError(true)}
        />
      );
    }

    // Fallback to first letter of name or email
    const name = currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name;
    const email = currentUser?.email;
    const fallbackText = name ? name.charAt(0).toUpperCase() : email?.charAt(0).toUpperCase() || "U";

    return (
      <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-sm font-medium">
        {fallbackText}
      </div>
    );
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center justify-center hover:ring-2 hover:ring-teal-500 hover:ring-offset-2 rounded-full transition-all duration-200"
        aria-label="User menu"
      >
        {getAvatarContent()}
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
          <Link
            to="/profile"
            onClick={() => setIsDropdownOpen(false)}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
          >
            View Profile
          </Link>
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
