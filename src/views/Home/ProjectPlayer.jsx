import { useEffect, useRef, useState } from "react";
import "./ProjectPlayer.css"

function ProjectPlayer({ selectedTrack, trackInstances, setTrackInstances, fieldZoom })
{
    const [trackSpaces, setTrackSpaces] = useState([]);
    const [selectedInstance, setSelectedInstance] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [instanceDragOffset, setInstanceDragOffset] = useState({ x: 0, y: 0 });
    const [containerWidth, setContainerWidth] = useState(2000);
    const [isRemoving, setIsRemoving] = useState(false);
    const playerRef = useRef(null);

    // Pokretanjem aplikacije dodaju se ćelije
    useEffect(() =>
    {
        const spaces = [];
        const positions = [];
        for (let i = 0; i < containerWidth / fieldZoom; i++)
        {
            let newPosition = (
                <div
                    key={i}
                    id={i}
                    className="position"
                    style={{
                        width: fieldZoom,
                        minWidth: fieldZoom,
                    }}
                ></div>
            );
            positions.push(newPosition);
        }
        for (let i = 0; i < 20; i++)
        {
            let newSpace = (
                <div
                    key={i}
                    id={i}
                    className="track-space"
                    style={{
                        width: containerWidth + "px",
                    }}
                >
                    {positions}
                </div>
            );
            spaces.push(newSpace);
        }
        setTrackSpaces(spaces);
    }, [containerWidth, fieldZoom]);

    // Učitavanje instanci iz localStorage pri mountanju
    useEffect(() =>
    {
        const savedInstances = localStorage.getItem("trackInstances");
        if (savedInstances)
        {
            setTrackInstances(JSON.parse(savedInstances));
        }
    }, []);

    // Spremanje instanci u localStorage kad se promijene
    useEffect(() =>
    {
        localStorage.setItem("trackInstances", JSON.stringify(trackInstances));

        // Proširenje containera
        let maxRight = 0;
        trackInstances.forEach(instance =>
        {
            if (instance.endX + 300 > maxRight)
            {
                maxRight = instance.endX + 300;
            }
        });
        if (maxRight > containerWidth)
        {
            setContainerWidth(maxRight);
        }
    }, [trackInstances, containerWidth]);

    // Praćenje promjena u localStorage
    useEffect(() =>
    {
        const handleStorageChange = (e) =>
        {
            if (e.key === "trackInstances")
            {
                const savedInstances = localStorage.getItem("trackInstances");
                setTrackInstances(savedInstances ? JSON.parse(savedInstances) : []);
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () =>
        {
            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);

    // Funkcija koja pronalazi instancu na poziciji x, y
    const findInstance = (x, y) =>
    {
        return (
            trackInstances.find(
                (instance) =>
                    x >= instance.startX && x < instance.endX && y === instance.startY
            ) || null
        );
    };

    // handleMouseDown – kad se klikne, provjeravamo postoji li instanca na toj poziciji.
    // Ako postoji, postavljamo je kao odabranu i počinjemo s draganjem.
    const handleMouseDown = (e) =>
    {
        const rect = playerRef.current.getBoundingClientRect();
        const scrollX = playerRef.current.scrollLeft;
        const scrollY = playerRef.current.scrollTop;

        const x = Math.floor((e.clientX - rect.left + scrollX) / fieldZoom) * fieldZoom;
        const y = Math.floor((e.clientY - rect.top + scrollY) / 100) * 100;

        // Dobijemo širinu i visinu
        const playerWidth = playerRef.current.clientWidth;
        const playerHeight = playerRef.current.clientHeight;

        // Spriječi klik ako je na scrollbar-u
        if (e.clientX >= rect.left + playerWidth || e.clientY >= rect.top + playerHeight)
        {
            return;
        }

        if (e.button === 0)
        {
            const currentInstance = findInstance(x, y);
            if (currentInstance)
            {
                setSelectedInstance(currentInstance);
                // Izračunaj offset između klika i početne pozicije instance
                setInstanceDragOffset({
                    x: x - currentInstance.startX,
                    y: y - currentInstance.startY,
                });
                setIsDragging(true);
                return;
            } else if (selectedTrack)
            {
                let tmptracks = JSON.parse(localStorage.getItem("tracks"));
                let tmptrack = tmptracks.find((track) => track.id === selectedTrack);
                const newInstance = {
                    id: Date.now(),
                    trackId: selectedTrack,
                    type: "track",
                    startX: x,
                    startY: y,
                    endX: tmptrack.duration * fieldZoom + x,
                };
                setTrackInstances((prevs) => [...prevs, newInstance]);
            }
        }
        if (e.button === 2)
        {
            setIsRemoving(true);
            const currentInstance = findInstance(x, y);
            if (currentInstance)
            {
                setTrackInstances((prev) =>
                    prev.filter((instance) => instance.id !== currentInstance.id)
                );
            }
        }
    };

    // handleMouseMove – ako je drag aktivan, ažuriramo poziciju odabrane instance
    const handleMouseMove = (e) =>
    {
        if (!isDragging || !selectedInstance) return;

        const rect = playerRef.current.getBoundingClientRect();
        const scrollX = playerRef.current.scrollLeft;
        const scrollY = playerRef.current.scrollTop;

        // Trenutne koordinate miša (bez snapanja)
        const currentX = e.clientX - rect.left + scrollX;
        const currentY = e.clientY - rect.top + scrollY;

        // Novi x i y s offsetom
        const newX = currentX - instanceDragOffset.x;
        const newY = currentY - instanceDragOffset.y;

        // Snapanje: x snapamo na fieldZoom, y snapamo na 100
        const snappedX = Math.floor(newX / fieldZoom) * fieldZoom;
        const snappedY = Math.floor(newY / 100) * 100;

        // Ažuriraj instancu u trackInstances
        setTrackInstances((prevInstances) =>
            prevInstances.map((instance) =>
                instance.id === selectedInstance.id
                    ? {
                        ...instance,
                        startX: snappedX,
                        startY: snappedY,
                        endX: snappedX + (instance.endX - instance.startX), // očuvaj širinu instance
                    }
                    : instance
            )
        );
        // Također ažuriraj odabranu instancu
        setSelectedInstance((prev) =>
            prev ? { ...prev, startX: snappedX, startY: snappedY, endX: snappedX + (prev.endX - prev.startX) } : prev
        );
    };

    const handleMouseUp = (e) =>
    {
        setIsDragging(false);
        setSelectedInstance(null);
    };

    return (
        <div
            ref={playerRef}
            className="project-player"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onContextMenu={(e) => e.preventDefault()}
        >
            {trackSpaces}
            {trackInstances.map((instance) =>
            {
                const tracks = JSON.parse(localStorage.getItem("tracks")) || [];
                const tmpTrack = tracks.find((track) => track.id === instance.trackId) || {};
                function seededRandom(seed) {
                    let x = Math.sin(seed) * 10000;
                    return x - Math.floor(x);
                }
                
                // Generiranje RGB vrijednosti ovisno o tmpTrack.id
                const r = Math.floor(seededRandom(tmpTrack.id + 1) * 255);
                const g = Math.floor(seededRandom(tmpTrack.id + 2) * 255);
                const b = Math.floor(seededRandom(tmpTrack.id + 3) * 255);
                
                // Primjena na background color
                const trackColor = `rgb(${r}, ${g}, ${b}, 25%)`;
                return (
                    <div
                        key={instance.id}
                        className="track-instance"
                        style={{
                            position: "absolute",
                            height: "100px",
                            minWidth: `${tmpTrack.duration ? tmpTrack.duration * fieldZoom : fieldZoom}px`,
                            border: "1px solid rgba(0, 0, 0, 0.29)",
                            borderRadius: "5px",
                            boxSizing: "border-box",
                            left: instance.startX,
                            top: instance.startY,
                            backgroundColor: trackColor
                        }}
                    >
                        <h1 style={{textAlign: "center", userSelect: "none"}}>{tmpTrack.name}</h1>
                    </div>
                );
            })}
        </div>
    );
}

export default ProjectPlayer;
