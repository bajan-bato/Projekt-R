import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Track.css";

function Track({ id, name, output, onRemove, onUpdate, instruments, instrument, selectedTrack, setSelectedTrack, fieldZoom })
{
    const navigate = useNavigate();

    const handleOutputChange = (e) =>
    {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value >= 0)
        {
            onUpdate(id, { output: value });
        }
    };

    const handleNameChange = (e) =>
    {
        onUpdate(id, { name: e.target.value });
    };


    const handleInstrumentChange = (e) =>
    {
        onUpdate(id, { instrument: e.target.value });
    };

    const handleRemove = (e) =>
    {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to remove Track ${id}?`))
        {
            onRemove(id);
        }
    };

    const handleEditButton = (e) =>
    {
        navigate("/MIDIeditor", { state: { trackId: id, trackName: name, fieldZoom: fieldZoom } });
    };

    const handleSelectButton = (e) =>
    {
        setSelectedTrack(id);
    }

    return (
        <div
            className="track" key={id}>
            <button onClick={handleRemove}>Remove</button>
            <input
                type="number"
                placeholder="Output"
                className="trackOutput"
                value={output || ""}
                onChange={handleOutputChange}
                onClick={(e) => e.stopPropagation()}
            />
            <input
                type="text"
                placeholder={`Track ${id}`}
                className="trackName"
                value={name}
                onChange={handleNameChange}
                onClick={(e) => e.stopPropagation()}
            />
            <select
                className="instrument"
                onChange={handleInstrumentChange}
                value={instrument || ""}
            >
                {instruments.map((instrument) => (
                    <option key={instrument.name} value={instrument.name}>{instrument.name}</option>
                ))}
            </select>
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                width: "70%",
                height: "15%"
            }}>

                <button
                    className="btn btn-success mb-4"
                    onClick={handleEditButton}
                >
                    Edit track
                </button>
                <button
                    id={id}
                    onClick={handleSelectButton}>
                    {selectedTrack === id
                        ? "Selected"
                        : "Select"}
                </button>
            </div>
        </div>
    );
}

export default Track;
