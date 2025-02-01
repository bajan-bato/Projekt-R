import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from "react-router-dom";
import "./Sheets.css"
import * as Tone from "tone";

function Sheets({ containerWidth, setContainerWidth, keys })
{
    const location = useLocation();
    const { trackId } = location.state;

    // 1. State za pratiti promjene tracka
    const [currentTrack, setCurrentTrack] = useState(() =>
    {
        const storedTracks = JSON.parse(localStorage.getItem("tracks")) || [];
        return storedTracks.find(t => t.id === trackId) || {};
    });

    useEffect(() =>
    {
        const interval = setInterval(() =>
        {
            const storedTracks = JSON.parse(localStorage.getItem("tracks")) || [];
            setCurrentTrack(storedTracks.find(t => t.id === trackId) || {});
        }, 500);

        return () => clearInterval(interval); // Očisti interval kada se komponenta unmounta
    }, [trackId]); // Pokreće se svaki put kad se promijeni trackId


    const instrumentName = currentTrack?.instrument;
    const [instrument, setInstrument] = useState(null);
    const [notes, setNotes] = useState(() =>
    {
        const savedNotes = localStorage.getItem(`track-${trackId}-notes`);
        return savedNotes ? JSON.parse(savedNotes) : [];
    });

    // 2. Efekt za pratiti promjene u localStorage
    useEffect(() =>
    {
        const interval = setInterval(() =>
        {
            // Provjeri note
            const storedNotes = JSON.parse(localStorage.getItem(`track-${trackId}-notes`) || '[]');
            setNotes(prevNotes =>
            {
                if (JSON.stringify(prevNotes) !== JSON.stringify(storedNotes)) return storedNotes;
                return prevNotes;
            });

            // Provjeri track
            const storedTracks = JSON.parse(localStorage.getItem("tracks") || '[]');
            const storedTrack = storedTracks.find(t => t.id === trackId);
            if (storedTrack && JSON.stringify(storedTrack) !== JSON.stringify(currentTrack))
            {
                setCurrentTrack(storedTrack);
            }
            {
                setCurrentTrack(storedTrack);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [trackId, currentTrack]);

    // 3. Efekt za update instrumenata i outputa u notama
    useEffect(() =>
    {
        if (!currentTrack) return;

        const needsUpdate = notes.some(note =>
            note.instrument !== currentTrack.instrument ||
            note.output !== (currentTrack.output ?? 1)
        );

        if (needsUpdate)
        {
            const updatedNotes = notes.map(note => ({
                ...note,
                instrument: currentTrack.instrument,
                output: currentTrack.output ?? 1
            }));

            // Provjeri da li su stvarno drugačije
            if (JSON.stringify(notes) !== JSON.stringify(updatedNotes))
            {
                setNotes(updatedNotes);
                localStorage.setItem(`track-${trackId}-notes`, JSON.stringify(updatedNotes));
            }
        }
    }, [currentTrack?.instrument, currentTrack?.output, trackId]);

    // 4. Inicijalizacija instrumenta
    useEffect(() =>
    {
        if (window.Soundfont && window.Soundfont[instrumentName])
        {
            const sampler = new Tone.Sampler({
                urls: window.Soundfont[instrumentName],
                release: 1
            }).toDestination();
            setInstrument(sampler);
        }
    }, [instrumentName]);

    const [isDragging, setIsDragging] = useState(false);
    const [activeNote, setActiveNote] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isRemoving, setIsRemoving] = useState(false);
    const containerRef = useRef(null);

    //gridlines
    const [grids, setGrids] = useState([]);
    const [dividers, setDividers] = useState([])
    const [gridAmount, setGridAmount] = useState(() =>
    {
        return Math.ceil(containerWidth / 50);
    });

    //sviranje tona
    let lastPlayedNote = null;
    const playNote = async (midiNumber) =>
    {
        if (midiNumber !== lastPlayedNote)
        {
            lastPlayedNote = midiNumber;
            const noteName = Tone.Frequency(midiNumber, "midi").toNote();

            if (instrument && instrument.loaded)
            {
                // 1. Dohvati efekte iz localStorage
                let effectsData = localStorage.getItem("effects");
                effectsData = effectsData ? JSON.parse(effectsData) : [];
                // Filtriraj efekte za output ovog tracka (track.output)
                const relevantEffects = effectsData.filter(
                    effect => effect.output === currentTrack.output
                );
                // Sortiraj efekte po id-u (od manjeg prema većem)
                relevantEffects.sort((a, b) => a.id - b.id);

                // 2. Dohvati output postavke iz localStorage
                const storedOutputs = localStorage.getItem("outputs");
                const outputsList = storedOutputs ? JSON.parse(storedOutputs) : [];
                const outputObj =
                    outputsList.find(o => o.id === currentTrack.output) || { volume: 1, pan: 0 };

                // 3. Odredi note volume i pan; koristi activeNote ako postoji, inače default vrijednosti
                const noteVolume = (activeNote && activeNote.volume) || 0.8;
                const notePan = (activeNote && activeNote.pan) || 0.5;

                // Kombiniraj note volume i output volume
                const effectiveVolume = noteVolume * outputObj.volume * 10;
                // Kombiniraj note pan i output pan, clampaj na [-1, 1]
                const effectivePan = Math.max(-1, Math.min(1, notePan + outputObj.pan));

                // 4. Kreiraj efektni chain koristeći Tone.Gain s postavljenim effectiveVolume
                const chainGain = new Tone.Gain(effectiveVolume);
                instrument.disconnect(); // ukloni postojeće veze
                instrument.connect(chainGain);
                let currentNode = chainGain;

                // 5. Spoji svaki relevantni efekt u chain
                relevantEffects.forEach(effect =>
                {
                    let effectNode;
                    switch (effect.type)
                    {
                        case "reverb":
                            effectNode = new Tone.Reverb({
                                decay: 2.5,
                                wet: Math.min(effect.strength * 1.2, 0.8)
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
                            // Simulacija auto-tune koristeći Tone.PitchShift (nije pravi auto-tune)
                            effectNode = new Tone.PitchShift({
                                pitch: 0,
                                wet: effect.strength
                            });
                            break;
                        default:
                            break;
                    }
                    if (effectNode)
                    {
                        currentNode.connect(effectNode);
                        currentNode = effectNode;
                    }
                });

                // 6. Dodaj panner node s effectivePan
                const pannerNode = new Tone.Panner(effectivePan);
                currentNode.connect(pannerNode);
                currentNode = pannerNode;

                // 7. Spoji zadnji čvor na Tone.getDestination()
                currentNode.connect(Tone.getDestination());

                // 8. Triggeriraj reprodukciju note
                instrument.triggerAttackRelease(noteName, "8n");

                // Opcionalno: nakon kratkog vremena vrati instrument da se spaja direktno na Destination,
                // tako da efektni chain ne ostane trajno priključen instrumentu.
                setTimeout(() =>
                {
                    instrument.disconnect();
                    instrument.toDestination();
                }, 500);
            }
        }
    };



    //pretvorba visine Y u ton
    const yToMidi = (y) =>
    {
        const lowestMidi = 22; // Bb1
        const highestMidi = 83; // B5
        const totalKeys = 5 * 12; // 5 oktava × 12 tonova = 60 tipki

        // Mapiranje Y koordinata na MIDI raspon
        let midi = Math.ceil(highestMidi - (y / 20) * (highestMidi - lowestMidi) / totalKeys);
        return Math.max(lowestMidi, Math.min(highestMidi, midi)); // Ograniči u MIDI raspon
    };


    useEffect(() =>
    {
        const newGrids = Array.from({ length: gridAmount }, (_, index) => (
            <div key={index} className="grid" />
        ));
        const newDividers = Array.from({ length: gridAmount / 4 }, (_, index) => (
            <div key={index} className="divider"></div>
        ));
        setGrids(newGrids);
        setDividers(newDividers);
    }, [gridAmount]);

    // Učestalo provjeravamo localStorage i sinkroniziramo notes
    useEffect(() =>
    {
        const interval = setInterval(() =>
        {
            const storedNotes = JSON.parse(localStorage.getItem(`track-${trackId}-notes`) || '[]');
            setNotes(prevNotes =>
                JSON.stringify(prevNotes) !== JSON.stringify(storedNotes)
                    ? storedNotes
                    : prevNotes
            );
        }, 100);

        return () => clearInterval(interval);
    }, [trackId]);


    const findCurrentNote = (x, y) =>
    {
        return notes.find(note =>
        {
            const noteXEnd = note.startX + 50 * note.duration;
            const noteYEnd = note.startY + 20;
            return (
                x >= note.startX &&
                x <= noteXEnd &&
                y >= note.startY &&
                y <= noteYEnd
            );
        });
    };

    const handleMouseDown = (e) =>
    {
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Lijevi klik
        if (e.button === 0)
        {
            const currentNote = findCurrentNote(x, y);
            if (currentNote)
            {
                setIsDragging(true);
                setActiveNote(currentNote);
                setDragOffset({
                    x: x - currentNote.startX,
                    y: y - currentNote.startY
                });
                playNote(currentNote.tone); //odsvira se nota
            } else
            {
                // Stvaranje nove note
                const newNote = {
                    id: Date.now(),
                    startX: Math.floor(x / 50) * 50,
                    startY: Math.floor(y / 20) * 20,
                    tone: yToMidi(Math.floor(y / 20) * 20),
                    instrument: currentTrack.instrument,
                    output: currentTrack.output ?? 1,
                    duration: 1,
                    volume: 0.8,
                    pan: 0
                };
                setNotes(prev => [...prev, newNote]);
                setActiveNote(newNote);
                playNote(newNote.tone); //odsvira se ton
            }
        }

        // Desni klik
        if (e.button === 2)
        {
            setIsRemoving(true);
            const currentNote = findCurrentNote(x, y);
            if (currentNote)
            {
                setNotes(prev => prev.filter(note => note.id !== currentNote.id));
            }
        }
    };

    const handleMouseUp = (e) =>
    {
        setIsDragging(false);
        setIsRemoving(false);

        // Ažuriraj duration samo ako nije bilo draganja
        if (e.button === 0 && activeNote && !isDragging)
        {
            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const duration = Math.max(1, Math.ceil((x - activeNote.startX) / 50));

            setNotes(prevNotes =>
                prevNotes.map(note =>
                    note.id === activeNote.id
                        ? { ...note, duration }
                        : note
                )
            );
        }
    };

    const handleMouseMove = (e) =>
    {
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Brisanje nota tijekom desnog klika
        if (isRemoving)
        {
            const currentNote = findCurrentNote(x, y);
            if (currentNote)
            {
                setNotes(prev => prev.filter(note => note.id !== currentNote.id));
            }
        }

        // Pomicanje note
        if (isDragging && activeNote)
        {
            const newX = x - dragOffset.x;
            const newY = Math.floor((y - dragOffset.y) / 20) * 20;
            const newTone = yToMidi(newY);

            //sviranje note ako se promijeni visina tona
            if (newTone !== activeNote.tone)
            {
                playNote(newTone);
            }

            setNotes(prevNotes =>
                prevNotes.map(note =>
                    note.id === activeNote.id
                        ? {
                            ...note,
                            startX: Math.floor(newX / 50) * 50,
                            startY: newY,
                            tone: yToMidi(newY)
                        }
                        : note
                )
            );
        }
    };

    // Kad god se notes promijeni, snimi ih i provjeri trebamo li proširiti containerWidth
    useEffect(() =>
    {
        // Spremi note u localStorage
        localStorage.setItem(`track-${trackId}-notes`, JSON.stringify(notes));

        // Izračunaj najdalji desni rub (maxRight)
        let maxRight = 0;
        notes.forEach(note =>
        {
            const noteRightEdge = note.startX + (50 * note.duration);
            if (noteRightEdge > maxRight)
            {
                maxRight = noteRightEdge;
            }
        });

        // Updateanje durationa traka
        const tracks = JSON.parse(localStorage.getItem("tracks"));
        const tracksEdited = tracks.map(track =>
            track.id === trackId ? { ...track, duration: maxRight / 50 } : track
        );
        localStorage.setItem("tracks", JSON.stringify(tracksEdited));

        // Definiraj marginu (razmak) koji želiš zadržati
        const margin = 600;

        // Ako su note proširile container, proširi ga;
        // inače, ako je container preširok, smanji ga.
        if (maxRight + margin > containerWidth)
        {
            setContainerWidth(prev => prev + margin);
            setGridAmount(prev => prev + 6);
        }
    }, [notes, trackId, containerWidth, setContainerWidth]);

    useEffect(() =>
    {
        // Funkcija koja dohvaća trenutni instrument tracka i ažurira sve note
        const updateNotesInstrument = () =>
        {
            const storedTracks = localStorage.getItem("tracks");
            if (storedTracks)
            {
                const tracks = JSON.parse(storedTracks);
                const currentTrack = tracks.find(t => t.id === trackId);
                if (currentTrack)
                {
                    // Ako instrument nota nije isti kao u tracku, ažuriraj sve note
                    const updatedNotes = notes.map(note => ({
                        ...note,
                        instrument: currentTrack.instrument
                    }));
                    // Samo ako se nešto promijenilo (možeš provjeriti JSON.stringify)
                    if (JSON.stringify(updatedNotes) !== JSON.stringify(notes))
                    {
                        setNotes(updatedNotes);
                        localStorage.setItem(`track-${trackId}-notes`, JSON.stringify(updatedNotes));
                    }
                }
            }
        };

        // Pokreni odmah, a zatim svakih 1000ms (1 sekunda)
        updateNotesInstrument();
        const intervalId = setInterval(updateNotesInstrument, 1000);
        return () => clearInterval(intervalId);
    }, [trackId, notes, currentTrack.instrument]);


    return (
        <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onContextMenu={(e) => e.preventDefault()}
            style={{
                position: "relative",
                height: "100vh",
                cursor: isDragging ? "grabbing" : "default"
            }}
        >
            <div className='grids-keys-container'>
                <div className='dividers'>
                    {dividers}
                </div>
                <div className='grids'>
                    {grids}
                </div>
                <div className='keys'>
                    {keys}
                </div>
            </div>
            {notes.map((note) => (
                <div
                    key={note.id}
                    className='note'
                    style={{
                        position: "absolute",
                        left: note.startX,
                        top: note.startY,
                        width: 50 * note.duration,
                        height: 20,
                        backgroundColor: "rgb(166, 255, 0)",
                        borderRadius: "5px",
                        boxSizing: "border-box"
                    }}
                />
            ))}
        </div>
    );
}

export default Sheets;
