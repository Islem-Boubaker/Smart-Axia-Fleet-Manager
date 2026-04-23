interface Props {
  title: string;
  entries: [string, boolean][];
  prefix: string;
  onChange: (key: string, checked: boolean) => void;
  dark?: boolean;
}

const formatLabel = (key: string, prefix: string): string =>
  key.replace(prefix, '').replace(/([A-Z])/g, ' $1').trim();

const NotificationGroup = ({ title, entries, prefix, onChange, dark = false }: Props) => (
  <div>
    <h3 className={`text-sm font-semibold mb-3 ${dark ? 'text-slate-200' : 'text-gray-900'}`}>{title}</h3>
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <label
          key={key}
          className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-colors ${
            dark
              ? 'border-slate-700/50 bg-slate-800/35 hover:bg-slate-800/55'
              : 'border-slate-200/80 bg-slate-50/80 hover:bg-white'
          }`}
        >
          <span className={`text-sm ${dark ? 'text-slate-300' : 'text-gray-700'}`}>{formatLabel(key, prefix)}</span>
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => onChange(key, e.target.checked)}
            className="w-4 h-4 rounded border-slate-500 text-brand focus:ring-brand focus:ring-offset-0 focus:ring-2"
          />
        </label>
      ))}
    </div>
  </div>
);

export default NotificationGroup;
