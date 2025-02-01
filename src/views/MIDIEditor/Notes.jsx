import React, { useRef, useEffect, useState } from "react";
import "./Notes.css";
import Sheets from "./Sheets";
import NoteEditor from "./NoteEditor";

function Notes({ fieldZoom })
{
    //klavir
    const tones = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
    const black = ["Db", "Eb", "Gb", "Ab", "Bb"];
    const double = ["D", "G", "A"];
    const keys = [];
    const octaves = 5;

    //container
    const [containerWidth, setContainerWidth] = useState(2000);

    for (let i = 1; i <= octaves; i++)
    {
        for (let j = 11; j >= 0; j--)
        {
            let toneID = `${tones[j]}${6-i}`;
            if (black.includes(tones[j]))
            {
                keys.push(<div key={toneID} className="cell black" id={toneID}>{tones[j]}</div>);
            } else
            {
                if (double.includes(tones[j]))
                {
                    keys.push(<div key={toneID} className="cell white double" id={toneID}>{tones[j]}</div>);
                } else
                {
                    keys.push(<div key={toneID} className="cell white" id={toneID}>{tones[j]}</div>);
                }
            }
        }
    }

    const pianoRef = useRef(null); //.piano
    const editRef = useRef(null); //.edit
    const noteEditRef = useRef(null); //.edit-content
    const noteEditorRef = useRef(null); //.note-editor

    useEffect(() =>
    {
        const editEl = editRef.current;
        const noteEditorEl = noteEditorRef.current;

        if (!editEl || !noteEditorEl) return;

        const handleEditScroll = () =>
        {
            // Vertikalni scroll za piano
            if (pianoRef.current)
            {
                pianoRef.current.scrollTop = editEl.scrollTop;
            }

            // Horizontalni scroll za note-editor
            noteEditorEl.scrollLeft = editEl.scrollLeft;
        };

        editEl.addEventListener("scroll", handleEditScroll);

        return () =>
        {
            editEl.removeEventListener("scroll", handleEditScroll);
        };
    }, []);

    const keyValues = keys.map((keyElement) => keyElement.key);

    return (
        <div className="notes">
            <div className="piano" ref={pianoRef}>
                {keys}
            </div>
            <div className="edit" ref={editRef}>
                <div className="edit-content" ref={noteEditRef} style={{ width: containerWidth + "px" }}>
                    <Sheets
                        containerWidth={containerWidth}
                        setContainerWidth={setContainerWidth}
                        keys={keys}
                        fieldZoom={fieldZoom}
                    />
                </div>
            </div>
            <div className="note-editor" ref={noteEditorRef}>
                <NoteEditor
                    containerWidth={containerWidth}
                />
            </div>
        </div>
    );
}

export default Notes;
