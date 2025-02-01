import React from "react";
import { useLocation } from "react-router-dom";
import Notes from "./Notes";
import Settings from "./Settings";
import "./MIDIEditor.css";

function MIDIEditor() {
    const location = useLocation();
    const { trackId, trackName, fieldZoom } = location.state || {};
    return (
        <div className="editor">
            <div className="settings-list">
                <Settings id={trackId} name={trackName}/>
            </div>
            <div className="notes-list">
                <Notes 
                    fieldZoom={fieldZoom}
                />
            </div>
        </div>
    );
}

export default MIDIEditor;
