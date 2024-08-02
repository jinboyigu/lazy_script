module.exports = {
  apps: [
    {
      name: 'local1',
      script: 'src/local1.js',
      watch: true,
      ignore_watch: ['logs'],
      watch_delay: 5 * 60 * 1000,
      'watch_options': {
        followSymlinks: false,
      },
    },
  ],
};
