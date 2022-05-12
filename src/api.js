const db = DB;

/**
 * This function proxies frontend requests to the underlying subzero server.
 * This way we can expose a easely expose a PostgREST style API to the frontend with little code while also be in a position to
 * intercept and alter both the Request and Response objects.
 */
async function proxyApiRequest(request) {
    let url = new URL(request.url);
    url.protocol = 'http:';
    url.host = db;

    let r = new Request(url.href, request);
    let response = await fetch(r);
    return response;
}

/**
 * This function makes two separate requests to the underlying database (through subzero)
 * and returns a custom response.
 * While this demonstrates the use of the api by using Request/fetch, it's also possible to use
 * client libraries (url builders) like postgrest-js.
 */
async function getCustom(_) {
    let r1 = new Request(`http://${db}/rest/projects?select=projects_total:$count(id)`);
    let r2 = new Request(`http://${db}/rest/tasks?select=tasks_total:$count(id)`);
    

    let responses = await Promise.all([fetch(r1), fetch(r2)]).then(responses => {
        return responses.map(res => res.json());
    });
    let [p, t] = await Promise.all(responses);
    const json = JSON.stringify({projects_total: p[0].projects_total, tasks_total: t[0].tasks_total}, null, 2);

    return new Response(json, {
        headers: {
          'content-type': 'application/json;charset=UTF-8',
        },
        status: 200,}
    );
}


export {
    proxyApiRequest,
    getCustom,
}