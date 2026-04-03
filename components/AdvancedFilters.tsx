import React, { useEffect, useMemo, useState } from 'react';
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
  const { register, watch, setValue } = useForm<FilterData>({
    defaultValues: { province: DEFAULT_PROVINCE, city: '', minPrice: '', maxPrice: '', bedrooms: '', bathrooms: '', propertyType: '' },
  });
  const router = useRouter();
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  const debouncedFilter = useMemo(
    () =>
      debounce((data: FilterData) => {
        // Keep onFilter referentially stable from parent for consistent debounce behavior.
        onFilter(data);
        const query: ParsedUrlQueryInput = Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, v === undefined || v === '' ? undefined : String(v)])
        );
        router.push({ query }, undefined, { shallow: true }); // Shareable URL params
      }, 300),
    [onFilter, router]
  );

  useEffect(() => {
    const subscription = watch((data) => debouncedFilter(data as FilterData));
    return () => {
      subscription.unsubscribe();
      debouncedFilter.cancel();
    };
  }, [watch, debouncedFilter]);

  useEffect(() => {
    // Load from URL params without re-subscribing watch on each route query update.
    Object.entries(router.query).forEach(([key, value]) => setValue(key as keyof FilterData, value as any));
  }, [router.query, setValue]);

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setIsAccordionOpen(!isAccordionOpen)}
        className="md:hidden btn-primary w-full mb-4"
        aria-expanded={isAccordionOpen}
        aria-controls="advanced-filters-panel"
      >
        {UI.FILTERS}
      </button>
      <div id="advanced-filters-panel" className={`${isAccordionOpen ? 'block' : 'hidden'} md:block`}>
        <form onSubmit={(event) => event.preventDefault()} className="bg-white rounded-lg shadow-card border border-slate-200 p-4">
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
              <label htmlFor="filters-min-price" className="label">{UI.MIN_PRICE}</label>
              <select id="filters-min-price" {...register('minPrice')} className="input-field text-sm leading-tight">
                {FILTER_PRICE_OPTIONS.map(({ value, label }) => (
                  <option key={value || 'any'} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <label htmlFor="filters-max-price" className="label">{UI.MAX_PRICE}</label>
              <select id="filters-max-price" {...register('maxPrice')} className="input-field text-sm leading-tight">
                {FILTER_PRICE_OPTIONS.map(({ value, label }) => (
                  <option key={value || 'any'} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <label htmlFor="filters-bedrooms" className="label">{UI.BEDROOMS}</label>
              <select id="filters-bedrooms" {...register('bedrooms')} className="input-field text-sm leading-tight">
                {FILTER_BEDROOM_OPTIONS.map(({ value, label }) => (
                  <option key={value || 'any'} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <label htmlFor="filters-bathrooms" className="label">{UI.BATHROOMS}</label>
              <select id="filters-bathrooms" {...register('bathrooms')} className="input-field text-sm leading-tight">
                {FILTER_BATHROOM_OPTIONS.map(({ value, label }) => (
                  <option key={value || 'any'} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <label htmlFor="filters-property-type" className="label">{UI.ANY_TYPE}</label>
              <select id="filters-property-type" {...register('propertyType')} className="input-field text-sm leading-tight">
                <option value="">All</option>
                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
