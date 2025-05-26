import { toast } from "sonner";

import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/auth";

export default function Profile() {
  const { currentUser, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      toast.error("Error during logout");
      console.error("Error during logout:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
        <div className="mb-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Your Profile</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-600">Your account information and settings</p>
        </div>
        <dl className="sm:divide-y sm:divide-gray-200">
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{currentUser?.email}</dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Display Name</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {currentUser?.user_metadata.full_name || "Not set"}
            </dd>
          </div>
        </dl>
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
