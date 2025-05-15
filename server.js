const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');
const path = require('path');

const PORT = 4000;
const FRAMES_DIR = './videos/ipcam';

// Create HTTP server
const server = http.createServer(function (request, response) {
    console.log('request starting...', new Date());

    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
        'Access-Control-Max-Age': 2592000, // 30 days
        /** add other headers as per requirement */
    };

    // Add content type based on file extension
    if (request.url.endsWith('.m3u8')) {
        headers['Content-Type'] = 'application/vnd.apple.mpegurl';
    } else if (request.url.endsWith('.ts')) {
        headers['Content-Type'] = 'video/MP2T';
    }

    if (request.method === 'OPTIONS') {
        response.writeHead(204, headers);
        response.end();
        return;
    }

    var filePath = FRAMES_DIR + request.url;
    console.log(filePath);
    fs.readFile(filePath, function (error, content) {
        if (error) {
            if (error.code == 'ENOENT') {
                response.writeHead(404, headers);
                response.end('File not found');
            }
            else {
                response.writeHead(500, headers);
                response.end('Error reading file: ' + error.code);
            }
        }
        else {
            response.writeHead(200, headers);
            response.end(content);
        }
    });
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Set();

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('New client connected');
    clients.add(ws);

    // Send the current frame path immediately upon connection
    const files = fs.readdirSync(FRAMES_DIR);
    const indexFiles = files.filter(file => file.startsWith('index') && file !== 'index');
    if (indexFiles.length > 0) {
        ws.send(JSON.stringify({ frame: '/videos/ipcam/' + indexFiles[indexFiles.length - 1] }));
    }

    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
    });
});

// Watch for file changes in the frames directory
fs.watch(FRAMES_DIR, (eventType, filename) => {
    if (eventType === 'rename' && filename && filename.startsWith('index')) {
        console.log('New frame detected:', filename);
        
        // Broadcast the new frame to all connected clients
        const message = JSON.stringify({ frame: '/videos/ipcam/' + filename });
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server listening on PORT ${PORT}`);
    console.log(`WebSocket server is running on ws://localhost:${PORT}`);
    console.log(`Access your stream at http://localhost:${PORT}/index.m3u8`);
}); 