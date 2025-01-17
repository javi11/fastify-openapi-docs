/* eslint-disable @typescript-eslint/no-floating-promises */
import fastifyStatic from 'fastify-static';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { getAbsoluteFSPath } from 'swagger-ui-dist';
export function addUI(instance, prefix) {
    // Get the main index file and patch it
    const swaggerUIRoot = getAbsoluteFSPath();
    const swaggerUIRootIndex = readFileSync(resolve(swaggerUIRoot, 'index.html'), 'utf8').replace(/url: "(.*)"/, `url: "${prefix}/openapi.json"`);
    // Add the Swagger UI
    instance.route({
        method: 'GET',
        url: prefix,
        handler(_, reply) {
            reply.redirect(301, `${prefix}/`);
        }
    });
    instance.register(fastifyStatic, {
        root: swaggerUIRoot,
        prefix,
        schemaHide: true
    });
    // This hook is required because we have to serve the patched index file in order to point to the local documentation
    // eslint-disable-next-line no-useless-escape
    const indexUrl = new RegExp(`^(?:${prefix.replace(/\//g, '\\/')}\/(?:index\.html)?)$`);
    instance.addHook('preHandler', (request, reply, done) => {
        if (request.raw.url.match(indexUrl)) {
            reply.header('Content-Type', 'text/html; charset=UTF-8');
            reply.send(swaggerUIRootIndex);
        }
        done();
    });
}
