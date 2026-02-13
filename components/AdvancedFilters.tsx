import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import type { ParsedUrlQueryInput } from 'querystring';
import { debounce } from 'lodash';
import { DEBOUNCE_MS, PROVINCES, PROPERTY_TYPES, UI } from '../lib/constants';

interface FilterData {
  province: string;
  minPrice: number;
  maxPrice: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  // Expanded filters
}

export default function AdvancedFilters({ onFilter }: { onFilter: (filters: FilterData) => void }) {
  const { register, handleSubmit, watch, setValue } = useForm<FilterData>();
  const router = useRouter();
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  const debouncedFilter = debounce((data: FilterData) => {
    onFilter(data);
    const query: ParsedUrlQueryInput = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === undefined || v === '' ? undefined : String(v)])
    );
    router.push({ query }, undefined, { shallow: true }); // Shareable URL params
  }, 300);

  useEffect(() => {
    // Load from URL params
    Object.entries(router.query).forEach(([key, value]) => setValue(key as keyof FilterData, value as any));
    const subscription = watch((data) => debouncedFilter(data as FilterData));
    return () => subscription.unsubscribe();
  }, [watch, router.query]);

  return (
    <div className="mb-6">
      <button onClick={() => setIsAccordionOpen(!isAccordionOpen)} className="md:hidden btn-primary w-full mb-4">{UI.FILTERS}</button>
      <div className={`${isAccordionOpen ? 'block' : 'hidden'} md:block`}>
        <form onSubmit={handleSubmit(onFilter)} className="bg-white rounded-lg shadow-card border border-slate-200 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[140px]">
              <label className="label">{UI.ANY_PROVINCE}</label>
              <select {...register('province')} className="input-field">
                <option value="">All</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="w-28">
              <label className="label">{UI.MIN_PRICE}</label>
              <input {...register('minPrice')} type="number" placeholder="Min" className="input-field" />
            </div>
            <div className="w-28">
              <label className="label">{UI.MAX_PRICE}</label>
              <input {...register('maxPrice')} type="number" placeholder="Max" className="input-field" />
            </div>
            <div className="w-24">
              <label className="label">{UI.BEDROOMS}</label>
              <input {...register('bedrooms')} type="number" placeholder="—" className="input-field" />
            </div>
            <div className="w-24">
              <label className="label">{UI.BATHROOMS}</label>
              <input {...register('bathrooms')} type="number" placeholder="—" className="input-field" />
            </div>
            <div className="min-w-[120px]">
              <label className="label">{UI.ANY_TYPE}</label>
              <select {...register('propertyType')} className="input-field">
                <option value="">All</option>
                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-primary">Apply Filters</button>
          </div>
        </form>
      </div>
    </div>
  );
}
