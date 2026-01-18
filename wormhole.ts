
import { createConnection, createServer, Socket } from 'net'

const PROXY_PORT = 3000
const PROXY_HOST = "localhost"
const BACKEND_HOST = "localhost"
const BACKEND_PORT = 3001

let serialId = 1

const proxy = createServer((client: Socket) => {
    const clientId = serialId++

    const backend = createConnection(BACKEND_PORT, BACKEND_HOST, () => {
        console.debug(`[${clientId}] connected to backend`)
    })

    backend.on('ready', () => {
        console.debug(`[${clientId}] stream client to backend`)
        // Get output from client and write to backend. Stream from client to backend.
        client.pipe(backend)
        /*
        client.on('data', (data: Buffer) => {
            console.debug(`[${clientId}] sent data:`)
            console.debug(data.toString())
            backend.write(data)
        })
        */
    })

    backend.on('end', () => {
        console.debug(`[${clientId}] backend disconnected`)
        client.end()
    })

    backend.on('error', (err: Error) => {
        console.error(`[${clientId}] backend socket error: `)
        console.error(err)
    })

    client.on('end', () => {
        console.debug(`[${clientId}] client disconnected`)
    })

    client.on('error', (err: Error) => {
        console.error(`[${clientId}] client socket error: `)
        console.error(err)
    })

    // Finally stream from backend to client.
    backend.pipe(client)
})

proxy.listen(PROXY_PORT, PROXY_HOST, () => {
    console.log(`Proxy:     http://localhost:${PROXY_PORT}`)
    console.log(`Backend:   http://${BACKEND_HOST}:${BACKEND_PORT}`)
})
