import React from 'react';

interface InfoRowProps {
  label: string;
  value: string | React.ReactNode;
  className: string;
}

const InfoRow = ({ label, value, className }: InfoRowProps) => (
  <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
    <span className="text-gray-400 flex-shrink-0">{label}</span>
    {typeof value === 'string' ? (
      <span className={`font-semibold ${className} break-words text-right flex-1`}>{value}</span>
    ) : (
      <div className={`font-semibold ${className} break-words text-right flex-1`}>{value}</div>
    )}
  </div>
);

export default InfoRow;
