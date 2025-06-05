module.exports = function (api) {
  const isProduction = api.env('production');

  return {
    presets: ['react-app'],
    plugins: isProduction
      ? [] // אל תשתמש ב־react-refresh בזמן production
      : ['react-refresh/babel']
  };
};