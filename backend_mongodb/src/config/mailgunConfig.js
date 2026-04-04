module.exports = {
    mailgun: {
        apiKey: process.env.MAILGUN_API_KEY,
        domain: process.env.MAILGUN_DOMAIN,
        username: process.env.MAILGUN_USERNAME,
        email: process.env.MAILGUN_EMAIL,
        fromName: process.env.MAILGUN_FROM_NAME,
    },
  }; 