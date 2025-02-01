import React, { useState, useEffect } from "react";
import HomeHeader from "./HomeHeader";
import TracksList from "./TracksList";
import ProjectPlayer from "./ProjectPlayer";
import Outputs from "./Outputs.jsx";
import "./Home.css";
import { mergeGlobalNotes } from "../../utils/mergeGlobalNotes.js";

function Home() {
    const [selectedTrack, setSelectedTrack] = useState(null);

    const [tempo, setTempo] = useState(() => {
        const temp = localStorage.getItem("tempo");
        return temp && temp !== "undefined" ? JSON.parse(temp) : 120;
    })

    useEffect(() => {
        const temp = localStorage.getItem("tempo");
        setTempo(temp && temp !== "undefined" ? JSON.parse(temp) : 120);
    }, [])

    useEffect(() => {
        localStorage.setItem("tempo", JSON.stringify(tempo));
    }, [tempo])
    
    // Inicijalizacija trackInstances s podacima iz localStorage (ako postoje)
    const [trackInstances, setTrackInstances] = useState(() => {
        const storedInstances = localStorage.getItem("trackInstances");
        return storedInstances ? JSON.parse(storedInstances) : [];
    });

    // Spremanje trackInstances u localStorage kad se promijene
    useEffect(() => {
        localStorage.setItem("trackInstances", JSON.stringify(trackInstances));
    }, [trackInstances]);

    const fieldZoom = 20;

    // Postavljanje outputa
    const [outputs, setOutputs] = useState(() => {
        const outs = localStorage.getItem("outputs");
        const list = [];
        for (let i = 1; i <= 10; i++) {
            const newOutput = { id: i, volume: 0.8, pan: 0 };
            list.push(newOutput);
        }
        return outs && outs !== "undefined" ? JSON.parse(outs) : list;
    });

    // Učitavanje outputa prilikom mountanja
    useEffect(() => {
        const outs = localStorage.getItem("outputs");
        const list = [];
        for (let i = 1; i <= 10; i++) {
            const newOutput = { id: i, volume: 0.8, pan: 0.5 };
            list.push(newOutput);
        }
        setOutputs(outs && outs !== "undefined" ? JSON.parse(outs) : list);
    }, []);

    // Updateanje outputa u localStorage
    useEffect(() => {
        localStorage.setItem("outputs", JSON.stringify(outputs));
    }, [outputs]);

    const [effects, setEffects] = useState(() => {
        const storedEffects = localStorage.getItem("effects");
        return storedEffects && storedEffects !== "undefined" ? JSON.parse(storedEffects) : [];
    });

    // Učitavanje efekata iz localStorage pri prvom renderiranju
    useEffect(() => {
        const storedEffects = localStorage.getItem("effects");
        setEffects(storedEffects && storedEffects !== "undefined" ? JSON.parse(storedEffects) : []);
    }, []);

    // Updateanje efekata u localStorage kada se effects promijene
    useEffect(() => {
        localStorage.setItem("effects", JSON.stringify(effects));
    }, [effects]);

    //globalna lista svih nota
    const [getNotes, setGetNotes] = useState(false)
    useEffect(() => {
        mergeGlobalNotes(fieldZoom);
      }, [getNotes]);

    return (
        <div className="homepage">
            <HomeHeader
                outputs={outputs}
                setOutputs={setOutputs}
                getNotes={getNotes}
                setGetNotes={setGetNotes}
                tempo={tempo}
                setTempo={setTempo}
            />
            <TracksList
                selectedTrack={selectedTrack}
                setSelectedTrack={setSelectedTrack}
                trackInstances={trackInstances}
                setTrackInstances={setTrackInstances}
                fieldZoom={fieldZoom}
            />
            <ProjectPlayer
                selectedTrack={selectedTrack}
                trackInstances={trackInstances}
                setTrackInstances={setTrackInstances}
                fieldZoom={fieldZoom}
            />
            <Outputs
                effects={effects}
                setEffects={setEffects}
                outputs={outputs}
                setOutputs={setOutputs}
            />
        </div>
    );
}

export default Home;
