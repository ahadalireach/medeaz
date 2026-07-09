import React from 'react';

interface PageHeaderProps {
  label?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export default function PageHeader({
  label,
  title,
  description,
  action,
  className = '',
}: PageHeaderProps) {
  const isPortalLabel = typeof label === 'string' && (
    label === 'Patient portal' || 
    label === 'Doctor portal' || 
    label === 'Manage your clinic'
  );

  return (
    <div className={`flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8 ${className}`}>
      <div>
        {label && !isPortalLabel && (
          <p className="text-[13px] font-medium text-gray-500 tracking-[0.01em] mb-0.5">
            {label}
          </p>
        )}
        <h1 className="font-sans text-[22px] sm:text-[26px] font-bold text-[#0a1628] leading-[1.2] tracking-[-0.01em]">
          {title}
        </h1>
        {description && (
          <p className="text-[14px] text-gray-500 mt-1 leading-[1.6]">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

