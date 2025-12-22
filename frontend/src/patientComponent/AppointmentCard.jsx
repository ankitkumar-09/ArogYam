import React, { useMemo } from 'react';

const AppointmentCard = ({ appointment, onView }) => {
  const doctor = appointment?.doctor;
  const doctorName = useMemo(() => {
    if (!doctor) return 'Doctor';
    if (typeof doctor === 'string') return 'Doctor';
    return doctor?.name || doctor?.fullName || `${doctor?.firstName || ''} ${doctor?.lastName || ''}`.trim() || 'Doctor';
  }, [doctor]);

  const type = (appointment?.type || '—').toString();

  const scheduledText = useMemo(() => {
    if (appointment?.scheduledAt) {
      const dt = new Date(appointment.scheduledAt);
      if (!Number.isNaN(dt.getTime())) return dt.toLocaleString();
    }
    return '—';
  }, [appointment?.scheduledAt]);

  const date = appointment?.date || '—';
  const startTime = appointment?.startTime || '—';
  const endTime = appointment?.endTime || '—';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow transition">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-gray-900">{doctorName}</div>
          <div className="mt-1 text-sm text-gray-600">
            <span className="text-gray-500">Type:</span> <span className="capitalize">{type}</span>
          </div>
        </div>

        <button
          onClick={onView}
          className="shrink-0 inline-flex items-center justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          View
        </button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-gray-700">
        <div className="flex items-center justify-between gap-3">
          <span className="text-gray-500">Scheduled at</span>
          <span className="text-right">{scheduledText}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-gray-500">Date</span>
          <span>{date}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-gray-500">Start</span>
          <span>{startTime}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-gray-500">End</span>
          <span>{endTime}</span>
        </div>
      </div>
    </div>
  );
};

export default AppointmentCard;