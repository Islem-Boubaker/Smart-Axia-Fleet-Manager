import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiCalendar, FiFileText, FiTruck, FiUser, FiX } from 'react-icons/fi';
import { Badge, Button } from '../../../shared/components';
import type { ReclamationRecord, ReclamationStatus } from '../services/reclamations.service';

interface DriverIssueDetailsModalProps {
  issue: ReclamationRecord | null;
  isOpen: boolean;
  dark?: boolean;
  onClose: () => void;
  statusLabel: Record<ReclamationStatus, string>;
  getDriverLabel: (item: ReclamationRecord) => string;
  getVehicleLabel: (item: ReclamationRecord) => string;
}

const statusVariant: Record<ReclamationStatus, 'warning' | 'info' | 'success' | 'error'> = {
  PENDING: 'warning',
  IN_PROGRESS: 'info',
  RESOLVED: 'success',
  REJECTED: 'error',
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-GB');
};

const DriverIssueDetailsModal = ({
  issue,
  isOpen,
  dark = false,
  onClose,
  statusLabel,
  getDriverLabel,
  getVehicleLabel,
}: DriverIssueDetailsModalProps) => {
  useEffect(() => {
    if (!isOpen) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !issue) return null;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[4px]"
        aria-label="Close issue details"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="driver-issue-title"
        className={`relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl border shadow-2xl animate-fade-in ${
          dark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
        }`}
      >
        <div
          className={`sticky top-0 z-10 border-b px-6 py-5 sm:px-8 ${
            dark ? 'border-slate-700 bg-slate-900/95' : 'border-slate-200 bg-white/95'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                Driver Issue Report
              </p>
              <h2 id="driver-issue-title" className={`text-xl font-bold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
                {issue.subject}
              </h2>
              <Badge variant={statusVariant[issue.status]} size="sm">
                {statusLabel[issue.status]}
              </Badge>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                dark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'
              }`}
              aria-label="Close"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-6 sm:px-8 sm:py-7">
          <div className="space-y-6">
            <section className={`rounded-2xl border p-5 ${dark ? 'border-slate-700 bg-slate-800/35' : 'border-slate-200 bg-slate-50/70'}`}>
              <div className="mb-3 flex items-center gap-2">
                <FiFileText className={dark ? 'text-slate-400' : 'text-slate-500'} />
                <p className={`text-sm font-semibold ${dark ? 'text-slate-200' : 'text-slate-800'}`}>Issue Description</p>
              </div>
              <p className={`whitespace-pre-wrap leading-6 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{issue.message}</p>
            </section>

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className={`rounded-2xl border p-4 ${dark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-white'}`}>
                <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Driver
                </p>
                <p className={`flex items-center gap-2 text-sm font-medium ${dark ? 'text-slate-200' : 'text-slate-800'}`}>
                  <FiUser className={dark ? 'text-slate-500' : 'text-slate-500'} />
                  {getDriverLabel(issue)}
                </p>
              </div>

              <div className={`rounded-2xl border p-4 ${dark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-white'}`}>
                <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Vehicle
                </p>
                <p className={`flex items-center gap-2 text-sm font-medium ${dark ? 'text-slate-200' : 'text-slate-800'}`}>
                  <FiTruck className={dark ? 'text-slate-500' : 'text-slate-500'} />
                  {getVehicleLabel(issue)}
                </p>
              </div>

              <div className={`rounded-2xl border p-4 ${dark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-white'}`}>
                <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Created At
                </p>
                <p className={`flex items-center gap-2 text-sm ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <FiCalendar className={dark ? 'text-slate-500' : 'text-slate-500'} />
                  {formatDateTime(issue.createdAt)}
                </p>
              </div>

              <div className={`rounded-2xl border p-4 ${dark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-white'}`}>
                <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Updated At
                </p>
                <p className={`flex items-center gap-2 text-sm ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <FiCalendar className={dark ? 'text-slate-500' : 'text-slate-500'} />
                  {formatDateTime(issue.updatedAt)}
                </p>
              </div>
            </section>

            {issue.images?.length ? (
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <p className={`text-sm font-semibold ${dark ? 'text-slate-200' : 'text-slate-800'}`}>Attachments</p>
                  <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-500'}`}>{issue.images.length} file(s)</p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {issue.images.map((image, index) => (
                    <a
                      key={`${issue.id}-img-${index}`}
                      href={image}
                      target="_blank"
                      rel="noreferrer"
                      className={`group relative block overflow-hidden rounded-2xl border ${
                        dark ? 'border-slate-700' : 'border-slate-200'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Issue attachment ${index + 1}`}
                        className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/45 via-transparent to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <span className="rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-slate-900">Open preview</span>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>

        <div className={`border-t px-6 py-4 sm:px-8 ${dark ? 'border-slate-700 bg-slate-900/95' : 'border-slate-200 bg-white/95'}`}>
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DriverIssueDetailsModal;
