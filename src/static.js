import {
    getAssetFromKV,
    mapRequestToAsset,
} from "@cloudflare/kv-asset-handler";

/**
 * Here's one example of how to modify a request to
 * remove a specific prefix, in this case `/docs` from
 * the url. This can be useful if you are deploying to a
 * route on a zone, or if you only want your static content
 * to exist at a specific path.
 */
function handlePrefix(prefix) {
    return (request) => {
        // compute the default (e.g. / -> index.html)
        let defaultAssetKey = mapRequestToAsset(request);
        let url = new URL(defaultAssetKey.url);

        // strip the prefix from the path for lookup
        url.pathname = url.pathname.replace(prefix, "/");

        // inherit all other props from the default request
        return new Request(url.toString(), defaultAssetKey);
    };
}


async function handleEvent(event) {
    let options = {};

    /**
     * You can add custom logic to how we fetch your assets
     * by configuring the function `mapRequestToAsset`
     */
    // options.mapRequestToAsset = handlePrefix(/^\/docs/)

    try {
        if (DEBUG) {
            // customize caching
            options.cacheControl = {
                bypassCache: true,
            };
        }

        const page = await getAssetFromKV(event, options);

        // allow headers to be altered
        const response = new Response(page.body, page);

        response.headers.set("X-XSS-Protection", "1; mode=block");
        response.headers.set("X-Content-Type-Options", "nosniff");
        response.headers.set("X-Frame-Options", "DENY");
        response.headers.set("Referrer-Policy", "unsafe-url");
        response.headers.set("Feature-Policy", "none");

        return response;
    } catch (e) {
        // if an error is thrown try to serve the asset at 404.html
        if (!DEBUG) {
            try {
                let notFoundResponse = await getAssetFromKV(event, {
                    mapRequestToAsset: (req) =>
                        new Request(`${new URL(req.url).origin}/404.html`, req),
                });

                return new Response(notFoundResponse.body, {
                    ...notFoundResponse,
                    status: 404,
                });
            } catch (e) { }
        }

        return new Response(e.message || e.toString(), { status: 500 });
    }
}

export {
    handleEvent
}


