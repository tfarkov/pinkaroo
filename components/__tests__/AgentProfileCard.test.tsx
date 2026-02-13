import { render, screen } from '@testing-library/react';
import AgentProfileCard from '../AgentProfileCard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

test('renders agent card', () => {
  queryClient.setQueryData(['agent', '1'], { name: 'Test', role: 'REALTOR' });
  render(<QueryClientProvider client={queryClient}><AgentProfileCard agentId="1" /></QueryClientProvider>);
  expect(screen.getByText('Test')).toBeInTheDocument();
  expect(screen.getByText('Role: REALTOR')).toBeInTheDocument();
});
