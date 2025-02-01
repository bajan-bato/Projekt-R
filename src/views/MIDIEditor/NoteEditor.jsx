import React, { useEffect, useState, useRef } from 'react'
import { useLocation } from 'react-router-dom';

function NoteEditor({ containerWidth })
{
    const ref = useRef(null);
    const [menuType, setMenuType] = useState("vol");
    const [activeSlider, setActiveSlider] = useState(null);
    const [isSliding, setIsSliding] = useState(false);

    // Učitavanje nota iz localStorage
    const location = useLocation();
    const { trackId } = location.state;
    const [notes, setNotes] = useState(() =>
    {
        const storedNotes = localStorage.getItem(`track-${trackId}-notes`);
        return storedNotes ? JSON.parse(storedNotes) : [];
    });

    // Spremanje promjena za note (sinkronizacija)
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

    const findCurrentSlider = (x) =>
    {
        return notes.find(note => note.startX <= x + 5 && note.startX > x - 15);
    }

    // Lijevi klik: pronalazi se slider, postavlja se kao aktivan i odmah se mijenja vrijednost (volume ili pan)
    const handleMouseDown = (e) =>
    {
        const rect = ref.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const currentSlider = findCurrentSlider(x);
        if (currentSlider)
        {
            setActiveSlider(currentSlider);
            setIsSliding(true);
            if (menuType === "vol")
            {
                setNotes(prevNotes =>
                    prevNotes.map(note =>
                        note.id === currentSlider.id ? { ...note, volume: 1 - y / rect.height } : note
                    )
                );
            } else
            {
                setNotes(prevNotes =>
                    prevNotes.map(note =>
                        note.id === currentSlider.id ? { ...note, pan: (1 - y / rect.height) - 0.5 } : note
                    )
                );
            }
        }
    }

    // Sliding: mijenja se vrijednost volume ili pan dok se mišem povlači slider
    const handleMouseMove = (e) =>
    {
        if (!isSliding || !activeSlider) return;
        const rect = ref.current.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const newValue = 1 - y / rect.height;
        if (menuType === "vol")
        {
            setNotes(prevNotes =>
                prevNotes.map(note =>
                    note.id === activeSlider.id ? { ...note, volume: newValue } : note
                )
            );
        } else
        {
            setNotes(prevNotes =>
                prevNotes.map(note =>
                    note.id === activeSlider.id ? { ...note, pan: newValue - 0.5 } : note
                )
            );
        }
        localStorage.setItem(`track-${trackId}-notes`, JSON.stringify(notes));
    }

    const handleMouseUp = () =>
    {
        setActiveSlider(null);
        setIsSliding(false);
    }

    const handleMenuChange = (e) =>
    {
        setMenuType(e.target.value);
    }

    return (
        <div
            className="note-edit"
            style={{
                position: "absolute",
                backgroundColor: "rgb(50, 72, 107)",
                height: "100%",
                width: containerWidth + "px",
                overflow: "hidden"
            }}
            ref={ref}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onContextMenu={(e) => e.preventDefault()}
        >
            <select name="menu-type" onChange={handleMenuChange} style={{ position: "sticky", top: 0 }}>
                <option value="vol">Volume</option>
                <option value="pan">Pan</option>
            </select>

            {/* Reference linija na 50% visine */}
            <div
                className="reference-line"
                style={{
                    position: "absolute",
                    bottom: "50%",
                    left: 0,
                    right: 0,
                    height: "1px",
                    backgroundColor: "red",
                    zIndex: 0
                }}
            ></div>

            {notes.map((note, index) => (
                <div
                    key={note.id || index}
                    className='note-volume'
                    style={{
                        position: "absolute",
                        minWidth: "10px", // Deblji slider
                        height: menuType === "vol"
                            ? (100 * note.volume) + "%"
                            : (100 * (note.pan + 0.5)) + "%",
                        backgroundColor: menuType === "vol" ? 'skyblue' : 'yellow',
                        color: "black",
                        left: (note.startX + 5) + "px",
                        bottom: "0px",
                        borderRadius: "2px",
                        zIndex: 1
                    }}
                ></div>
            ))}
        </div>
    );
}

export default NoteEditor;
