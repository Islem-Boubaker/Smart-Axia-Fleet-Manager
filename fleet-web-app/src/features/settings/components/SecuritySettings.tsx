import { FiLock } from 'react-icons/fi';
import { Card, Button, Input } from '../../../shared/components';

const cardExtra = (dark: boolean) =>
  dark
    ? 'rounded-2xl !border-slate-700/70 !bg-slate-900/40 shadow-soft ring-1 ring-white/[0.06] backdrop-blur-md'
    : 'rounded-2xl !border-slate-200/90 !bg-white/75 shadow-glass backdrop-blur-sm';

interface Props {
  dark?: boolean;
}

const SecuritySettings = ({ dark = false }: Props) => {
  const label = dark ? 'text-slate-400' : 'text-gray-700';
  const input = dark ? 'border-slate-600 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 rounded-xl' : 'rounded-xl';

  return (
    <Card
      title="Security"
      subtitle="Manage your password and security"
      dark={dark}
      padding="lg"
      className={cardExtra(dark)}
    >
      <div className="space-y-5">
        <div>
          <label className={`block text-sm font-medium mb-2 ${label}`}>Current password</label>
          <Input type="password" placeholder="Enter current password" className={input} />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${label}`}>New password</label>
          <Input type="password" placeholder="Enter new password" className={input} />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${label}`}>Confirm new password</label>
          <Input type="password" placeholder="Confirm new password" className={input} />
        </div>
        <div className="flex justify-end pt-2">
          <Button className="rounded-xl">
            <FiLock className="mr-2" />
            Change password
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default SecuritySettings;
