module.exports = {
  mailgun: {
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN || 'invito.zantatech.com',
    url: process.env.MAILGUN_URL || 'https://api.mailgun.net',
    username: process.env.MAILGUN_USERNAME || 'api',
    from: `${process.env.MAILGUN_FROM_NAME || 'Invito team'} <${process.env.MAILGUN_EMAIL || 'info@nexplat.sa'}>`,
  },
};