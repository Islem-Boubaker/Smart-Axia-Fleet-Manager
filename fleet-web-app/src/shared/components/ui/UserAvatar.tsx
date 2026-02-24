import { useAppSelector } from "../../hooks";

const UserAvatar = () => {
  const { user } = useAppSelector((state) => state.auth);

  // fallback values
  const name = user?.name || "User";
  const role = user?.role || "Role";

  // generate initials automatically
  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = getInitials(name);

  return (
    <>
      
        <div className="flex items-center space-x-3 p-3 rounded-lg ">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
            <p className="text-xs text-gray-500 truncate">{role}</p>
          </div>
        </div>
     
    </>
  );
};

export default UserAvatar;
