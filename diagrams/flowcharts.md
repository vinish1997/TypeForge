flowchart TD
    subgraph EventBus Memory
        MAP["Map: Topic Registry"]
        SET1["Set: KEYSTROKE_PROCESSED Listeners<br/>• MetricsEngine.recordKeystroke<br/>• UIProgressBar.update"]
        SET2["Set: SESSION_COMPLETED Listeners<br/>• ResultsModal.show<br/>• SoundEngine.playVictory"]
        MAP -->|"KEYSTROKE_PROCESSED"| SET1
        MAP -->|"SESSION_COMPLETED"| SET2
    end

    KE["TypingEngine: Keystroke Hot Path"] -->|"emit('KEYSTROKE_PROCESSED', payload)"| MAP
    MAP -.->|"O(1) lookup"| SET1
    SET1 -->|"forEach(fn => fn(payload))"| C1["MetricsEngine"]
    SET1 -->|"forEach(fn => fn(payload))"| C2["UI Shell"]
