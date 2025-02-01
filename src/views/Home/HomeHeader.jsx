import React, { useState, useRef } from "react";
import * as Tone from "tone";
import "./HomeHeader.css"

function HomeHeader({ outputs, setOutputs, getNotes, setGetNotes, tempo, setTempo }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [notesLoaded, setNotesLoaded] = useState(false);
    const [instrumentsLoaded, setInstrumentsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    // Cache za instrumente, kako ne bismo stalno stvarali nove instance
    const [instrumentCache, setInstrumentCache] = useState({});
    const progressIntervalRef = useRef(null);

    // Refs za snimanje
    const mediaRecorderRef = useRef(null);
    const recordingDestRef = useRef(null);
    const recordedChunksRef = useRef([]);

    // Funkcija za dohvaćanje instrumenta s bufferom
    const getInstrument = async (instrumentName) => {
        if (instrumentCache[instrumentName]) {
            return instrumentCache[instrumentName];
        }

        return new Promise((resolve) => {
            if (window.Soundfont && window.Soundfont[instrumentName]) {
                const sampler = new Tone.Sampler({
                    urls: window.Soundfont[instrumentName],
                    release: 1,
                    onload: () => {
                        setInstrumentCache((prev) => ({ ...prev, [instrumentName]: sampler }));
                        resolve(sampler);
                    }
                }).toDestination();
            } else {
                const fallbackSynth = new Tone.Synth().toDestination();
                setInstrumentCache((prev) => ({ ...prev, [instrumentName]: fallbackSynth }));
                resolve(fallbackSynth);
            }
        });
    };

    // Ažuriranje outputs
    const updateOutputs = (i) => {
        const num = parseInt(i, 10);
        if (isNaN(num)) return;
        if (outputs.length < num) {
            const newOutput = { id: num, volume: 0.8, pan: 0.5 };
            setOutputs((prev) => [...prev, newOutput]);
        } else {
            setOutputs((prev) => prev.filter((output) => output.id <= num));
        }
    };

    const handleGetNotes = async () => {
        setIsLoading(true);
        setGetNotes(!getNotes);
        setNotesLoaded(true);

        // HOME CEKAJ PROMISE
        await new Promise(resolve => setTimeout(resolve, 500));

        // Učitaj note i instrumente prije nego što dopustiš play
        const storedNotes = localStorage.getItem("notes");
        if (!storedNotes) {
            setIsLoading(false);
            return;
        }
        const notes = JSON.parse(storedNotes);
        const uniqueInstruments = [...new Set(notes.map(note => note.instrument))];

        // Učitavanje instrumenata i postavljanje statusa
        await Promise.all(uniqueInstruments.map(inst => getInstrument(inst)));
        setInstrumentsLoaded(true);
        setIsLoading(false);
    };

    const handlePlay = async () => {
        await Tone.start();
        Tone.getTransport().bpm.value = tempo;

        const storedNotes = localStorage.getItem("notes");
        if (!storedNotes) return;
        const notes = JSON.parse(storedNotes);
        if (!notes.length) return;

        // Sortiraj note po startX
        notes.sort((a, b) => a.startX - b.startX);

        const storedEffects = JSON.parse(localStorage.getItem("effects") || "[]");

        // Izračunaj effective volume i pan za svaku notu
        const effectiveNotes = notes.map((note) => {
            const output = outputs.find(o => o.id === note.output) || { volume: 1, pan: 0 };

            // Ako note.volume ili note.pan nisu definirani, koristi default vrijednosti
            const noteVolume = note.volume * 10 ?? 0.8 * 10;
            const notePan = note.pan ?? 0.5;
            const effectiveVolume = noteVolume * (output.volume ?? 1);
            const effectivePan = Math.max(-1, Math.min(1, notePan + (output.pan ?? 0)));

            // Filtriraj efekte koji pripadaju ovom outputu
            const outputEffects = storedEffects.filter(effect => effect.output === note.output);

            return { ...note, effectiveVolume, effectivePan, outputEffects };
        });

        // Ako effectiveVolume je 0, preskoči reprodukciju te note
        const events = effectiveNotes.map((note) => ({
            time: (note.startX / 50) * (60 / tempo),
            noteData: note
        }));

        const part = new Tone.Part(async (time, event) => {
            const { noteData } = event;

            // Ako je effectiveVolume 0, preskoči sviranje ove note
            if (noteData.effectiveVolume === 0) return;

            const inst = await getInstrument(noteData.instrument);

            // Kreiraj Gain i Panner čvorove s effective vrijednostima
            const gainNode = new Tone.Gain(noteData.effectiveVolume);
            const pannerNode = new Tone.Panner(noteData.effectivePan);

            // Početni čvor u signalnom lancu je gainNode
            let currentNode = gainNode;

            // Dodaj efekte iz outputa, ako ih ima
            noteData.outputEffects.forEach(effect => {
                let effectNode;
                switch (effect.type) {
                    case "reverb":
                        effectNode = new Tone.Reverb({
                            decay: 2.5,
                            wet: effect.strength
                        });
                        break;
                    case "delay":
                        effectNode = new Tone.FeedbackDelay({
                            wet: effect.strength,
                            delayTime: "8n",
                            feedback: 0.3
                        });
                        break;
                    case "distortion":
                        effectNode = new Tone.Distortion({
                            distortion: effect.strength,
                            wet: effect.strength
                        });
                        break;
                    case "auto-tune":
                        effectNode = new Tone.PitchShift({ pitch: 0, wet: effect.strength });
                        break;
                    default:
                        break;
                }
                if (effectNode) {
                    currentNode.connect(effectNode);
                    currentNode = effectNode;
                }
            });

            // Spoji zadnji čvor na panner
            currentNode.connect(pannerNode);
            // Spoji panner na izlaz (zvuk)
            pannerNode.connect(Tone.getDestination());
            // Ako je aktivno snimanje, spoji i na recording destinaciju
            if (recordingDestRef.current) {
                pannerNode.connect(recordingDestRef.current);
            }

            const noteStr = Tone.Frequency(noteData.tone, "midi").toNote();
            const durationSeconds = (noteData.duration ?? 1) * (60 / tempo);

            // Preusmjeri instrument signal na naš gainNode
            inst.disconnect();
            inst.connect(gainNode);

            inst.triggerAttackRelease(noteStr, durationSeconds, time);
        }, events);

        part.start(0);
        Tone.getTransport().start();
        setIsPlaying(true);

        progressIntervalRef.current = setInterval(() => {
            setProgress(Tone.getTransport().seconds);
        }, 100);
    };

    const handleStop = () => {
        Tone.getTransport().stop();
        Tone.getTransport().cancel();
        setIsPlaying(false);
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
        }
    };

    // Handler za snimanje
    const handleRecord = async () => {
        if (!isRecording) {
            // Započni snimanje
            setIsRecording(true);
            recordedChunksRef.current = [];
            // Kreiraj MediaStream destination čvor
            recordingDestRef.current = Tone.context.createMediaStreamDestination();

            // Inicijaliziraj MediaRecorder s streamom
            mediaRecorderRef.current = new MediaRecorder(recordingDestRef.current.stream);
            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: "audio/wav" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.style.display = "none";
                a.href = url;
                a.download = "recording.wav";
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                alert("Recording saved as recording.wav");
            };

            mediaRecorderRef.current.start();

            // Pokreni reprodukciju pjesme (ako već nije pokrenuta)
            await handlePlay();
        } else {
            // Zaustavi snimanje i reprodukciju
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            handleStop();
            // Opcionalno: resetiraj recordingDestRef
            recordingDestRef.current = null;
        }
    };

    return (
        <div className="headerContainer">
            <h1 className="title" style={{ color: "rgb(120, 169, 208)", paddingLeft: "10px" }}>
                Studio Sessioner
            </h1>
            <label style={{ color: "rgb(166, 191, 234)" }}>
                Outputs:
                <input
                    className="playback-controls"
                    style={{ color: "white" }}
                    type="number"
                    onChange={(e) => updateOutputs(e.target.value)}
                    value={outputs.length}
                />
            </label>
            <div className="playback-controls">
                <label>
                    Tempo (BPM):{" "}
                    <input
                        type="number"
                        value={tempo}
                        onChange={(e) => setTempo(parseInt(e.target.value, 10))}
                    />
                </label>
                <button onClick={handleGetNotes} className="get-notes-btn">
                    Get Notes
                </button>
                {isLoading && <div className="loading-indicator">Loading Notes & Buffers...</div>}
                {isPlaying ? (
                    <button onClick={handleStop}>Stop</button>
                ) : (
                    <button onClick={handlePlay} disabled={!notesLoaded || !instrumentsLoaded || isRecording}>
                        Play
                    </button>
                )}
                {/* Gumb za snimanje */}
                <button onClick={handleRecord} disabled={!notesLoaded || !instrumentsLoaded} style={{ marginLeft: "10px" }}>
                    {isRecording ? "Stop Recording" : "Record"}
                </button>
            </div>

            <div className="progress-container">
                <label>Progress: {progress.toFixed(2)} sec</label>
            </div>
        </div>
    );
}

export default HomeHeader;
