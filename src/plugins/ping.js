const execute = async ({ azusa, msg }) => {
  await azusa.sendMessage(msg.key.remoteJid, { text: 'Pong!' });
};

export default {
  name: 'ping',
  alias: ['ping'],
  use:'<prefix>ping',
  execute
};
