// src/admin/adminEndpoints.ts
import http from 'http'
import { RoleAssignmentManager } from '../protocols/discovery/roleAssignment.ts'
import { TaskRouter } from '../models/TaskRouter.ts'

export class AdminEndpoint {
    private server?: http.Server
    private readonly port: number
    private readonly authToken?: string
    private roleManager: RoleAssignmentManager
    private taskRouter?: TaskRouter

    constructor(roleManager: RoleAssignmentManager, port = 8080, authToken?: string) {
        this.roleManager = roleManager
        this.port = port
        this.authToken = authToken
    }

    public setTaskRouter(router: TaskRouter): void {
        this.taskRouter = router
    }

    public start(): void {
        this.server = http.createServer((req, res) => {
            if (req.url?.startsWith('/admin')) {
                this.handleAdminRequest(req, res)
            } else {
                res.writeHead(404)
                res.end('Not found')
            }
        })

        this.server.listen(this.port, '127.0.0.1', () => {
            console.log(`Admin endpoint listening on http://127.0.0.1:${this.port}/admin`)
        })
    }

    public stop(): void {
        if (this.server) {
            this.server.close()
        }
    }

    private async handleAdminRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        const token = req.headers['x-admin-token']
        if (this.authToken && token !== this.authToken) {
            res.writeHead(401, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Unauthorized' }))
            return
        }

        try {
            const url = new URL(req.url || '/', `http://localhost:${this.port}`)
            const path = url.pathname

            if (path === '/admin/peers') {
                const peers = this.roleManager.getConnectedPeers()
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ peers: Object.fromEntries(peers) }))
            } else if (path === '/admin/capabilities') {
                const caps = this.roleManager.getPeersWithCapability('hasCamera')
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ peersWithCamera: caps }))
            } else if (path === '/admin/reputation' && this.taskRouter) {
                const history = this.taskRouter.getTaskHistory()
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ taskHistory: history }))
            } else if (path === '/admin/health') {
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }))
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: 'Unknown endpoint' }))
            }
        } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: err.message }))
        }
    }
}