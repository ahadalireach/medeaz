"use client";

import { motion } from "framer-motion";

interface MiniBarChartProps {
  data: { label: string; value: number }[];
  color: string;
  unit: string;
}

export default function MiniBarChart({ data, color, unit }: MiniBarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="space-y-4">
      {/* Bars container */}
      <div className="h-32 flex items-end justify-between gap-3 pt-6 border-b border-gray-100">
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;
          return (
            <div key={index} className="flex-1 flex flex-col items-center group relative h-full justify-end">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-[11px] font-bold px-2 py-1 rounded shadow-md whitespace-nowrap z-20 pointer-events-none">
                {unit} {item.value.toLocaleString()}
              </div>

              {/* Bar */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(percentage, 4)}%` }} // Ensure at least a minimal bar height is visible
                transition={{
                  duration: 0.5,
                  delay: index * 0.05,
                  ease: [0.22, 1, 0.36, 1]
                }}
                style={{ backgroundColor: color }}
                className="w-full rounded-t hover:opacity-85 transition-opacity cursor-pointer"
              />
            </div>
          );
        })}
      </div>

      {/* X-Axis labels */}
      <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
        {data.map((item, index) => (
          <span key={index} className="flex-1 text-center truncate">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
