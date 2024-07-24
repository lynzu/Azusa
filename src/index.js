import fs from 'fs';
import path from 'path';
import 'dotenv/config'

import { WaConnection, handleDisconnect } from './lib/whatsapp.js';
import Plugin from './lib/plugin.js';
import handler from './handler.js';

const attr = {
  uptime: new Date(),
  command: new Map()
};

const main = async () => {
  await Plugin(attr);

  let azusa = await WaConnection(process.env.NUMBER);

  azusa.ev.on('connection.update', async update => {
    const { lastDisconnect, connection } = update;

    // Log connection status
    if (connection) {
      console.log(
        connection === 'connecting'
          ? 'Connecting to the WhatsApp bot...'
          : `Connection: ${connection}`
      );
    }

    // Handle different connection states
    switch (connection) {
      case 'open':
        console.log('Successfully connected as', azusa.user.name);
        break;
      case 'close':
        await handleDisconnect(main, azusa, lastDisconnect.error);
        break;
    }
  });

  azusa.ev.on('messages.upsert', async message => {
    handler(azusa, message, attr);
  });
};

main();
