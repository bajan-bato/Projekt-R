import React, { useState, useEffect } from "react";
import Track from "./Track";
import "./TracksList.css";
import * as Tone from "tone"

function TracksList({ selectedTrack, setSelectedTrack, trackInstances, setTrackInstances })
{
    const [tracks, setTracks] = useState(() =>
    {
        const storedTracks = localStorage.getItem("tracks");
        return storedTracks ? JSON.parse(storedTracks) : [];
    });
    const [nextId, setNextId] = useState(() =>
    {
        const storedTracks = localStorage.getItem("tracks");
        const tracks = storedTracks ? JSON.parse(storedTracks) : [];
        return tracks.length > 0 ? Math.max(...tracks.map((t) => t.id)) + 1 : 1;
    });

    // Učitavanje trackova iz localStorage prilikom mountanja
    useEffect(() =>
    {
        const storedTracks = JSON.parse(localStorage.getItem("tracks")) || [];
        setTracks(storedTracks);
        const maxId = storedTracks.length > 0 ? Math.max(...storedTracks.map((t) => t.id)) : 0;
        setNextId(maxId + 1);
    }, []); // Ovo osigurava da se efekt pokreće samo pri mountanju

    // Spremanje trackova u localStorage prilikom promjene
    useEffect(() =>
    {
        localStorage.setItem("tracks", JSON.stringify(tracks));
    }, [tracks]);

    const addTrack = () =>
    {
        const defaultInstrument = instruments.length > 0 ? instruments[0].name : "acoustic-bass";
        const newTrack = {
            id: nextId,
            name: `Track ${nextId}`,
            output: 0,
            instrument: defaultInstrument,
            duration: 0
        };
        setTracks((prevTracks) => [...prevTracks, newTrack]);
        setNextId((prevId) => prevId + 1);
    };

    const removeTrack = (idToRemove) =>
    {
        setTracks((prevTracks) => prevTracks.filter((track) => track.id !== idToRemove));

        // Obriši sve povezane instance iz `trackInstances` i `localStorage`
        setTrackInstances((prevInstances) =>
        {
            const updatedInstances = prevInstances.filter(instance => instance.trackId !== idToRemove);
            localStorage.setItem("trackInstances", JSON.stringify(updatedInstances)); // ✅ Spremi u localStorage
            return updatedInstances;
        });
    };

    const updateTrack = (id, newData) =>
    {
        const updatedTracks = tracks.map(track =>
            track.id === id ? { ...track, ...newData } : track
        );
        localStorage.setItem("tracks", JSON.stringify(updatedTracks));
        setTracks(updatedTracks);
    };

    //instrumenti
    const [instruments, setInstruments] = useState([]);

    useEffect(() =>
    {
        const checkInstrumentsLoaded = setInterval(() =>
        {
            if (window.instrumentsLoaded && window.Soundfont)
            {
                clearInterval(checkInstrumentsLoaded);
                const instrumentNames = Object.keys(window.Soundfont);

                setInstruments(instrumentNames.map(name => ({
                    name,
                    sampler: new Tone.Sampler({
                        urls: window.Soundfont[name] || {}, // Provjera da nije undefined
                        release: 1
                    }).toDestination()
                })));
            }
        }, 500);
    }, []);


    return (
        <div className="tracksList">
            {tracks.map((track) => (
                <Track
                    key={track.id}
                    id={track.id}
                    name={track.name}
                    output={track.output}
                    onRemove={removeTrack}
                    onUpdate={updateTrack}
                    instruments={instruments}
                    instrument={track.instrument}
                    selectedTrack={selectedTrack}
                    setSelectedTrack={setSelectedTrack}
                />
            ))}
            <button
                onClick={addTrack}
                className="aaa"
            >Add Track</button>
        </div>
    );
}

export default TracksList;
