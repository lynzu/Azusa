import { readdirSync, watchFile, unlink } from 'fs';
import { join, resolve } from 'path';
import { delay } from '@whiskeysockets/baileys';

const Plugins = async attr => {
  try {
    const pluginPath = join(process.cwd(), 'src/plugins');

    const files = readdirSync(pluginPath).filter(file => file.endsWith('.js'));

    for (const file of files) {
      const plugin = await import(join(pluginPath, file));

      if (typeof plugin.default.execute !== 'function') continue;

      const defaultPluginOptions = {
        name: 'plugin',
        alias: [''],
        desc: '',
        use: '',
        example: '',
        url: '',
        isOwner: false,
        isAdmin: false,
        isQuoted: false,
        isGroup: false,
        isBotAdmin: false,
        isQuery: false,
        isPrivate: false,
        isUrl: false,
        execute: () => {}
      };

      const mergedOptions = { ...defaultPluginOptions, ...plugin.default };

      attr.command.set(mergedOptions);
      delay(1000);
      // await reloadFile(`${pluginPath}/${file}`);
    }

    console.log('Succesfully loading plugins');
  } catch (error) {
    console.error(error);
  }
};

const reloadFile = (file = '', options = {}) => {
  nocache(file, () => {
    console.log(`File "${file}" has been updated!\nRestarting!`);
    process.send('reset');
  });
};

const nocache = (modulePath, cb = () => {}) => {
  watchFile(modulePath, async () => {
    await uncache(modulePath);
    cb(modulePath);
  });
};

const uncache = async (modulePath = '.') => {
  try {
    delete require.cache[modulePath]; // Attempt to remove from cache (only if necessary)
    await unlink(require.resolve(modulePath));
    console.log(`Module "${modulePath}" removed from cache.`);
  } catch (error) {
    console.error(`Error uncaching module "${modulePath}":`, error);
  }
};

export default Plugins;
