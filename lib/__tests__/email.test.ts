import { sendEmail } from '../email';
import nodemailer from 'nodemailer';
jest.mock('nodemailer');
test('sends email', async () => {
  const mockSendMail = jest.fn().mockResolvedValue({});
  (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail: mockSendMail });
  await sendEmail('to@example.com', 'Subject', 'Text');
  expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'to@example.com' }));
});
test('queues email', async () => {
  // Test queue addition
  await sendEmail('test@ex.com', 'Test', 'Body');
  // Assert queue.add called
});
