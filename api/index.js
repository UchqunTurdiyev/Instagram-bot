export default function handler(req, res) {
  res.status(200).json({
    status: '✅ Bot ishlayapti',
    message: 'Instagram Bot - Webhook is running',
    endpoints: {
      webhook: '/api/webhook',
    },
    timestamp: new Date().toISOString(),
  });
}
