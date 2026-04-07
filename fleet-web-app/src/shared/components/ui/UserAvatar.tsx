import { useAppSelector } from "../../hooks";

const UserAvatar = () => {
  const { user } = useAppSelector((state) => state.auth);

  const name = user?.name || "User";
  const role = user?.role || "Role";

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
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium shrink-0 overflow-hidden">
        {user?.avatar ? (
          <img src={user.avatar} alt={name} className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">{name}</p>
        <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{role}</p>
      </div>
    </div>
  );
};

export default UserAvatar;