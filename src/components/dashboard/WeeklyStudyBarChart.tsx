import React, { useState } from 'react';
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
import { Clock, TrendingUp, Award, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DayStudyData {
  day: string;
  shortDay: string;
  hours: number;
  subject: string;
  sessions: number;
  isToday?: boolean;
}

const CURRENT_WEEK_DATA: DayStudyData[] = [
  { day: 'Lunes', shortDay: 'Lun', hours: 4.2, subject: 'Cálculo Vectorial', sessions: 2 },
  { day: 'Martes', shortDay: 'Mar', hours: 5.0, subject: 'Estructuras de Datos', sessions: 3 },
  { day: 'Miércoles', shortDay: 'Mié', hours: 3.8, subject: 'Física Universitaria', sessions: 2 },
  { day: 'Jueves', shortDay: 'Jue', hours: 4.5, subject: 'Bases de Datos', sessions: 2 },
  { day: 'Viernes', shortDay: 'Vie', hours: 3.0, subject: 'Redes y Sistemas', sessions: 1 },
  { day: 'Sábado', shortDay: 'Sáb', hours: 6.0, subject: 'Proyecto Final & IA', sessions: 4 },
  { day: 'Domingo', shortDay: 'Dom', hours: 2.2, subject: 'Repaso Semanal', sessions: 1, isToday: true },
];

const PREV_WEEK_DATA: DayStudyData[] = [
  { day: 'Lunes', shortDay: 'Lun', hours: 3.5, subject: 'Cálculo Vectorial', sessions: 2 },
  { day: 'Martes', shortDay: 'Mar', hours: 4.0, subject: 'Estructuras de Datos', sessions: 2 },
  { day: 'Miércoles', shortDay: 'Mié', hours: 4.2, subject: 'Física Universitaria', sessions: 2 },
  { day: 'Jueves', shortDay: 'Jue', hours: 3.8, subject: 'Bases de Datos', sessions: 2 },
  { day: 'Viernes', shortDay: 'Vie', hours: 2.5, subject: 'Redes y Sistemas', sessions: 1 },
  { day: 'Sábado', shortDay: 'Sáb', hours: 5.5, subject: 'Simulacro de Examen', sessions: 3 },
  { day: 'Domingo', shortDay: 'Dom', hours: 1.8, subject: 'Organización', sessions: 1 },
];

export const WeeklyStudyBarChart: React.FC = () => {
  const [weekOffset, setWeekOffset] = useState<0 | 1>(0); // 0 = Actual, 1 = Anterior
  const data = weekOffset === 0 ? CURRENT_WEEK_DATA : PREV_WEEK_DATA;

  const totalHours = Number(data.reduce((acc, curr) => acc + curr.hours, 0).toFixed(1));
  const avgHours = Number((totalHours / 7).toFixed(1));
  const bestDay = [...data].sort((a, b) => b.hours - a.hours)[0];
  const targetGoal = 4.0; // 4 horas diarias recomendadas

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-xs transition-colors">
      {/* Encabezado del gráfico */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#00236f] dark:text-blue-400">
              <Clock className="w-4 h-4" />
            </span>
            <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-tight">
              Horas de Estudio Semanales
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Visualización con <span className="font-semibold text-[#00236f] dark:text-[#90a8ff]">Recharts</span> del tiempo dedicado a asignaturas y repasos
          </p>
        </div>

        {/* Selector de semana */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-gray-100 dark:bg-gray-800/60 p-1 rounded-xl">
          <button
            onClick={() => setWeekOffset(1)}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
              weekOffset === 1
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Semana anterior
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
              weekOffset === 0
                ? 'bg-[#00236f] text-white shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Esta semana
          </button>
        </div>
      </div>

      {/* Resumen métrico superior */}
      <div className="grid grid-cols-3 gap-3 my-4">
        <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block">
            Total Semanal
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl sm:text-2xl font-black text-[#00236f] dark:text-[#90a8ff]">
              {totalHours}
            </span>
            <span className="text-xs font-bold text-gray-400">horas</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block">
            Promedio Diario
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {avgHours}
            </span>
            <span className="text-xs font-bold text-gray-400">h / día</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block">
            Día Más Productivo
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base sm:text-lg font-black text-[#fe6b00] truncate">
              {bestDay.day}
            </span>
            <span className="text-xs font-bold text-gray-400">({bestDay.hours}h)</span>
          </div>
        </div>
      </div>

      {/* Gráfico Recharts */}
      <div className="w-full h-64 sm:h-72 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 10, left: -15, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
              className="dark:stroke-gray-800"
            />

            <XAxis
              dataKey="shortDay"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              domain={[0, 8]}
              ticks={[0, 2, 4, 6, 8]}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(v) => `${v}h`}
            />

            {/* Línea de meta recomendada (4h) */}
            <ReferenceLine
              y={targetGoal}
              stroke="#fe6b00"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: 'Meta 4h',
                position: 'top',
                fill: '#fe6b00',
                fontSize: 10,
                fontWeight: 700,
              }}
            />

            <Tooltip
              cursor={{ fill: 'rgba(24, 51, 117, 0.06)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as DayStudyData;
                  const reachedGoal = d.hours >= targetGoal;
                  return (
                    <div className="rounded-2xl bg-white dark:bg-[#151c2d] border border-gray-200 dark:border-gray-700 shadow-xl p-3 text-xs">
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <span className="font-black text-gray-900 dark:text-white">
                          {d.day}
                        </span>
                        {reachedGoal ? (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            Meta Cumplida ✓
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            Bajo Meta
                          </span>
                        )}
                      </div>
                      <p className="font-extrabold text-sm text-[#00236f] dark:text-[#90a8ff]">
                        {d.hours} horas dedicadas
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-[11px]">
                        Materia: <strong className="text-gray-700 dark:text-gray-200">{d.subject}</strong>
                      </p>
                      <p className="text-gray-400 text-[10px] mt-0.5">
                        {d.sessions} {d.sessions === 1 ? 'bloque' : 'bloques'} de estudio
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Bar
              dataKey="hours"
              radius={[8, 8, 0, 0]}
              animationDuration={800}
            >
              {data.map((entry, index) => {
                // El sábado o el día con mayor hora o el día actual reciben el acento naranja Dyser
                const isHighlight = entry.hours >= 5.5 || entry.isToday;
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={isHighlight ? '#fe6b00' : '#183375'}
                    className="hover:opacity-85 transition-opacity"
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-2 pt-3 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#183375]" />
            <span>Horas regulares</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#fe6b00]" />
            <span>Pico / Hoy</span>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          +14% vs. la semana anterior
        </span>
      </div>
    </div>
  );
};
