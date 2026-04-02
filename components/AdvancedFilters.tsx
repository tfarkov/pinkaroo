import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import type { ParsedUrlQueryInput } from 'querystring';
import { debounce } from 'lodash';
import { DEFAULT_PROVINCE, PROVINCES, PROPERTY_TYPES, FILTER_PRICE_OPTIONS, FILTER_BEDROOM_OPTIONS, FILTER_BATHROOM_OPTIONS, UI } from '../lib/constants';

interface FilterData {
  province: string;
  city: string;
  minPrice: string | number;
  maxPrice: string | number;
  bedrooms: string | number;
  bathrooms: string | number;
  propertyType: string;
}

export default function AdvancedFilters({ onFilter }: { onFilter: (filters: FilterData) => void }) {
  const { register, handleSubmit, watch, setValue } = useForm<FilterData>({
    defaultValues: { province: DEFAULT_PROVINCE, city: '', minPrice: '', maxPrice: '', bedrooms: '', bathrooms: '', propertyType: '' },
  });
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 items-end">
            <div className="w-full">
              <label htmlFor="filters-province" className="label">{UI.ANY_PROVINCE}</label>
              <select id="filters-province" {...register('province')} className="input-field text-sm leading-tight">
                <option value="">All</option>
                {PROVINCES.map(p => (
                  <option key={p} value={p}>{p.replace(/_/g, ' ').replace(/\b\w/g, s => s.toUpperCase())}</option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <label htmlFor="filters-city" className="label">{UI.CITY}</label>
              <input id="filters-city" {...register('city')} type="text" placeholder="e.g. Barrie" className="input-field" />
            </div>
            <div className="w-full">
              <label className="label">{UI.MIN_PRICE}</label>
              <select {...register('minPrice')} className="input-field text-sm leading-tight">
                {FILTER_PRICE_OPTIONS.map(({ value, label }) => (
                  <option key={value || 'any'} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <label className="label">{UI.MAX_PRICE}</label>
              <select {...register('maxPrice')} className="input-field text-sm leading-tight">
                {FILTER_PRICE_OPTIONS.map(({ value, label }) => (
                  <option key={value || 'any'} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <label className="label">{UI.BEDROOMS}</label>
              <select {...register('bedrooms')} className="input-field text-sm leading-tight">
                {FILTER_BEDROOM_OPTIONS.map(({ value, label }) => (
                  <option key={value || 'any'} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <label className="label">{UI.BATHROOMS}</label>
              <select {...register('bathrooms')} className="input-field text-sm leading-tight">
                {FILTER_BATHROOM_OPTIONS.map(({ value, label }) => (
                  <option key={value || 'any'} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <label className="label">{UI.ANY_TYPE}</label>
              <select {...register('propertyType')} className="input-field text-sm leading-tight">
                <option value="">All</option>
                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-primary w-full">Apply Filters</button>
          </div>
        </form>
      </div>
    </div>
  );
}
