import React from 'react';
import { formatCurrency } from '../utils/helpers';

export default function SalaryBreakdown({
  presentDays,
  wage,
  overtime = 0,
  deduction = 0,
  advance = 0,
  manualOverride = null,
}) {
  const baseSalary = presentDays * wage;
  const netPayable =
    manualOverride !== null && manualOverride !== undefined
      ? manualOverride
      : baseSalary + overtime - deduction - advance;

  return (
    <div className="sal-breakdown">
      <div className="sal-row">
        <span className="sal-key">
          Base ({presentDays} days × {formatCurrency(wage)})
        </span>
        <span className="sal-val">{formatCurrency(baseSalary)}</span>
      </div>

      <div className="sal-row">
        <span className="sal-key">Overtime</span>
        <span className="sal-val">+{formatCurrency(overtime)}</span>
      </div>

      <div className="sal-row">
        <span className="sal-key">Deductions</span>
        <span className="sal-val">-{formatCurrency(deduction)}</span>
      </div>

      <div className="sal-row">
        <span className="sal-key">Advance paid</span>
        <span className="sal-val">-{formatCurrency(advance)}</span>
      </div>

      {manualOverride !== null && manualOverride !== undefined ? (
        <div className="sal-row">
          <span className="sal-key" style={{ color: 'var(--text-info)', fontWeight: 500 }}>
            Manual override
          </span>
          <span className="sal-val" style={{ color: 'var(--text-info)', fontWeight: 600 }}>
            {formatCurrency(manualOverride)}
          </span>
        </div>
      ) : null}

      <div className="sal-row">
        <span className="sal-key total">Net payable</span>
        <span className="sal-val total">{formatCurrency(Math.max(0, netPayable))}</span>
      </div>
    </div>
  );
}
