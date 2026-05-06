import { useAppSelector } from "../../hooks";
import { useTranslation } from "react-i18next";

interface UserAvatarProps {
  compact?: boolean;
}

const UserAvatar = ({ compact = false }: UserAvatarProps) => {
  const { i18n } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);
  const isRtl = (i18n.language || "en").split("-")[0] === "ar";

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
    <div className={`flex items-center gap-2 sm:gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
      <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-medium shrink-0 overflow-hidden">
        {user?.avatar ? (
          <img src={user.avatar} alt={name} className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </div>
      {!compact && (
        <div className={`flex-1 min-w-0 ${isRtl ? "text-right" : "text-left"}`}>
          <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-slate-100 truncate">{name}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 truncate">{role}</p>
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
