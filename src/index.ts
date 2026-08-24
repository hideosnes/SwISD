// src/index.ts
import { createLibp2p, type Libp2p } from "libp2p";
import { gossipsub } from '@libp2p/gossipsub'
import {
    createNodeConfig,
    RoleAssignmentManager,
    setupEventHandlers,
    setupProtocolHandler,
    startHealthCheck
} from './protocols/index.ts'
import { TaskRouter } from './models/taskRouter.ts'
import { AdminEndpoint } from './admin/adminEndpoints.ts'
import { PROTOCOLS } from './protocols/protocols.ts'

async function main() {
    try {
        // Create gossipsub instance separately to avoid type conflicts
        const pubsubService = gossipsub({
            allowPublishToZeroTopicPeers: true,
            emitSelf: true,
            globalSignaturePolicy: 'StrictSign'
        })

        const node: Libp2p = await createLibp2p({
            ...createNodeConfig(),
            services: {
                // Type assertion to bypass nested @libp2p/interface version mismatch
                pubsub: pubsubService as any
            }
        });
        console.log('Node started with ID:', node.peerId.toString());

        const roleManager = new RoleAssignmentManager(node);
        console.log('Self-assigned role:', roleManager.getConfigRole());
        await roleManager.startRoleAssignment();

        setupEventHandlers(node, roleManager);
        setupProtocolHandler(node);
        startHealthCheck(node, PROTOCOLS.SWARM);

        const taskRouter = new TaskRouter(node, roleManager);
        await taskRouter.initialize();

        const admin = new AdminEndpoint(roleManager, 8080, process.env.SWARM_ADMIN_TOKEN);
        admin.setTaskRouter(taskRouter);
        admin.start();

        console.log('Node: OK. Waiting for peers...');
        console.log('Press Ctrl+C to stop.');
    } catch (err: any) {
        console.error('Error during node startup:', err);
        process.exit(1);
    }
}

main();