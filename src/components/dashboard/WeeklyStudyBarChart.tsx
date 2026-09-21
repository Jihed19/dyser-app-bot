import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts';
import { Clock } from 'lucide-react';
import {
  DayStudyData,
  getInitialWeekStudyData,
  subscribeToWeeklyStudyHours,
} from '../../services/studyHoursService';

export const WeeklyStudyBarChart: React.FC = () => {
  const [weekOffset, setWeekOffset] = useState<0 | 1>(0); // 0 = Actual, 1 = Anterior
  const [data, setData] = useState<DayStudyData[]>(() => getInitialWeekStudyData(0));

  useEffect(() => {
    // Suscribirse en tiempo real a las horas de estudio del usuario en Firestore
    const unsubscribe = subscribeToWeeklyStudyHours(weekOffset, (weeklyData) => {
      setData(weeklyData);
    });

    return () => {
      unsubscribe();
    };
  }, [weekOffset]);

  const totalHours = Number(data.reduce((acc, curr) => acc + curr.hours, 0).toFixed(1));
  const targetGoal = 4.0; // 4 horas diarias

  return (
    <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-2xs h-[275px] sm:h-[300px] flex flex-col justify-between overflow-hidden transition-colors">
      {/* Encabezado compacto */}
      <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-gray-100 dark:border-gray-800/80">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="p-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[#00236f] dark:text-blue-400 shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </span>
          <h3 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white tracking-tight truncate">
            Horas de Estudio
          </h3>
        </div>
        <span className="text-[10px] sm:text-xs font-black text-[#00236f] dark:text-[#90a8ff] bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/40 px-1.5 py-0.5 rounded-md shrink-0">
          {totalHours}h tot.
        </span>
      </div>

      {/* Gráfico Recharts compacto */}
      <div className="w-full flex-1 min-h-0 my-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 2, left: -26, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="2 2"
              vertical={false}
              stroke="#e2e8f0"
              className="dark:stroke-gray-800/60"
            />
            <XAxis
              dataKey="shortDay"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              domain={[0, 7]}
              ticks={[0, 3, 6]}
              tick={{ fill: '#94a3b8', fontSize: 9 }}
              tickFormatter={(v) => `${v}h`}
            />
            <ReferenceLine
              y={targetGoal}
              stroke="#fe6b00"
              strokeDasharray="3 3"
              strokeWidth={1.2}
            />
            <Tooltip
              cursor={{ fill: 'rgba(24, 51, 117, 0.05)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as DayStudyData;
                  return (
                    <div className="rounded-xl bg-white dark:bg-[#151c2d] border border-gray-200 dark:border-gray-700 shadow-lg p-2 text-[11px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-gray-900 dark:text-white">{d.day}</span>
                        <span className="font-bold text-[#fe6b00]">{d.hours}h</span>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-[10px] truncate mt-0.5">
                        {d.subject}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="hours" radius={[4, 4, 0, 0]} animationDuration={600}>
              {data.map((entry, index) => {
                const isHighlight = entry.hours >= 5.0 || entry.isToday;
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={isHighlight ? '#fe6b00' : '#183375'}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie de gráfico compacto y simétrico con selector */}
      <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 pt-1.5 border-t border-gray-100 dark:border-gray-800">
        <span className="font-bold text-[#fe6b00] truncate">
          Meta: 4h/d
        </span>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800/80 p-0.5 rounded-lg shrink-0">
          <button
            onClick={() => setWeekOffset(1)}
            className={`px-1.5 py-0.5 font-bold rounded text-[10px] transition ${
              weekOffset === 1
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-2xs'
                : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            Ant
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className={`px-1.5 py-0.5 font-bold rounded text-[10px] transition ${
              weekOffset === 0
                ? 'bg-[#00236f] text-white shadow-2xs'
                : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            Act
          </button>
        </div>
      </div>
    </div>
  );
};

