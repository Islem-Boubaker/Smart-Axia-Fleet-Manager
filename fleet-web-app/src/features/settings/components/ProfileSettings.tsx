import { useState, useRef, useEffect } from 'react';
import { FiMail, FiPhone, FiSave, FiUpload, FiTrash2 } from 'react-icons/fi';
import { Card, Button, Input } from '../../../shared/components';
import type { ProfileData } from '../settings.types';

interface Props {
  profileData: ProfileData;
  onSave: (data: ProfileData, file: File | null) => Promise<void>;
  dark?: boolean;
}

const cardExtra = (dark: boolean) =>
  dark
    ? 'rounded-2xl !border-slate-700/70 !bg-slate-900/40 shadow-soft ring-1 ring-white/[0.06] backdrop-blur-md'
    : 'rounded-2xl !border-slate-200/90 !bg-white/75 shadow-glass backdrop-blur-sm';

const ProfileSettings = ({ profileData, onSave, dark = false }: Props) => {
  const [formData, setFormData] = useState<ProfileData>(profileData);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(profileData.avatar || null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(profileData);
    if (!selectedFile) {
      setPreviewUrl(profileData.avatar || null);
    }
  }, [profileData]);

  const updateField = (field: keyof ProfileData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(profileData.avatar || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(formData, selectedFile);
    setIsSaving(false);
  };

  const label = dark ? 'text-slate-400' : 'text-gray-700';

  return (
    <Card
      title="Profile information"
      subtitle="Update your personal information"
      dark={dark}
      padding="lg"
      className={cardExtra(dark)}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-6 pb-6 border-b border-slate-200 dark:border-slate-700/50">
          <div className="shrink-0 relative">
            <div className={`w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-3|e bg-gradient-to-br from-amber-300 to-slate-700 ${
              dark ? 'ring-2 ring-brand/30 shadow-lg shadow-black/20' : 'shadow-md ring-2 ring-slate-100'
            }`}>
              {previewUrl ? (
                <img src={previewUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
              ) : (
                (formData.name || 'User')
                  .split(' ')
                  .filter(Boolean)
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              )}
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-slate-900'}`}>Profile Photo</p>
            <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
              Recommended: Square image, max 2MB.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} className="text-xs px-3 py-1.5 h-auto">
                <FiUpload className="mr-1.5" />
                Upload new
              </Button>
              {selectedFile && (
                <Button type="button" variant="ghost" onClick={clearFile} className="text-xs px-3 py-1.5 h-auto text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <FiTrash2 className="mr-1.5" />
                  Remove
                </Button>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${label}`}>Full name</label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            className={
              dark ? 'border-slate-600 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 rounded-xl' : 'rounded-xl'
            }
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 $xlabel}`}>
              <FiMail className="inline mr-2" />
              Email
            </label>
            <Input
              type="email"
              value={formData.email}
              disabled
              className={
                dark ? 'border-slate-700 bg-slate-800/50 text-slate-500 rounded-xl' : 'rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed'
              }
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${label}`}>
              <FiPhone className="inline mr-2" />
              Phone
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              className={
                dark ? 'border-slate-600 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 rounded-xl' : 'rounded-xl'
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${label}`}>Company</label>
            <Input
              type="text"
              value={formData.company}
              onChange={(e) => updateField('company', e.target.value)}
              className={
                dark ? 'border-slate-600 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 rounded-xl' : 'rounded-xl'
              }
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${label}`}>Role</label>
            <Input
              type="text"
              value={formData.role || ''}
              disabled
              className={dark ? 'border-slate-700 bg-slate-800/50 text-slate-500 rounded-xl' : 'rounded-xl'}
            />
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700/50 pt-6 mt-6">
          <h4 className={`text-lg font-bold mb-4 ${dark ? 'text-white' : 'text-slate-900'}`} id="address-section">Address</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${label}`}>Country</label>
              <Input
                type="text"
                value={formData.country || ''}
                onChange={(e) => updateField('country', e.target.value)}
                className={dark ? 'border-slate-600 bg-slate-800/80 text-slate-100 rounded-xl' : 'rounded-xl'}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${label}`}>City / State</label>
              <Input
                type="text"
                value={formData.city || ''}
                onChange={(e) => updateField('city', e.target.value)}
                className={dark ? 'border-slate-600 bg-slate-800/80 text-slate-100 rounded-xl' : 'rounded-xl'}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${label}`}>Postal code</label>
              <Input
                type="text"
                value={formData.postalCode || ''}
                onChange={(e) => updateField('postalCode', e.target.value)}
                className={dark ? 'border-slate-600 bg-slate-800/80 text-slate-100 rounded-xl' : 'rounded-xl'}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${label}`}>TAX ID</label>
              <Input
                type="text"
                value={formData.taxId || ''}
                onChange={(e) => updateField('taxId', e.target.value)}
                className={dark ? 'border-slate-600 bg-slate-800/80 text-slate-100 rounded-xl' : 'rounded-xl'}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button className="rounded-xl" onClick={handleSave} isLoading={isSaving}>
            <FiSave className="mr-2" />
            {isSaving ? 'Saving..-' : 'Save changes'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ProfileSettings;
