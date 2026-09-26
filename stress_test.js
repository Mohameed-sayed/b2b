import ws from 'k6/ws';
import { check } from 'k6';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Configuration
export const options = {
    vus: 150, // 150 concurrent users
    duration: '2m', // Run for 2 minutes to sustain the load
};

// Replace with your LIVE app's websocket URL or local for testing
// Example for local: ws://localhost:3001
const BASE_URL = __ENV.TARGET_URL || 'ws://localhost:3001';

// Replace with the Room Code of the active game you are testing
const ROOM_CODE = __ENV.ROOM_CODE || 'TEST';

export default function () {
    // Socket.io v4 path
    const url = `${BASE_URL}/socket.io/?EIO=4&transport=websocket`;

    const res = ws.connect(url, {}, function (socket) {
        let isJoined = false;
        let participantId = null;

        // 1. Connection Opened
        socket.on('open', function () {
            // Engine.io upgrade frame (not always needed, but 40 connects Socket.io)
            socket.send('40');
        });

        // 2. Handle Incoming Messages
        socket.on('message', function (msg) {
            // Engine.io Ping (starts with '2') -> Send Pong ('3')
            if (msg === '2') {
                socket.send('3');
                return;
            }

            // Socket.io Connected handshake (starts with '40')
            if (msg.startsWith('40')) {
                // Join the room after successful connection
                const joinData = {
                    code: ROOM_CODE,
                    name: `StressTester_${randomString(5)}`
                };
                
                // Socket.io emit frame (42 + JSON array of event and data)
                socket.send(`42["room:join",${JSON.stringify(joinData)}]`);
            }

            // Socket.io Event (starts with '42')
            if (msg.startsWith('42')) {
                const eventPayload = JSON.parse(msg.substring(2));
                const eventName = eventPayload[0];
                const eventData = eventPayload[1];

                // When user successfully joins
                if (eventName === 'room:joined') {
                    isJoined = true;
                    participantId = eventData.participant.id;
                    // console.log(`User ${participantId} joined room ${ROOM_CODE}`);
                }

                // Simulate answering when a question starts
                if (eventName === 'question:started') {
                    // Random delay between 1s and 5s to simulate reading the question
                    socket.setTimeout(function () {
                        if (isJoined) {
                            const options = eventData.question.options || [{ id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }];
                            const randomOption = options[randomIntBetween(0, options.length - 1)].id;
                            
                            const answerData = {
                                roomCode: ROOM_CODE,
                                answer: randomOption,
                                participantId: participantId
                            };
                            
                            socket.send(`42["game:submit-answer",${JSON.stringify(answerData)}]`);
                        }
                    }, randomIntBetween(1000, 5000));
                }
            }
        });

        // 3. Error Handling
        socket.on('error', function (e) {
            if (e.error() != 'websocket: close sent') {
                console.log('An unexpected error occurred: ', e.error());
            }
        });

        // Keep connection open for the duration of the VU iteration
        socket.setTimeout(function () {
            socket.close();
        }, 120000); // Close after 2 mins
    });

    check(res, { 'Connected successfully': (r) => r && r.status === 101 });
}
