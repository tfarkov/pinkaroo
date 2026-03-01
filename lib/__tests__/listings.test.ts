/**
 * Tests for listing sort options and sortListings (including eco-desc).
 */
import { sortListings, LISTING_SORT_OPTIONS, type ListingSortValue } from '../listings';

const baseListing = {
  id: '1',
  title: 'Listing',
  price: 500000,
  location: 'Barrie, ON',
  bedroomsTotal: 3,
  bathroomsTotal: 2,
  sizeSqm: 150,
};

describe('LISTING_SORT_OPTIONS', () => {
  it('includes eco-desc option', () => {
    const ecoOption = LISTING_SORT_OPTIONS.find((o) => o.value === 'eco-desc');
    expect(ecoOption).toBeDefined();
    expect(ecoOption?.label).toMatch(/eco|rating/i);
  });
});

describe('sortListings', () => {
  it('returns copy unchanged for default sort', () => {
    const list = [{ ...baseListing, id: 'a' }];
    const out = sortListings(list, 'default');
    expect(out).toEqual(list);
    expect(out).not.toBe(list);
  });

  it('sorts by price ascending', () => {
    const list = [
      { ...baseListing, id: '1', price: 600000 },
      { ...baseListing, id: '2', price: 400000 },
    ];
    const out = sortListings(list, 'price-asc');
    expect(out[0].price).toBe(400000);
    expect(out[1].price).toBe(600000);
  });

  it('sorts by price descending', () => {
    const list = [
      { ...baseListing, id: '1', price: 400000 },
      { ...baseListing, id: '2', price: 600000 },
    ];
    const out = sortListings(list, 'price-desc');
    expect(out[0].price).toBe(600000);
    expect(out[1].price).toBe(400000);
  });

  it('sorts by eco rating descending (high first, nulls last)', () => {
    const list = [
      { ...baseListing, id: '1', ecoRatingScore: 5 },
      { ...baseListing, id: '2', ecoRatingScore: 8 },
      { ...baseListing, id: '3', ecoRatingScore: null },
      { ...baseListing, id: '4', ecoRatingScore: 7 },
    ];
    const out = sortListings(list, 'eco-desc' as ListingSortValue);
    expect(out[0].ecoRatingScore).toBe(8);
    expect(out[1].ecoRatingScore).toBe(7);
    expect(out[2].ecoRatingScore).toBe(5);
    expect(out[3].ecoRatingScore).toBeNull();
  });

  it('eco-desc treats missing ecoRatingScore as -1 (sorts last)', () => {
    const list = [
      { ...baseListing, id: '1', ecoRatingScore: 7 },
      { ...baseListing, id: '2' },
    ];
    const out = sortListings(list, 'eco-desc' as ListingSortValue);
    expect(out[0].id).toBe('1');
    expect(out[1].id).toBe('2');
  });

  it('sorts by beds and baths descending', () => {
    const list = [
      { ...baseListing, id: '1', bedroomsTotal: 2 },
      { ...baseListing, id: '2', bedroomsTotal: 4 },
    ];
    const outBeds = sortListings(list, 'beds-desc');
    expect(outBeds[0].bedroomsTotal).toBe(4);
    const list2 = [
      { ...baseListing, id: '1', bathroomsTotal: 1 },
      { ...baseListing, id: '2', bathroomsTotal: 3 },
    ];
    const outBaths = sortListings(list2, 'baths-desc');
    expect(outBaths[0].bathroomsTotal).toBe(3);
  });

  it('sorts by size descending', () => {
    const list = [
      { ...baseListing, id: '1', sizeSqm: 80 },
      { ...baseListing, id: '2', sizeSqm: 200 },
    ];
    const out = sortListings(list, 'size-desc');
    expect(out[0].sizeSqm).toBe(200);
  });
});
