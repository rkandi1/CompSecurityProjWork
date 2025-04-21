console.log("Content script loaded.");
(function() {
    console.log("Content script running.");
    // Override fetch
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        console.log('Fetch called with arguments:', args);
        if (args[1] && args[1].method.toUpperCase() === 'POST') {
            console.log('Intercepted POST fetch request to:', args[0]);
            if (args[1].headers && args[1].headers['Content-Type'] === 'application/json' && typeof args[1].body === 'string') {
                try {
                    let body = JSON.parse(args[1].body);
                    // Example modification: add a field
                    body.modifiedByExtension = true;
                    args[1].body = JSON.stringify(body);
                    console.log('Modified fetch body:', body);
                } catch (e) {
                    console.error('Failed to parse JSON body:', e);
                }
            }
        }
        return originalFetch.apply(this, args);
    };

    // Override XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        this._method = method.toUpperCase();
        this._url = url;
        originalOpen.apply(this, arguments);
    };

    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(body) {
        console.log('XHR called with method:', this._method, 'and URL:', this._url);
        if (this._method === 'POST') {
            console.log('Intercepted POST XHR request to:', this._url);
            if (this.getRequestHeader('Content-Type') === 'application/json' && typeof body === 'string') {
                try {
                    let jsonBody = JSON.parse(body);
                    // Example modification: add a field
                    jsonBody.modifiedByExtension = true;
                    body = JSON.stringify(jsonBody);
                    console.log('Modified XHR body:', jsonBody);
                } catch (e) {
                    console.error('Failed to parse JSON body:', e);
                }
            }
        }
        originalSend.call(this, body);
    }
})();
