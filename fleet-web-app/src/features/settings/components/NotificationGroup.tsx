interface Props {
  title: string;
  entries: [string, boolean][];
  prefix: string;
  onChange: (key: string, checked: boolean) => void;
}

const formatLabel = (key: string, prefix: string): string =>
  key.replace(prefix, '').replace(/([A-Z])/g, ' $1').trim();

const NotificationGroup = ({ title, entries, prefix, onChange }: Props) => (
  <div>
    <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
    <div className="space-y-3">
      {entries.map(([key, value]) => (
        <label
          key={key}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer"
        >
          <span className="text-sm text-gray-700">{formatLabel(key, prefix)}</span>
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => onChange(key, e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
        </label>
      ))}
    </div>
  </div>
);

export default NotificationGroup;
