graph TD
    Doctor((Doctor))
    Patient((Patient))
    Socket[Socket.IO Server]
    STUN[STUN Server]

    Doctor -->|Join Room| Socket
    Patient -->|Join Room| Socket
    Socket -->|Offer / Answer| Doctor
    Socket -->|Offer / Answer| Patient
    Doctor <-->|WebRTC Media| Patient
    Doctor -. ICE .-> STUN
    Patient -. ICE .-> STUN
