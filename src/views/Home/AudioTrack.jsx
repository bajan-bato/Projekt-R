import React from "react";
import "./AudioTrack.css";

function AudioTrack({
    id,
    name,
    output,
    start,
    end,
    src,
    onRemove,
    onUpdate,
    selectedTrack,
    setSelectedTrack
})
{
    const handleNameChange = (e) =>
    {
        onUpdate(id, { name: e.target.value });
    };

    const handleOutputChange = (e) =>
    {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value >= 0)
        {
            onUpdate(id, { output: value });
        }
    };

    const handleStartChange = (e) =>
    {
        onUpdate(id, { start: e.target.value });
    };

    const handleEndChange = (e) =>
    {
        onUpdate(id, { end: e.target.value });
    };

    const handleFileChange = (e) =>
    {
        const file = e.target.files[0];
        if (file)
        {
            // Kreiramo privremeni URL za odabranu datoteku
            const fileUrl = URL.createObjectURL(file);
            onUpdate(id, { src: fileUrl });
        }
    };

    const handleSelectButton = () =>
    {
        setSelectedTrack(id);
    };

    return (
        <div className="audio-track">
            <button onClick={() => onRemove(id)}>Remove</button>
            <input
                type="number"
                placeholder="Output"
                value={output}
                onChange={handleOutputChange}
            />
            <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={handleNameChange}
            />
            <div className="time-controls">
                <input
                    type="number"
                    placeholder="Start (sec)"
                    value={start}
                    onChange={handleStartChange}
                    step="0.01"
                    min="0"
                />
                <input
                    type="number"
                    placeholder="End (sec)"
                    value={end}
                    onChange={handleEndChange}
                    step="0.01"
                    min="0"
                />
            </div>
            <input type="file" accept=".mp3, .wav" onChange={handleFileChange} />
            {src && (
                <div>
                    <p>Loaded file: {src}</p>
                </div>
            )}
            <button onClick={handleSelectButton}>
                {selectedTrack === id ? "Selected" : "Select"}
            </button>
        </div>
    );
}

export default AudioTrack;
