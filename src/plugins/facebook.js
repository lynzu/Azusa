import hisako from 'hisako';

const execute = async ({ azusa, msg, args }) => {
  try {
    const data = await hisako.sosmed.facebook(args[0]);
    const url = data.link?.hd ? data.link.hd : data.link.sd;
    if (!url) throw new Error('No video available');
    await azusa.sendMessage(msg.key.remoteJid, { video: { url } });
  } catch (error) {
    throw error;
  }
};

export default {
  name: 'Fcacebook Video Downloader',
  alias: ['fbdl', 'fbvideo'],
  use: '<url>',
  execute
};
