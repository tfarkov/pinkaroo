import React, { useMemo, useState } from 'react';
import _ from 'lodash'; // For throttling

interface Props {
  price: number;
}

export default function MortgageCalculator({ price }: Props) {
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [interestRate, setInterestRate] = useState(5);
  const [termYears, setTermYears] = useState(30);

  const throttledSetDownPayment = _.throttle(setDownPaymentPct, 300);
  const throttledSetInterest = _.throttle(setInterestRate, 300);
  const throttledSetTerm = _.throttle(setTermYears, 300);

  const monthlyPayment = useMemo(() => {
    const principal = price * (1 - downPaymentPct / 100);
    const monthlyRate = interestRate / 100 / 12;
    const months = termYears * 12;
    if (monthlyRate === 0) return principal / months;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  }, [price, downPaymentPct, interestRate, termYears]);

  const formattedPayment = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(monthlyPayment);

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900 mb-4">Mortgage calculator</h2>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <label className="text-slate-700">Down payment</label>
            <span className="font-semibold text-slate-900">{downPaymentPct}%</span>
          </div>
          <input type="range" min={0} max={50} value={downPaymentPct} onChange={(e) => throttledSetDownPayment(Number(e.target.value))} className="w-full h-2 rounded-full bg-slate-200 appearance-none accent-accent-500" />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <label className="text-slate-700">Interest rate</label>
            <span className="font-semibold text-slate-900">{interestRate}%</span>
          </div>
          <input type="range" min={1} max={10} step={0.1} value={interestRate} onChange={(e) => throttledSetInterest(Number(e.target.value))} className="w-full h-2 rounded-full bg-slate-200 appearance-none accent-accent-500" />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <label className="text-slate-700">Term</label>
            <span className="font-semibold text-slate-900">{termYears} years</span>
          </div>
          <input type="range" min={10} max={40} value={termYears} onChange={(e) => throttledSetTerm(Number(e.target.value))} className="w-full h-2 rounded-full bg-slate-200 appearance-none accent-accent-500" />
        </div>
      </div>
      <p className="mt-6 pt-4 border-t border-slate-200 text-lg font-bold text-slate-900">Estimated monthly payment: {formattedPayment}</p>
    </div>
  );
}
