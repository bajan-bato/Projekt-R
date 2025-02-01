import { useRef } from "react";
import EffectsList from "./EffectsList.jsx";

function Outputs({ effects, setEffects, outputs, setOutputs })
{
    const volRef = useRef(null);
    const panRef = useRef(null);

    // Handler za volume slider
    const handleVolumeMouseDown = (e, outputId) =>
    {
        e.preventDefault();
        const container = e.currentTarget.parentElement;
        const rect = container.getBoundingClientRect();
        const containerHeight = rect.height;

        const handleMouseMove = (moveEvent) =>
        {
            const newVolume = Math.min(
                Math.max((rect.bottom - moveEvent.clientY) / containerHeight, 0),
                1
            );
            setOutputs((prevOutputs) =>
                prevOutputs.map((output) =>
                    output.id === outputId ? { ...output, volume: newVolume } : output
                )
            );
        };

        const handleMouseUp = () =>
        {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    // Handler za panning slider
    const handlePanMouseDown = (e, outputId) =>
    {
        e.preventDefault();
        const container = e.currentTarget.parentElement;
        const rect = container.getBoundingClientRect();
        const containerHeight = rect.height;

        const handleMouseMove = (moveEvent) =>
        {
            const newPan = Math.max((rect.bottom - moveEvent.clientY) / containerHeight, 0) - 0.5
            setOutputs((prevOutputs) =>
                prevOutputs.map((output) =>
                    output.id === outputId ? { ...output, pan: newPan } : output
                )
            );
        };

        const handleMouseUp = () =>
        {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    // Resetiranje volumena i panninga
    const resetOutput = (id) =>
    {
        setOutputs((outs) =>
            outs.map((output) =>
                output.id === id ? { ...output, volume: 0.8, pan: 0 } : output
            )
        );
    };

    return (
        <div
            className="outputs"
            style={{
                position: "relative",
                display: "flex",
                justifyContent: "space-evenly",
                alignItems: "center",
                overflowY: "hidden",
                overflowX: "auto",
            }}
        >
            {outputs.map((output) => (
                <div
                    key={output.id}
                    className="output-box"
                    style={{
                        position: "relative", // Dodajemo position: relative ovdje
                        height: "100%",
                        minWidth: "10%",
                        backgroundColor: "rgb(53, 71, 104)",
                        boxSizing: "content-box",
                        border: "1px solid rgba(0, 0, 0, 0.34)",
                        display: "flex",
                        justifyContent: "space-evenly",
                        flexWrap: "wrap",
                    }}
                >
                    {/* Reset button smješten apsolutno u gornjem lijevom kutu */}
                    <button
                        onClick={() => resetOutput(output.id)}
                        style={{
                            position: "absolute",
                            top: "5px",
                            left: "5px",
                            zIndex: 1,
                        }}
                    >
                        ↻
                    </button>

                    {/* Volume */}
                    <div
                        key={`volume-dent-${output.id}`}
                        className="volume-dent"
                        style={{
                            height: "40%",
                            backgroundColor: "black",
                            width: "5%",
                            marginTop: "10px",
                            position: "relative",
                        }}
                    >
                        <div
                            key={`volume-slider-${output.id}`}
                            ref={volRef}
                            className="volume-slider"
                            style={{
                                height: output.volume * 100 + "%",
                                backgroundColor: "lightgreen",
                                width: "100%",
                                marginTop: "10px",
                                position: "absolute",
                                bottom: "0px",
                            }}
                            onMouseDown={(e) => handleVolumeMouseDown(e, output.id)}
                        ></div>
                    </div>

                    {/* Panning */}
                    <div
                        key={`panning-dent-${output.id}`}
                        className="volume-dent"
                        style={{
                            height: "40%",
                            backgroundColor: "black",
                            width: "5%",
                            marginTop: "10px",
                            position: "relative",
                        }}
                    >
                        <div
                            key={`panning-slider-${output.id}`}
                            ref={panRef}
                            className="panning-slider"
                            style={{
                                height: `${(output.pan + 0.5) * 100}%`,
                                backgroundColor: "yellow",
                                width: "100%",
                                marginTop: "10px",
                                position: "absolute",
                                bottom: "0px",
                            }}
                            onMouseDown={(e) => handlePanMouseDown(e, output.id)}
                        ></div>
                    </div>

                    <EffectsList
                        outputId={output.id}
                        effects={effects}
                        setEffects={setEffects}
                    />
                </div>
            ))}
        </div>
    );
}

export default Outputs;
