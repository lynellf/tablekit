const worker = {
  async fetch(request, env) {
    const assetUrl = new URL(request.url);
    if (request.method === 'GET' && assetUrl.pathname === '/') {
      assetUrl.pathname = '/index.html';
    }

    return env.ASSETS.fetch(new Request(assetUrl, request));
  },
};

export default worker;
