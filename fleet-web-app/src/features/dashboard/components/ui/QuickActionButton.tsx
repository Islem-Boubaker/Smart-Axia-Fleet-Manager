interface QuickActionButtonProps {
  label: string;
  onClick: () => void;
}

export const QuickActionButton = ({ label, onClick }: QuickActionButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className="group w-full text-left text-sm px-4 py-2.5 rounded-xl border border-gray-200/80 dark:border-gray-700/80 bg-white/70 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 flex items-center justify-between hover:-translate-y-0.5"
  >
    <span className="font-medium text-gray-700 dark:text-gray-200">{label}</span>
    <span className="text-blue-500 dark:text-blue-300 transition-transform duration-200 group-hover:translate-x-0.5">→</span>
  </button>
);

export default QuickActionButton;
