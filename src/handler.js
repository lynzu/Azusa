import fs from 'fs';
import path from 'path';
import { extractMessageContent } from '@whiskeysockets/baileys';

const handler = async (azusa, m, attr) => {
  if (m.type !== 'notify') return;

  let msg = m.messages[0];

  if (msg.key && msg.key.remoteJid === 'status@broadcast') return;

  if (msg.key) {
    msg.id = msg.key.id;
    msg.isBaileys = msg.id.startsWith('BAE5');
    msg.from = msg.key.remoteJid;
    msg.isGroup = msg.from.endsWith('@g.us');
    // msg.sender = msg.key.fromMe
    //   ? azusa.decodeJid(azusa.user.id)
    //   : msg.key.participant || msg.from;

    // if (msg.isGroup) {
    //   let admins = await azusa.getAdmins(msg.from);
    //   msg.isAdmin = admins.includes(msg.sender);
    //   console.log(admins);
    //   msg.isBotAdmin = admins.includes(azusa.decodeJid(msg.user.id));
    // }
  }

  msg.type = Object.keys(msg.message)[0];
  msg.msg = extractMessageContent(msg.message[msg.type]);
  msg.body =
    msg.message?.conversation ||
    msg.message[msg.type]?.caption ||
    msg.message[msg.type]?.text ||
    msg.message['viewOnceMessageV2']?.message['imageMessage']?.caption ||
    msg.message['viewOnceMessageV2']?.message['videoMessage']?.caption ||
    '';
  msg.mentions = msg.msg?.contextInfo?.mentionedJid || [];

  const prefix = /^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#%^&.©^]/gi.test(msg.body)
    ? msg.body.match(/^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#%^&.©^]/gi)[0]
    : '#';

  if (prefix != process.env.USER_PREFIX) return;

  const args = msg.body.trim().split(/ +/).slice(1);

  const cmdName = msg.body
    .replace(prefix, '')
    .trim()
    .split(/ +/)
    .shift()
    .toLowerCase();

  const cmd = commandObject(attr.command, cmdName);

  if (cmd) {
    try {
      await cmd.execute({ azusa, msg, cmdName, args });
    } catch (error) {
      await azusa.sendMessage(msg.key.remoteJid, { text: error.message });
    }
  }
};

const commandObject = (data, cmdName) => {
  for (const [key, value] of data.entries()) {
    if (key.name === cmdName || (key.alias && key.alias.includes(cmdName))) {
      return key;
    }
  }
  return false;
};

export default handler;
