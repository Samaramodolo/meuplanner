const { google } = require('googleapis');

const calendar = google.calendar('v3');

const auth = new google.auth.GoogleAuth({
  credentials: {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
  },
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { action, task } = req.body;

    const authClient = await auth.getClient();

    switch (action) {
      case 'add':
      case 'update': {
        const isUpdate = !!task.googleEventId;
        const eventData = {
          summary: task.titulo || 'Sem título',
          description: task.descricao || '',
          start: {
            dateTime: new Date(task.dataVencimento).toISOString(),
          },
          end: {
            dateTime: new Date(new Date(task.dataVencimento).getTime() + 60 * 60 * 1000).toISOString(),
          },
          extendedProperties: {
            private: {
              supabaseId: task.id,
            },
          },
        };

        if (isUpdate) {
          await calendar.events.update({
            auth: authClient,
            calendarId: 'primary',
            eventId: task.googleEventId,
            requestBody: eventData,
          });
          return res.status(200).json({ success: true, eventId: task.googleEventId });
        } else {
          const event = await calendar.events.insert({
            auth: authClient,
            calendarId: 'primary',
            requestBody: eventData,
          });
          return res.status(200).json({ success: true, eventId: event.data.id });
        }
      }

      case 'delete': {
        await calendar.events.delete({
          auth: authClient,
          calendarId: 'primary',
          eventId: task.googleEventId,
        });
        return res.status(200).json({ success: true });
      }

      case 'list': {
        const events = await calendar.events.list({
          auth: authClient,
          calendarId: 'primary',
        });
        return res.status(200).json({ success: true, events: events.data.items || [] });
      }

      default:
        return res.status(400).json({ success: false, error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Calendar API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
