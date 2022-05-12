import { Router } from 'itty-router';
import { handleEvent as handleStaticEvent } from "./static";
import { proxyApiRequest, getCustom } from "./api";

const router = Router();

router.get("/rest/get_custom", (request) => getCustom(request));
router.all("/rest/*", (request) => proxyApiRequest(request));
router.all("*", (_, event) => handleStaticEvent(event));

addEventListener("fetch", (event) => {
  event.respondWith(router.handle(event.request, event));
});