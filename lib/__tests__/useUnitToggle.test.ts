import { renderHook, act } from '@testing-library/react-hooks';
import { UnitProvider, useUnitToggle } from '../hooks/useUnitToggle';

test('toggles unit', () => {
  const wrapper = ({ children }) => <UnitProvider>{children}</UnitProvider>;
  const { result } = renderHook(() => useUnitToggle(), { wrapper });
  expect(result.current.isMetric).toBe(false);
  act(() => result.current.toggleUnit());
  expect(result.current.isMetric).toBe(true);
});
