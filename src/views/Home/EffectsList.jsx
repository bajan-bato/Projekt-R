import { useEffect, useState } from "react";

function EffectsList({ outputId, effects, setEffects })
{
    //dodavanje efekata
    const addEffect = () =>
    {
        const newEffect = {
            id: Date.now(),
            output: outputId,
            type: "reverb",
            strength: 1
        }
        setEffects(prev => [...prev, newEffect])
    };

    //efekti
    const pickEffect = ["reverb", "delay", "distortion", "auto-tune"];

    //updateEffect
    const updateEffect = (id, newEffect) =>
    {
        setEffects(prev => prev.map((ef) =>
            ef.id === id
                ? { ...ef, type: newEffect}
                : ef
        ));
    };
    const updateStrength = (id, newStrength) =>
        {
            setEffects(prev => prev.map((ef) =>
                ef.id === id
                    ? { ...ef, strength: newStrength / 100}
                    : ef
            ));
        };

    //remove effect
    const removeEffect = (id) => {
        setEffects(prev => prev.filter((ef) => ef.id !== id));
    }

    return (
        <div
            style={{
                width: "95%",
                border: "2px solid rgba(0, 0, 0, 0.32)",
                height: "50%",
                backgroundColor: "rgb(51, 64, 87)",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                overflowY: "hidden"
            }}
        >
            <button
                onClick={addEffect}
                style={{
                    width: "100%"
                }}
            >ADD EFFECT</button>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    overflowY: "auto",
                    overflowX: "hidden"
                }}
            >
                {effects
                    ?.filter(effect => effect.output === outputId)
                    .map((effect) => (
                        <div
                            key={`effect-${effect.id}`} className="form-control"
                            style={{
                                display: "flex",
                                flexWrap: "nowrap",
                                overflow: "hidden",
                                justifyContent: "center",
                                minWidth: "25%"
                            }}
                        >
                            <button 
                                key={`button-${effect}`}
                                onClick={() => removeEffect(effect.id)}
                                style={{
                                    backgroundColor: "red",
                                    textAlign: "center"
                                }}
                            >x</button>
                            <select
                                key={`type-${effect}`}
                                value={effect.type}
                                onChange={(e) => updateEffect(effect.id, e.target.value)}
                            >
                                {pickEffect.map((ef) => (
                                    <option key={ef}value={ef}>{ef}</option>
                                ))}
                            </select>
                            <input 
                                type="number"
                                step="5"
                                min="0"
                                max="100" 
                                value={effect.strength * 100}
                                onChange={(e) => updateStrength(effect.id, e.target.value)}
                                style={{
                                    minWidth: "25%"
                                }}
                            />
                        </div>
                    ))}
            </div>
        </div>
    );
}

export default EffectsList;