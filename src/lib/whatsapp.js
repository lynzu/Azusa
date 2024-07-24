import {
  makeWASocket,
  makeInMemoryStore,
  fetchLatestWaWebVersion,
  useMultiFileAuthState,
  Browsers,
  DisconnectReason,
  jidDecode
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import path from 'path';

const WaConnection = async number => {
  const { version } = await fetchLatestWaWebVersion();
  const { state, saveCreds } = await useMultiFileAuthState(
    path.join(process.cwd(), 'session')
  );

  const store = makeInMemoryStore({
    logger: pino().child({
      level: 'silent',
      stream: 'store'
    })
  });

  let azusa = makeWASocket({
    version,
    printQRInTerminal: false,
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: Browsers.macOS('Safari'),
    generateHighQualityLinkPreview: true,
    defaultQueryTimeoutMs: undefined
  });

  if (!azusa.authState.creds.registered) {
    setTimeout(async () => {
      let code = await azusa.requestPairingCode(number);
      code = code?.match(/.{1,4}/g)?.join('-') || code;
      console.log('Your Pairing Code:', code);
    }, 3000);
  }

  store.bind(azusa.ev);
  azusa.ev.on('creds.update', saveCreds);

  azusa.parseMentions = text => {
    if (typeof text === 'string') {
      const matches = text.match(/@([0-9]{5,16}|0)/g) || [];
      return matches.map(match => match.replace('@', '') + '@s.whatsapp.net');
    }
  };

  azusa.decodeJid = jid => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      const decode = jidDecode(jid) || {};
      return (
        (decode.user && decode.server && `${decode.user}@${decode.server}`) ||
        jid
      );
    } else return jid;
  };

  azusa.downloadMediaMessage = async m => {
    let quoted = m.msg ? m.msg : m;
    let stream = await downloadContentFromMessage(
      quoted,
      m.type.replace(/Message/, '')
    );
    let buffer = (await toBuffer(stream)) || Buffer.alloc(0);

    if (buffer) {
      return buffer;
    }
  };

  azusa.getAdmins = async jid => {
    if (!jid || !jid.endsWith('@g.us')) return;
    let group = await azusa.groupMetadata(jid).catch(_ => {});
    let admins = new Array();

    for (let user of group.participants) {
      if (user.admin == 'admin' || user.admin == 'superadmin')
        admins.push(azusa.decodeJid(user.id));
    }

    return admins;
  };

  return azusa;
};

const handleDisconnect = async (main, azusa, error) => {
  const reason = new Boom(error).output.statusCode;

  // Handle specific disconnect reasons
  switch (reason) {
    case DisconnectReason.badSession:
      console.log('Bad Session File, Please Delete session and Scan Again');
      azusa.logout();
      break;
    case DisconnectReason.connectionClosed:
      console.log('Connection closed, reconnecting...');
      await main();
      break;
    case DisconnectReason.connectionLost:
      console.log('Connection Lost from Server, reconnecting...');
      await main();
      break;
    case DisconnectReason.connectionReplaced:
      console.log(
        'Connection Replaced, Another New Session Opened, Please Close Current Session First'
      );
      azusa.logout();
      break;
    case DisconnectReason.loggedOut:
      console.log('Device Logged Out, Please Delete session and Scan Again.');
      azusa.logout();
      break;
    case DisconnectReason.remainRequired:
      console.log('Remain Required, Remaining...');
      await main();
      break;
    case DisconnectReason.timedOut:
      console.log('Connection TimedOut, Reconnecting...');
      await main();
      break;
    default:
      azusa.end(`Unknown DisconnectReason: ${reason}|${error}`);
  }
};

export { WaConnection, handleDisconnect };
