import React from 'react';
import { MONTHS } from '../utils/helpers';

export default function Calendar({
  year,
  month,
  onChangeMonth,
  attendance = {},
  onToggleDate,
}) {
  const getMonthDays = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (y, m) => new Date(y, m, 1).getDay();

  const daysInMonth = getMonthDays(year, month);
  const firstDayIndex = getFirstDay(year, month);

  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const todayDate = today.getDate();

  const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const cells = [];

  // Add empty slots before first day
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push({ type: 'empty', label: i });
  }

  // Add month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const status = attendance[dateStr] || null;
    const isToday = isCurrentMonth && d === todayDate;
    const isFuture = isCurrentMonth && d > todayDate;

    cells.push({
      type: 'day',
      day: d,
      dateStr,
      status,
      isToday,
      isFuture,
    });
  }

  return (
    <div className="card">
      <div className="calendar-header">
        <button className="cal-nav" onClick={() => onChangeMonth(-1)} aria-label="Previous Month">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="cal-month">
          {MONTHS[month]} {year}
        </span>
        <button className="cal-nav" onClick={() => onChangeMonth(1)} aria-label="Next Month">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div className="cal-grid">
        {dayLabels.map((lbl) => (
          <div key={lbl} className="cal-day-label">
            {lbl}
          </div>
        ))}

        {cells.map((cell, idx) => {
          if (cell.type === 'empty') {
            return (
              <button key={`empty-${idx}`} className="cal-day empty" disabled>
                0
              </button>
            );
          }

          let className = 'cal-day';
          if (cell.status === 'present') className += ' present';
          else if (cell.status === 'absent') className += ' absent';
          if (cell.isToday) className += ' today';
          if (cell.isFuture) className += ' future';

          return (
            <button
              key={`day-${cell.day}`}
              className={className}
              disabled={cell.isFuture}
              onClick={() => !cell.isFuture && onToggleDate(cell.dateStr, cell.day)}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      <div className="att-legend">
        <div className="leg-item">
          <div className="leg-dot" style={{ background: '#1D9E75' }} />
          Present
        </div>
        <div className="leg-item">
          <div className="leg-dot" style={{ background: '#E24B4A' }} />
          Absent
        </div>
        <div className="leg-item">
          <div
            className="leg-dot"
            style={{
              border: '1.5px solid #1D9E75',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
            }}
          />
          Today
        </div>
      </div>
    </div>
  );
}
