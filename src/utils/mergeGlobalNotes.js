export function mergeGlobalNotes(fieldZoom)
{
  // Dohvati sve instance iz localStorage
  const storedInstances = localStorage.getItem("trackInstances");
  const trackInstances = storedInstances ? JSON.parse(storedInstances) : [];
  if (!trackInstances.length)
  {
    localStorage.setItem("notes", JSON.stringify([]));
    return;
  }

  let globalNotes = [];

  // Za svaku instancu, dohvatimo note koristeći ključ `track-{trackId}-notes`
  trackInstances.forEach(instance =>
  {
    const notesKey = `track-${instance.trackId}-notes`;
    const storedNotes = localStorage.getItem(notesKey);
    const instanceNotes = storedNotes ? JSON.parse(storedNotes) : [];
    const track = JSON.parse(localStorage.getItem("tracks")).find((t) => t.id === instance.trackId);
    if (!instanceNotes.length) return;

    // Za svaku notu, skaliraj note.startX (Sheets grid je 50px) u jedinice ProjectPlayer (fieldZoom)
    // i zbroji s instance.startX (koja je već u tim jedinicama)
    instanceNotes.forEach(note =>
    {
      const scaledNoteStartX = note.startX * (fieldZoom / 50);
      const globalStartX = instance.startX + scaledNoteStartX;

      // Koristimo instrument i output iz same note
      const globalNote = {
        id: note.id,           // Ako je potrebno, generiraj novu jedinstvenu vrijednost
        instrument: track.instrument,
        output: track.output,
        startX: globalStartX,
        tone: note.tone,
        duration: note.duration,
        volume: note.volume,
        panning: note.pan     // Ako se u noti zove 'pan', a ne 'panning'
      };

      globalNotes.push(globalNote);
    });
  });

  // Poredaj globalne note prema startX (od najmanjeg prema najvećem)
  globalNotes.sort((a, b) => a.startX - b.startX);

  // Spremi globalne note u localStorage pod ključem "notes"
  localStorage.setItem("notes", JSON.stringify(globalNotes));
}
